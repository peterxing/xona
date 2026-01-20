import { z } from 'zod';

/**
 * JSON Schema type for input validation
 */
export const InputSchemaSchema = z.object({
  type: z.literal('object').optional(),
  properties: z.record(z.any()).optional(),
  required: z.array(z.string()).optional(),
});

export type InputSchema = z.infer<typeof InputSchemaSchema>;

/**
 * Output schema type
 */
export const OutputSchemaSchema = z.object({
  type: z.literal('object').optional(),
  properties: z.record(z.any()).optional(),
});

export type OutputSchema = z.infer<typeof OutputSchemaSchema>;

/**
 * Pricing information for a resource
 */
export const PricingSchema = z.object({
  amount: z.string(),
  asset: z.string(),
  network: z.string(),
  mint: z.string().optional(),
  recipient: z.string().optional(),
});

export type Pricing = z.infer<typeof PricingSchema>;

/**
 * Resource detail returned from the API
 */
export const ResourceDetailSchema = z.object({
  slug: z.string(),
  description: z.string(),
  input_schema: InputSchemaSchema,
  output_schema: OutputSchemaSchema.optional(),
  version: z.enum(['v1', 'v2']).optional(),
  x402_version: z.enum(['v1', 'v2']).optional(),
  pricing: PricingSchema,
});

export type ResourceDetail = z.infer<typeof ResourceDetailSchema>;

/**
 * Resource list item (simplified version for discovery)
 */
export const ResourceListItemSchema = z.object({
  slug: z.string(),
  description: z.string(),
  pricing: PricingSchema,
});

export type ResourceListItem = z.infer<typeof ResourceListItemSchema>;

/**
 * X402 Challenge response (402 Payment Required)
 */
export const X402ChallengeV1Schema = z.object({
  error: z.string().optional(),
  accepts: z.array(z.any()).optional(),
  x402Version: z.number().optional(),
  paymentId: z.string(),
  network: z.string().optional(),
});

export const X402ChallengeV2Schema = z.object({
  error: z.string().optional(),
  accepts: z.array(z.any()).optional(),
  x402Version: z.number().optional(),
  nonce: z.string(),
  network: z.string().optional(),
});

export type X402ChallengeV1 = z.infer<typeof X402ChallengeV1Schema>;
export type X402ChallengeV2 = z.infer<typeof X402ChallengeV2Schema>;
export type X402Challenge = X402ChallengeV1 | X402ChallengeV2;

/**
 * Payment requirement from accepts array
 */
export const PaymentRequirementSchema = z.object({
  network: z.string(),
  amount: z.string(),
  asset: z.string(),
  mint: z.string().optional(),
  recipient: z.string().optional(),
});

export type PaymentRequirement = z.infer<typeof PaymentRequirementSchema>;

