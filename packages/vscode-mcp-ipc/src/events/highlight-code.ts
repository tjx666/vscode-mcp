import { z } from 'zod';

export const HighlightCodeBaseInputSchema = z
  .object({
    uri: z.string().describe('File URI to highlight'),
    ranges: z.array(z.object({
      startLine: z.number().describe('Start line (0-based)'),
      endLine: z.number().describe('End line (0-based)'),
      startCharacter: z.number().optional().describe('Start character (0-based)'),
      endCharacter: z.number().optional().describe('End character (0-based)'),
      message: z.string().optional().describe('Optional explanation message'),

      backgroundColor: z.string().optional().describe('Custom background color for this range (e.g., "#ff0000", "rgba(255,0,0,0.3)")'),
      foregroundColor: z.string().optional().describe('Custom foreground color for this range (e.g., "#ffffff")')
    })).describe('Array of ranges to highlight'),
    showEditor: z.boolean().optional().default(true).describe('Whether to show the file in editor'),
    scrollToFirst: z.boolean().optional().default(true).describe('Whether to scroll to first highlight'),
    clearPrevious: z.boolean().optional().default(true).describe('Whether to clear previous highlights'),
    timeout: z.number().optional().default(3000).describe('Auto-clear timeout in milliseconds (0 for permanent, default: 3000ms)')
  })
  .strict();

export const HighlightCodeInputSchema = HighlightCodeBaseInputSchema.refine(
  (data) => {
    // Validate that all ranges have valid line numbers
    return data.ranges.every(range => range.startLine >= 0 && range.endLine >= range.startLine);
  },
  { message: 'Invalid range: startLine must be >= 0 and endLine must be >= startLine' }
);

export const HighlightCodeOutputSchema = z
  .object({
    success: z.boolean().describe('Whether the highlight operation was successful'),
    highlightCount: z.number().describe('Number of ranges highlighted'),
    clearedCount: z.number().optional().describe('Number of previous highlights cleared'),
    message: z.string().optional().describe('Success or error message')
  })
  .strict();

export type HighlightCodePayload = z.infer<typeof HighlightCodeInputSchema>;
export type HighlightCodeResult = z.infer<typeof HighlightCodeOutputSchema>; 