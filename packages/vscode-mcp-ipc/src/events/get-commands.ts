/**
 * Get commands event types and schemas
 */

import { z } from 'zod';

/**
 * Get commands input schema
 */
export const GetCommandsInputSchema = z.object({
  filterInternal: z.boolean().optional().default(true).describe('Filter out internal commands (starting with _)'),
  pattern: z.string().optional().describe('Optional regex pattern to filter commands'),
  offset: z.number().optional().default(0).describe('Pagination offset'),
  limit: z.number().optional().default(100).describe('Number of commands per page (max 500)'),
}).strict();

/**
 * Get commands output schema
 */
export const GetCommandsOutputSchema = z.object({
  commands: z.array(z.string()).describe('List of command IDs'),
  total: z.number().describe('Total number of commands matching filter'),
  offset: z.number().describe('Current offset'),
  limit: z.number().describe('Current limit'),
  hasMore: z.boolean().describe('Whether there are more commands'),
}).strict();

/**
 * Get commands payload (input parameters)
 */
export type GetCommandsPayload = z.infer<typeof GetCommandsInputSchema>;

/**
 * Get commands result (output data)
 */
export type GetCommandsResult = z.infer<typeof GetCommandsOutputSchema>;
