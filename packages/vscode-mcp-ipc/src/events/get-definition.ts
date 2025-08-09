/**
 * Get definition event types and schemas
 */

import { z } from 'zod';

import { LocationSchema, SymbolLocatorSchema } from './common.js';

/**
 * Get definition input schema
 */
export const GetDefinitionInputSchema = SymbolLocatorSchema;

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

 