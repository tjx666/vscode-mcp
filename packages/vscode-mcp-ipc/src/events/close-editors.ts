/**
 * Close editors event types and schemas
 */

import { z } from 'zod';

/**
 * Close editors input schema
 */
export const CloseEditorsInputSchema = z
  .object({
    paths: z
      .array(z.string())
      .min(1)
      .describe('Absolute file paths whose editor tabs should be closed. Matched against open tab URIs across all tab groups.'),
    forceCloseDirty: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        'When true, also close tabs that have unsaved changes — the changes are DISCARDED. Default false: dirty tabs are left open and reported in skipped_dirty.',
      ),
  })
  .strict();

/**
 * Close editors output schema
 */
export const CloseEditorsOutputSchema = z
  .object({
    closed: z.array(z.string()).describe('Paths for which at least one tab was closed'),
    skipped_dirty: z
      .array(z.string())
      .describe(
        'Paths that still have at least one unsaved tab left open (forceCloseDirty was false). A path may also appear in `closed` if a clean copy in another tab group was closed.',
      ),
    not_found: z.array(z.string()).describe('Requested paths that had no matching open tab'),
    summary: z
      .object({
        requested: z.number().describe('Number of paths requested'),
        closed: z.number().describe('Number of paths closed'),
        skipped_dirty: z.number().describe('Number of paths skipped due to unsaved changes'),
        not_found: z.number().describe('Number of paths with no open tab'),
      })
      .strict()
      .describe('Summary statistics'),
  })
  .strict();

/**
 * Close editors payload (input parameters)
 */
export type CloseEditorsPayload = z.infer<typeof CloseEditorsInputSchema>;

/**
 * Close editors result (output data)
 */
export type CloseEditorsResult = z.infer<typeof CloseEditorsOutputSchema>;
