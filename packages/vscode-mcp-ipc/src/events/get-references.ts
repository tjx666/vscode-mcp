/**
 * Get references event types and schemas
 */

import { z } from 'zod';

import { LocationSchema, SymbolLocatorSchema } from './common.js';

/**
 * Get references input schema
 */
export const GetReferencesInputSchema = SymbolLocatorSchema.extend({
  includeDeclaration: z.boolean().optional().describe('Whether to include the declaration in the results'),
  usageCodeLineRange: z.number().optional().default(5).describe('Number of lines to include around each reference for usage context. 5 = ±5 lines (11 total), 0 = only reference line, -1 = no usage code'),
});

/**
 * Get references output schema
 */
export const GetReferencesOutputSchema = z.object({
  locations: z.array(LocationSchema),
}).strict();

/**
 * Get references payload (input parameters)
 */
export type GetReferencesPayload = z.infer<typeof GetReferencesInputSchema>;

/**
 * Get references result (output data)
 */
export type GetReferencesResult = z.infer<typeof GetReferencesOutputSchema>; 