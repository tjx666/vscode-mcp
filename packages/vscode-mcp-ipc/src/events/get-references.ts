/**
 * Get references event types and schemas
 */

import { z } from 'zod';

import { LocationSchema } from './common.js';

/**
 * Get references input schema
 */
export const GetReferencesInputSchema = z.object({
  uri: z.string().describe('File URI'),
  line: z.number().describe('Line number (0-based)'),
  character: z.number().describe('Character position (0-based)'),
  includeDeclaration: z.boolean().optional().describe('Whether to include the declaration in the results'),
}).strict();

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