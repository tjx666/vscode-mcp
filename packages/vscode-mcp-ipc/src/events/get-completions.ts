import { z } from 'zod';

/**
 * Input schema for getCompletions event
 */
export const GetCompletionsInputSchema = z.object({
  /** File path (absolute or relative to workspace root) */
  filePath: z.string().describe('File path (absolute or relative to workspace root)'),
  /** Line number (0-indexed) */
  line: z.number().int().min(0).describe('Line number (0-indexed)'),
  /** Character position (0-indexed) */
  character: z.number().int().min(0).describe('Character position (0-indexed)'),
  /** Optional trigger character (e.g., '.', '(', '<') */
  triggerCharacter: z.string().optional().describe('Optional trigger character'),
  /** Pagination offset (default: 0) */
  offset: z.number().int().min(0).optional().default(0).describe('Pagination offset'),
  /** Number of items per page, max 100 (default: 50) */
  limit: z.number().int().min(1).max(100).optional().default(50).describe('Number of items per page'),
}).strict();

/**
 * Completion item kind (matches VSCode CompletionItemKind)
 */
export const CompletionItemKindEnum = z.enum([
  'Text', 'Method', 'Function', 'Constructor', 'Field', 'Variable',
  'Class', 'Interface', 'Module', 'Property', 'Unit', 'Value',
  'Enum', 'Keyword', 'Snippet', 'Color', 'File', 'Reference',
  'Folder', 'EnumMember', 'Constant', 'Struct', 'Event', 'Operator', 'TypeParameter'
]);

/**
 * Single completion item
 */
export const CompletionItemSchema = z.object({
  /** The label of this completion item */
  label: z.string(),
  /** The kind of this completion item */
  kind: CompletionItemKindEnum.optional(),
  /** A human-readable string with additional information */
  detail: z.string().optional(),
  /** A human-readable string that represents a doc-comment */
  documentation: z.string().optional(),
  /** A string that should be inserted when selecting this completion */
  insertText: z.string().optional(),
  /** Sort text used for sorting completions */
  sortText: z.string().optional(),
  /** Filter text used for filtering completions */
  filterText: z.string().optional(),
});

/**
 * Output schema for getCompletions event
 */
export const GetCompletionsOutputSchema = z.object({
  /** Array of completion items for current page */
  items: z.array(CompletionItemSchema),
  /** Total number of completions available */
  total: z.number(),
  /** Current offset */
  offset: z.number(),
  /** Current limit */
  limit: z.number(),
  /** Whether there are more items */
  hasMore: z.boolean(),
  /** Whether completions are incomplete (may have more from language server) */
  isIncomplete: z.boolean(),
}).strict();

export type GetCompletionsPayload = z.infer<typeof GetCompletionsInputSchema>;
export type GetCompletionsResult = z.infer<typeof GetCompletionsOutputSchema>;
export type CompletionItem = z.infer<typeof CompletionItemSchema>;
