/**
 * Get definition event types and schemas
 */

import { z } from 'zod';

import { LocationSchema } from './common.js';

/**
 * Get definition input schema
 */
export const GetDefinitionInputSchema = z.object({
  uri: z.string().describe('File URI'),
  symbol: z.string().describe('Symbol name to find definition for'),
  codeSnippet: z.string().optional().describe('Optional code snippet to precisely locate the symbol when multiple occurrences exist'),
}).strict();

/**
 * Get definition output schema
 */
export const GetDefinitionOutputSchema = z.object({
  locations: z.array(LocationSchema),
}).strict();

/**
 * Get definition payload (input parameters)
 */
export type GetDefinitionPayload = z.infer<typeof GetDefinitionInputSchema>;

/**
 * Get definition result (output data)
 */
export type GetDefinitionResult = z.infer<typeof GetDefinitionOutputSchema>;

 