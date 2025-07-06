/**
 * Get VSCode commands event types and schemas
 */

import { z } from 'zod';

/**
 * Get commands input schema
 */
export const GetCommandsInputSchema = z.object({
  include_internal: z.boolean().optional().default(false).describe('Whether to include internal/private commands'),
  filter: z.string().optional().describe('Filter commands by keyword (case-insensitive)'),
  category: z.string().optional().describe('Filter by command category (e.g., "editor", "workbench", "git")'),
  limit: z.number().int().positive().optional().describe('Limit the number of results returned'),
}).strict();

/**
 * Command info schema
 */
export const CommandInfoSchema = z.object({
  id: z.string().describe('Command identifier'),
  category: z.string().describe('Command category (extracted from command prefix)'),
}).strict();

/**
 * Get commands output schema
 */
export const GetCommandsOutputSchema = z.object({
  commands: z.array(CommandInfoSchema).describe('List of available commands'),
  total: z.number().describe('Total number of commands returned'),
  total_available: z.number().describe('Total number of commands available (before filtering)'),
  categories: z.record(z.string(), z.number()).describe('Command count by category'),
  filtered: z.boolean().describe('Whether results were filtered'),
}).strict();

/**
 * Get commands payload (input parameters)
 */
export type GetCommandsPayload = z.infer<typeof GetCommandsInputSchema>;

/**
 * Command info type
 */
export type CommandInfo = z.infer<typeof CommandInfoSchema>;

/**
 * Get commands result (output data)
 */
export type GetCommandsResult = z.infer<typeof GetCommandsOutputSchema>; 