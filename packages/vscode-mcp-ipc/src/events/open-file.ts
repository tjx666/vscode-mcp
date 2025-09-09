/**
 * Open files event types and schemas
 */

import { z } from 'zod';

import { FilePathSchema } from '../common.js';

/**
 * Single file open request
 */
const FileOpenRequestSchema = z.object({
  filePath: FilePathSchema.describe('File path to open'),
  showEditor: z.boolean().optional().default(true).describe('Whether to show the file in editor (default: true)'),
}).strict();

/**
 * Single file open result
 */
const FileOpenResultSchema = z.object({
  filePath: z.string().describe('File path that was processed'),
  success: z.boolean().describe('Whether the file was opened successfully'),
  message: z.string().optional().describe('Optional message about the operation'),
}).strict();

/**
 * Open files input schema
 */
export const OpenFilesInputSchema = z.object({
  files: z.array(FileOpenRequestSchema).describe('Array of files to open'),
}).strict();

/**
 * Open files output schema
 */
export const OpenFilesOutputSchema = z.object({
  results: z.array(FileOpenResultSchema).describe('Results for each file open operation'),
}).strict();

/**
 * Open files payload (input parameters)
 */
export type OpenFilesPayload = z.infer<typeof OpenFilesInputSchema>;

/**
 * Open files result (output data)
 */
export type OpenFilesResult = z.infer<typeof OpenFilesOutputSchema>;

/**
 * Individual file open request type
 */
export type FileOpenRequest = z.infer<typeof FileOpenRequestSchema>;

/**
 * Individual file open result type
 */
export type FileOpenResult = z.infer<typeof FileOpenResultSchema>; 