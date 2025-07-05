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
  line: z.number().describe('Line number (0-based)'),
  character: z.number().describe('Character position (0-based)'),
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

 