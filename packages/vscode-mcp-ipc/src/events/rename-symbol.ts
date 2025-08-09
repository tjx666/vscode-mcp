import { z } from 'zod';

export const RenameSymbolInputSchema = z
  .object({
    uri: z.string().describe('File URI'),
    symbol: z.string().describe('Symbol name to rename'),
    codeSnippet: z.string().optional().describe('Optional code snippet to precisely locate the symbol when multiple occurrences exist'),
    newName: z.string().describe('New symbol name'),
  })
  .strict();

export const RenameSymbolOutputSchema = z
  .object({
    success: z.boolean().describe('Whether rename was successful'),
    symbolName: z.string().optional().describe('Original symbol name'),
    modifiedFiles: z
      .array(
        z.object({
          uri: z.string().describe('File URI'),
          changeCount: z.number().describe('Number of changes in this file'),
        }),
      )
      .describe('List of modified files'),
    totalChanges: z.number().describe('Total number of changes made'),
    error: z.string().optional().describe('Error message if rename failed'),
  })
  .strict();

export type RenameSymbolPayload = z.infer<typeof RenameSymbolInputSchema>;
export type RenameSymbolResult = z.infer<typeof RenameSymbolOutputSchema>; 