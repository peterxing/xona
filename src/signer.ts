import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import nacl from 'tweetnacl';
import { PaymentRequirement } from './types/index.js';

/**
 * Initialize a Solana Keypair from a base58 private key string
 */
export function createKeypairFromPrivateKey(privateKey: string): Keypair {
  try {
    const secretKey = bs58.decode(privateKey);
    
    // Solana keypairs are 64 bytes (32 byte seed + 32 byte public key)
    if (secretKey.length === 64) {
      return Keypair.fromSecretKey(secretKey);
    } else if (secretKey.length === 32) {
      // If it's just the seed, create keypair from seed
      return Keypair.fromSeed(secretKey);
    } else {
      throw new Error(`Invalid key length: expected 32 or 64 bytes, got ${secretKey.length}`);
    }
  } catch (error) {
    throw new Error(`Invalid private key format: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get the public key address from a keypair
 */
export function getPublicKeyAddress(keypair: Keypair): string {
  return keypair.publicKey.toBase58();
}

/**
 * Sign a message with the keypair using ed25519
 */
export function signMessage(keypair: Keypair, message: Uint8Array): Uint8Array {
  // tweetnacl signs with the full 64-byte Ed25519 secret key
  // (32-byte private seed + 32-byte public key), matching Solana Keypair.secretKey.
  if (keypair.secretKey.length !== nacl.sign.secretKeyLength) {
    throw new Error(
      `Invalid Solana secret key length: expected ${nacl.sign.secretKeyLength} bytes, got ${keypair.secretKey.length}`
    );
  }

  const signature = nacl.sign.detached(message, keypair.secretKey);
  return signature;
}

/**
 * Create payment signature for v1 (using paymentId)
 */
export function createV1PaymentSignature(
  keypair: Keypair,
  paymentId: string,
  paymentRequirement: PaymentRequirement
): string {
  // v1 signature format: sign(paymentId + amount + recipient + mint)
  const message = `${paymentId}:${paymentRequirement.amount}:${paymentRequirement.recipient || ''}:${paymentRequirement.mint || ''}`;
  const messageBytes = new TextEncoder().encode(message);
  const signature = signMessage(keypair, messageBytes);
  return bs58.encode(signature);
}

/**
 * Create payment signature for v2 (using nonce and CAIP-2 format)
 */
export function createV2PaymentSignature(
  keypair: Keypair,
  nonce: string,
  paymentRequirement: PaymentRequirement
): string {
  // v2 uses CAIP-2 format: solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
  // Signature format: sign(nonce + chainId + amount + recipient + mint)
  const chainId = paymentRequirement.network.startsWith('solana:')
    ? paymentRequirement.network
    : `solana:${paymentRequirement.network}`;
  
  const message = `${nonce}:${chainId}:${paymentRequirement.amount}:${paymentRequirement.recipient || ''}:${paymentRequirement.mint || ''}`;
  const messageBytes = new TextEncoder().encode(message);
  const signature = signMessage(keypair, messageBytes);
  
  // Return signature in base58
  return bs58.encode(signature);
}

/**
 * Select payment requirement from accepts array
 */
export function selectPaymentRequirement(
  accepts: any[],
  targetNetwork: string
): PaymentRequirement | null {
  if (!Array.isArray(accepts) || accepts.length === 0) {
    return null;
  }

  // Normalize target network to CAIP-2 format if needed
  const normalizedTarget = targetNetwork.startsWith('solana:')
    ? targetNetwork
    : targetNetwork === 'solana-mainnet' || targetNetwork === 'mainnet'
    ? 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp'
    : targetNetwork === 'solana-devnet' || targetNetwork === 'devnet'
    ? 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1'
    : `solana:${targetNetwork}`;

  // Find matching requirement
  for (const accept of accepts) {
    const acceptNetwork = accept.network || accept.chain;
    if (
      acceptNetwork === normalizedTarget ||
      acceptNetwork === targetNetwork ||
      (normalizedTarget.includes('mainnet') && acceptNetwork?.includes('mainnet')) ||
      (normalizedTarget.includes('devnet') && acceptNetwork?.includes('devnet'))
    ) {
      return {
        network: acceptNetwork || normalizedTarget,
        amount: accept.amount || accept.value,
        asset: accept.asset || 'USDC',
        mint: accept.mint,
        recipient: accept.recipient || accept.to,
      };
    }
  }

  // Fallback to first requirement
  const first = accepts[0];
  return {
    network: first.network || first.chain || normalizedTarget,
    amount: first.amount || first.value,
    asset: first.asset || 'USDC',
    mint: first.mint,
    recipient: first.recipient || first.to,
  };
}

