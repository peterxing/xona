/**
 * Example usage of @xona-labs/xona SDK
 * 
 * This example demonstrates how to:
 * 1. Initialize the client
 * 2. Discover available resources
 * 3. Get resource details
 * 4. Execute a resource with automatic payment handling
 */

import { XonaClient } from './src/index.js';

async function main() {
  // Initialize client with your Solana private key (base58)
  // IMPORTANT: Never commit your private key to version control!
  const privateKey = process.env.XONA_PRIVATE_KEY || 'your-base58-private-key-here';
  
  const xona = new XonaClient({
    privateKey,
  });

  console.log('Wallet address:', xona.getPublicKey());

  try {
    // Discover available resources
    console.log('\n=== Discovering Resources ===');
    const resources = await xona.discoverResources();
    console.log(`Found ${resources.length} resources:`);
    resources.forEach((resource) => {
      console.log(`  - ${resource.slug}: ${resource.description}`);
      console.log(`    Price: ${resource.pricing.amount} ${resource.pricing.asset}`);
    });

    // Get detailed information about a specific resource
    console.log('\n=== Getting Resource Details ===');
    const slug = 'image-model/gemini'; // Example resource slug
    const resourceDetail = await xona.resourceDetail(slug);
    console.log('Resource:', resourceDetail.slug);
    console.log('Description:', resourceDetail.description);
    console.log('Version:', resourceDetail.version);
    console.log('Pricing:', resourceDetail.pricing);
    console.log('Input Schema:', JSON.stringify(resourceDetail.input_schema, null, 2));

    // Execute a resource with payment
    console.log('\n=== Executing Resource ===');
    const result = await xona.executeResource(slug, {
      prompt: 'A beautiful sunset over the ocean with vibrant colors',
      aspect_ratio: '16:9',
    });

    console.log('Execution successful!');
    console.log('Result:', JSON.stringify(result.data, null, 2));
    
    if (result.settlement) {
      console.log('\nPayment Settlement:');
      console.log('  Transaction:', result.settlement.transaction);
      console.log('  Network:', result.settlement.network);
      console.log('  Payer:', result.settlement.payer);
    }
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

