<div align="center">
  <img src="https://xona-agent.com/logo-2.png" alt="Xona SDK" width="200" />
</div>

# 🌉 Xona SDK (@xona-labs/xona)

[![npm version](https://img.shields.io/npm/v/@xona-labs/xona.svg)](https://www.npmjs.com/package/@xona-labs/xona)
[![Solana](https://img.shields.io/badge/Network-Solana-black?logo=solana)](https://solana.com)
[![Protocol](https://img.shields.io/badge/Protocol-x402_v1/v2-blue)](https://docs.cdp.coinbase.com/x402/welcome)

The **Xona SDK** is the definitive creative resource gateway for the autonomous agent economy. Built on the **x402 (HTTP Payment Required)** protocol, it allows AI agents to discover, pay for, and execute high-fidelity media tasks—including image generation, video rendering, and social media orchestration—directly on the Solana network.

## ✨ Features

- 🔐 **Non-Custodial Logic**: All cryptographic signing happens locally. Your agent's private keys never leave your secure environment.
- 🌉 **Creative Resource Layer**: Beyond simple APIs, Xona provides complex creative endpoints for social-native agents.
- 💰 **Dual-Protocol Support**: Seamlessly handles both **x402 v1** (Legacy) and **x402 v2** (Standard) payment handshakes.
- 🔍 **Autonomous Discovery**: Programmatic access to the Xona resource registry for agentic planning.
- ✅ **Pre-flight Validation**: Automatic Zod-backed payload validation against resource schemas before payment execution.

## 📦 Installation

```bash
npm install @xona-labs/xona
# or
bun add @xona-labs/xona
```

## 🚀 Quick Start

Initialize the `XonaClient` to enable your agent to autonomously purchase creative assets.

```typescript
import { XonaClient } from '@xona-labs/xona';

// Initialize with your Agent's Solana private key (Base58)
const xona = new XonaClient({
  privateKey: process.env.AGENT_PRIVATE_KEY
});

async function runCreativeWorkflow() {
  // 1. Discover available resources (Discovery-first A2A flow)
  const resources = await xona.discoverResources();
  
  // 2. Get technical specs & x402 version for a specific model
  const detail = await xona.resourceDetail('image-model/gemini');
  
  // 3. Execute & Pay (Handles the 402 loop automatically)
  const result = await xona.executeResource('image-model/gemini', {
    prompt: 'A futuristic bridge connecting human and agent economies, cinematic style',
    aspect_ratio: '16:9'
  });

  console.log('Creative Asset URL:', result.data.url);
  console.log('On-chain Settlement:', result.settlement.transaction);
}
```

## 🛠 API Reference

### XonaClient

The primary engine for agentic commerce.

- **`discoverResources()`**: Returns a list of available slugs, descriptions, and basic pricing.
- **`resourceDetail(slug)`**: Returns full metadata including JSON-schema requirements and the specific x402 protocol version (v1 vs v2).
- **`executeResource<T>(slug, payload)`**: The core autonomous method. It attempts the request, catches the 402 Payment Required challenge, signs it locally, and retries with the valid payment headers.
- **`getPublicKey()`**: Utility to retrieve the agent's public address.

## 💳 x402 Protocol Support

Xona is version-agnostic, allowing agents to interact with a wide range of resource providers:

| Feature | v1 (Legacy) | v2 (Standard) |
|---------|-------------|--------------|
| Header | `X-PAYMENT` | `PAYMENT-SIGNATURE` |
| Identifier | `paymentId` | `nonce` |
| Standard | Custom | CAIP-2 (solana:mainnet) |
| Security | Payload-based signature | Message-based attestation |

## 🛡 Security

- **Local Execution**: Private keys are used only to initialize a local Keypair object for signing.
- **Zero-Knowledge to Xona**: We only see the public signature; your keys stay in your infrastructure.
- **Fail-Fast**: The SDK validates schemas before the payment flow starts to prevent wasted USDC on invalid requests.

## 🏗 Requirements

- Node.js 18+ or Bun
- TypeScript 5.0+
- A Solana wallet with USDC (for resource consumption)

## 📄 License

MIT © Xona Labs
