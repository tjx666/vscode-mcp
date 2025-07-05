/**
 * Get completions event types and schemas
 */

import { z } from 'zod';

/**
 * Completion item schema
 */
const CompletionItemSchema = z.object({
  label: z.string(),
  kind: z.number().optional(),
  detail: z.string().optional(),
  documentation: z.string().optional(),
  insertText: z.string().optional(),
}).strict();

/**
 * Get completions input schema
 */
export const GetCompletionsInputSchema = z.object({
  uri: z.string().describe('File URI'),
  line: z.number().describe('Line number (0-based)'),
  character: z.number().describe('Character position (0-based)'),
}).strict();

/**
 * Get completions output schema
 */
export const GetCompletionsOutputSchema = z.object({
  items: z.array(CompletionItemSchema),
}).strict();

/**
 * Get completions payload (input parameters)
 */
export type GetCompletionsPayload = z.infer<typeof GetCompletionsInputSchema>;

/**
 * Get completions result (output data)
 */
export type GetCompletionsResult = z.infer<typeof GetCompletionsOutputSchema>;

/**
 * Completion item type (for backward compatibility)
 */
export type CompletionItem = z.infer<typeof CompletionItemSchema>; 