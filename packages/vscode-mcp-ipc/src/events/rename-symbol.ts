import { z } from 'zod';

import { SymbolLocatorSchema } from '../common.js';

export const RenameSymbolInputSchema = SymbolLocatorSchema.extend({
  newName: z.string().describe('New symbol name'),
});

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