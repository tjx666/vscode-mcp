/**
 * Get workspace symbols event types and schemas
 */

import { z } from 'zod';

import { LocationSchema } from './common.js';

/**
 * Symbol information schema
 */
const SymbolInformationSchema = z.object({
  name: z.string(),
  kind: z.number(),
  location: LocationSchema,
  containerName: z.string().optional(),
}).strict();

/**
 * Get workspace symbols input schema
 */
export const GetWorkspaceSymbolsInputSchema = z.object({
  query: z.string().describe('Search query for symbols'),
}).strict();

/**
 * Get workspace symbols output schema
 */
export const GetWorkspaceSymbolsOutputSchema = z.object({
  symbols: z.array(SymbolInformationSchema),
}).strict();

/**
 * Get workspace symbols payload (input parameters)
 */
export type GetWorkspaceSymbolsPayload = z.infer<typeof GetWorkspaceSymbolsInputSchema>;

/**
 * Get workspace symbols result (output data)
 */
export type GetWorkspaceSymbolsResult = z.infer<typeof GetWorkspaceSymbolsOutputSchema>;

/**
 * Symbol information type (for backward compatibility)
 */
export type SymbolInformation = z.infer<typeof SymbolInformationSchema>; 