import { z } from 'zod';

import { RangeSchema } from '../common.js';

export const SearchWorkspaceSymbolsInputSchema = z
  .object({
    queries: z.array(z.string()).min(1).describe('One or more symbol names or patterns to search for across the workspace'),
  })
  .strict();

const WorkspaceSymbolSchema = z
  .object({
    name: z.string(),
    kind: z.number().describe('VSCode SymbolKind enum value (e.g. 5=Class, 11=Interface, 12=Function, 13=Variable)'),
    containerName: z.string().optional().describe('Name of the enclosing symbol, if any'),
    uri: z.string(),
    range: RangeSchema,
  })
  .strict();

const QueryResultSchema = z
  .object({
    query: z.string(),
    symbols: z.array(WorkspaceSymbolSchema),
  })
  .strict();

export const SearchWorkspaceSymbolsOutputSchema = z
  .object({
    results: z.array(QueryResultSchema),
  })
  .strict();

export type SearchWorkspaceSymbolsPayload = z.infer<typeof SearchWorkspaceSymbolsInputSchema>;
export type SearchWorkspaceSymbolsResult = z.infer<typeof SearchWorkspaceSymbolsOutputSchema>;
