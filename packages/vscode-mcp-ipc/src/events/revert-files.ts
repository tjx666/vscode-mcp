/**
 * Revert files event types and schemas
 *
 * Reloads file buffers from disk without showing them in the editor.
 * Useful when files are modified externally (e.g. by CLI tools) and
 * VS Code's in-memory buffers need to be synced so language servers
 * pick up the changes.
 */

import { z } from 'zod';

import { FilePathSchema } from '../common.js';

/**
 * Single file revert result
 */
const FileRevertResultSchema = z.object({
  filePath: z.string().describe('File path that was processed'),
  success: z.boolean().describe('Whether the file was reverted successfully'),
  message: z.string().optional().describe('Optional message about the operation'),
}).strict();

/**
 * Revert files input schema
 */
export const RevertFilesInputSchema = z.object({
  files: z.array(FilePathSchema).describe('Array of file paths to revert from disk'),
  waitForDiagnostics: z.boolean().optional().default(false).describe(
    'Wait for language server diagnostics to settle after reverting. '
    + 'Uses onDidChangeDiagnostics with debounce instead of arbitrary sleep.'
  ),
}).strict();

/**
 * Revert files output schema
 */
export const RevertFilesOutputSchema = z.object({
  results: z.array(FileRevertResultSchema).describe('Results for each file revert operation'),
}).strict();

/**
 * Revert files payload (input parameters)
 */
export type RevertFilesPayload = z.infer<typeof RevertFilesInputSchema>;

/**
 * Revert files result (output data)
 */
export type RevertFilesResult = z.infer<typeof RevertFilesOutputSchema>;
