/**
 * Get diagnostics event types and schemas
 */

import { z } from 'zod';

import { FilePathSchema, RangeSchema } from '../common.js';

/**
 * Diagnostic schema
 */
const DiagnosticSchema = z.object({
  range: RangeSchema,
  message: z.string(),
  severity: z.enum(['error', 'warning', 'info', 'hint']),
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
  __NOT_RECOMMEND__filePaths: z.array(FilePathSchema).describe('Array of file paths to get diagnostics for. If empty array is provided, will get diagnostics for all git modified files (staged and unstaged) in the workspace.'),
  sources: z.array(z.string()).optional().default([]).describe('Array of diagnostic sources to include (e.g., "eslint", "ts", "typescript"). If empty array provided, includes all sources.'),
  __NOT_RECOMMEND__severities: z.array(z.enum(['error', 'warning', 'info', 'hint'])).optional().default(['error', 'warning', 'info', 'hint']).describe('Severity levels to include. Default includes all four (error, warning, info, hint) so ESLint rules that surface as hints are not silently dropped.'),
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