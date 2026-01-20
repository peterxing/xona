import { Keypair } from '@solana/web3.js';
import Ajv from 'ajv';
import { discoverResources, getResourceDetail } from './discovery.js';
import {
  createKeypairFromPrivateKey,
  createV1PaymentSignature,
  createV2PaymentSignature,
  getPublicKeyAddress,
  selectPaymentRequirement,
} from './signer.js';
import {
  ResourceDetail,
  ResourceListItem,
  X402ChallengeV1,
  X402ChallengeV2,
} from './types/index.js';

const API_BASE_URL = 'https://api.xona-agent.com';

export interface XonaClientConfig {
  privateKey: string;
  apiBaseUrl?: string;
}

export interface ExecuteResourceResult<T = any> {
  data: T;
  settlement?: {
    transaction: string;
    network: string;
    payer: string;
  };
}

/**
 * Main XonaClient class for interacting with x402 resources
 */
export class XonaClient {
  private keypair: Keypair;
  private apiBaseUrl: string;
  private ajv: Ajv;

  constructor(config: XonaClientConfig) {
    this.keypair = createKeypairFromPrivateKey(config.privateKey);
    this.apiBaseUrl = config.apiBaseUrl || API_BASE_URL;
    this.ajv = new Ajv({ allErrors: true });
  }

  /**
   * Get the public key address of the client's wallet
   */
  getPublicKey(): string {
    return getPublicKeyAddress(this.keypair);
  }

  /**
   * Discover all available resources
   */
  async discoverResources(): Promise<ResourceListItem[]> {
    return discoverResources();
  }

  /**
   * Get detailed information about a specific resource
   */
  async resourceDetail(slug: string): Promise<ResourceDetail> {
    return getResourceDetail(slug);
  }

  /**
   * Validate payload against a JSON schema
   */
  private validatePayload(payload: any, schema: any): void {
    const validate = this.ajv.compile(schema);
    const valid = validate(payload);
    
    if (!valid) {
      const errors = validate.errors?.map((err: any) => 
        `${err.instancePath || 'root'} ${err.message}`
      ).join(', ');
      throw new Error(`Payload validation failed: ${errors}`);
    }
  }

  /**
   * Handle 402 Payment Required response
   */
  private async handle402Payment(
    challenge: X402ChallengeV1 | X402ChallengeV2,
    version: 'v1' | 'v2',
    paymentRequirement: any
  ): Promise<string> {
    if (version === 'v1') {
      const v1Challenge = challenge as X402ChallengeV1;
      if (!v1Challenge.paymentId) {
        throw new Error('v1 challenge missing paymentId');
      }
      return createV1PaymentSignature(this.keypair, v1Challenge.paymentId, paymentRequirement);
    } else {
      const v2Challenge = challenge as X402ChallengeV2;
      if (!v2Challenge.nonce) {
        throw new Error('v2 challenge missing nonce');
      }
      return createV2PaymentSignature(this.keypair, v2Challenge.nonce, paymentRequirement);
    }
  }

  /**
   * Execute a resource with the given payload
   */
  async executeResource<T = any>(
    slug: string,
    payload: Record<string, any>
  ): Promise<ExecuteResourceResult<T>> {
    // Step 1: Get resource details
    const resource = await this.resourceDetail(slug);
    const version = resource.version || resource.x402_version || 'v1';

    // Step 2: Validate payload against schema
    if (resource.input_schema) {
      this.validatePayload(payload, resource.input_schema);
    }

    // Step 3: Make initial request
    const endpoint = `${this.apiBaseUrl}/${slug}`;
    let response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // Step 4: Handle 402 Payment Required
    if (response.status === 402) {
      const challengeBody = await response.json();
      
      // Select payment requirement
      const targetNetwork = challengeBody.network || resource.pricing.network || 'solana-mainnet';
      const paymentRequirement = selectPaymentRequirement(
        challengeBody.accepts || [],
        targetNetwork
      );

      if (!paymentRequirement) {
        throw new Error('Unable to satisfy payment requirements for this request');
      }

      // Create payment signature
      const signature = await this.handle402Payment(
        challengeBody,
        version,
        paymentRequirement
      );

      // Retry with payment header
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (version === 'v1') {
        headers['X-PAYMENT'] = signature;
      } else {
        // v2 uses PAYMENT-SIGNATURE header with CAIP-2 format
        const chainId = paymentRequirement.network.startsWith('solana:')
          ? paymentRequirement.network
          : `solana:${paymentRequirement.network}`;
        headers['PAYMENT-SIGNATURE'] = `${chainId}:${signature}`;
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      // If still 402, payment failed
      if (response.status === 402) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(
          errorBody.error || 'Payment could not be settled. Please ensure you have sufficient USDC.'
        );
      }
    }

    // Step 5: Parse response
    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error || errorJson.message || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    const contentType = response.headers.get('content-type') || '';
    let data: T;
    
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as any;
    }

    // Extract settlement information from headers
    const paymentResponseHeader = response.headers.get('X-PAYMENT-RESPONSE');
    let settlement: ExecuteResourceResult<T>['settlement'] | undefined;

    if (paymentResponseHeader) {
      try {
        const settlementData = JSON.parse(atob(paymentResponseHeader));
        settlement = {
          transaction: settlementData.transaction || settlementData.txId || '',
          network: settlementData.network || resource.pricing.network || '',
          payer: settlementData.payer || this.getPublicKey(),
        };
      } catch (error) {
        // Ignore parsing errors for settlement header
      }
    }

    return {
      data,
      settlement,
    };
  }
}

