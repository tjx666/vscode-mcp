/**
 * Health check event types and schemas
 */

import { z } from 'zod';

/**
 * Health check input schema
 */
export const HealthCheckInputSchema = z.object({}).strict();

/**
 * Health check output schema
 */
export const HealthCheckOutputSchema = z.object({
  status: z.enum(['ok', 'error']),
  version: z.string(),
  workspace: z.string().optional(),
}).strict();

/**
 * Health check payload (input parameters)
 */
export type HealthCheckPayload = z.infer<typeof HealthCheckInputSchema>;

/**
 * Health check result (output data)
 */
export type HealthCheckResult = z.infer<typeof HealthCheckOutputSchema>; 