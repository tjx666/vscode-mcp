/**
 * Rename file event types and schemas
 */

import { z } from 'zod';

/**
 * Rename file input schema
 */
export const RenameFileInputSchema = z.object({
  filePath: z.string().describe('File path (absolute or relative to workspace root)'),
  newName: z.string().describe('New file name'),
}).strict();

/**
 * Rename file output schema
 */
export const RenameFileOutputSchema = z.object({
  success: z.boolean().describe('Whether the rename was successful'),
  newUri: z.string().describe('New file URI after rename'),
  error: z.string().optional().describe('Error message if rename failed'),
}).strict();

/**
 * Rename file payload (input parameters)
 */
export type RenameFilePayload = z.infer<typeof RenameFileInputSchema>;

/**
 * Rename file result (output data)
 */
export type RenameFileResult = z.infer<typeof RenameFileOutputSchema>;