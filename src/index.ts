/**
 * @xona-labs/xona SDK
 * Non-custodial TypeScript SDK for discovering and paying for creative resources on Solana using the x402 protocol
 */

export { XonaClient, type XonaClientConfig, type ExecuteResourceResult } from './client.js';
export { discoverResources, getResourceDetail } from './discovery.js';
export {
  createKeypairFromPrivateKey,
  createV1PaymentSignature,
  createV2PaymentSignature,
  getPublicKeyAddress,
  selectPaymentRequirement,
} from './signer.js';
export * from './types/index.js';

