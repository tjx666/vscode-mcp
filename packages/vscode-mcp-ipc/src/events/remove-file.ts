import { z } from 'zod';

import { FilePathSchema } from '../common.js';

export const RemoveFileInputSchema = z.object({
  filePath: FilePathSchema,
  useTrash: z.boolean().optional().default(true).describe('Whether to move to trash instead of permanently delete (default: true)'),
  recursive: z.boolean().optional().default(true).describe('Whether to recursively delete folder contents (default: true)'),
}).strict();

export const RemoveFileOutputSchema = z.object({
  success: z.boolean().describe('Whether removal was successful'),
  deletedPath: z.string().optional().describe('Path that was deleted'),
  message: z.string().optional().describe('Success or informational message'),
  error: z.string().optional().describe('Error message if removal failed'),
}).strict();

export type RemoveFilePayload = z.infer<typeof RemoveFileInputSchema>;
export type RemoveFileResult = z.infer<typeof RemoveFileOutputSchema>;