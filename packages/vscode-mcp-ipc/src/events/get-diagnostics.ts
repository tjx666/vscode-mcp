/**
 * Get diagnostics event types and schemas
 */

import { z } from 'zod';

import { RangeSchema } from './common.js';

/**
 * Diagnostic schema
 */
const DiagnosticSchema = z.object({
  range: RangeSchema,
  message: z.string(),
  severity: z.number().int().min(1).max(4).optional(),
  source: z.string().optional(),
  code: z.union([z.string(), z.number()]).optional(),
}).strict();

/**
 * Single file diagnostic result
 */
const FileDiagnosticSchema = z.object({
  uri: z.string(),
  diagnostics: z.array(DiagnosticSchema),
}).strict();

/**
 * Get diagnostics input schema
 */
export const GetDiagnosticsInputSchema = z.object({
  uris: z.array(z.string()).describe('Array of file URIs to get diagnostics for. If empty array is provided, will get diagnostics for all git modified files (staged and unstaged) in the workspace.'),
}).strict();

/**
 * Get diagnostics output schema
 */
export const GetDiagnosticsOutputSchema = z.object({
  files: z.array(FileDiagnosticSchema),
}).strict();

/**
 * Get diagnostics payload (input parameters)
 */
export type GetDiagnosticsPayload = z.infer<typeof GetDiagnosticsInputSchema>;

/**
 * Get diagnostics result (output data)
 */
export type GetDiagnosticsResult = z.infer<typeof GetDiagnosticsOutputSchema>;

/**
 * Diagnostic types (for backward compatibility)
 */
export type Diagnostic = z.infer<typeof DiagnosticSchema>;

/**
 * File diagnostic type
 */
export type FileDiagnostic = z.infer<typeof FileDiagnosticSchema>; 