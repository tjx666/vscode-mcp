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
 * Get diagnostics input schema
 */
export const GetDiagnosticsInputSchema = z.object({
  uri: z.string().describe('File URI to get diagnostics for'),
}).strict();

/**
 * Get diagnostics output schema
 */
export const GetDiagnosticsOutputSchema = z.object({
  diagnostics: z.array(DiagnosticSchema),
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