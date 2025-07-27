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
  extension_version: z.string().describe('VSCode MCP Bridge extension version'),
  workspace: z.string().optional().describe('Current workspace path'),
  timestamp: z.string().describe('Health check timestamp'),
  error: z.string().optional().describe('Error message if status is error'),
  system_info: z.object({
    platform: z.string().describe('Operating system platform'),
    node_version: z.string().describe('Node.js version'),
    vscode_version: z.string().optional().describe('VSCode version if available'),
    ide_type: z.string().optional().describe('IDE type (vscode, cursor, windsurf, trae, unknown)'),
  }).optional().describe('System information'),
}).strict();

/**
 * Health check payload (input parameters)
 */
export type HealthCheckPayload = z.infer<typeof HealthCheckInputSchema>;

/**
 * Health check result (output data)
 */
export type HealthCheckResult = z.infer<typeof HealthCheckOutputSchema>; 