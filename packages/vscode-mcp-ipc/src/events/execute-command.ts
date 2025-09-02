/**
 * Execute command event types and schemas
 */

import { z } from 'zod';

/**
 * JSON-serializable value schema
 */
const JsonifiableSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    z.null(),
    z.boolean(),
    z.number(),
    z.string(),
    z.array(JsonifiableSchema),
    z.record(z.string(), JsonifiableSchema),
  ])
);

/**
 * Execute command input schema
 */
export const ExecuteCommandInputSchema = z.object({
  command: z.string().describe('VSCode command to execute (e.g., \'vscode.open\', \'editor.action.formatDocument\')'),
  args: z.array(JsonifiableSchema).optional().describe('Optional arguments to pass to the command'),
  saveAllEditors: z.boolean().optional().default(true).describe('Save all dirty editors after executing the command (default: true)'),
}).strict();

/**
 * Execute command output schema
 */
export const ExecuteCommandOutputSchema = z.object({
  result: JsonifiableSchema.describe('JSON-serializable result from the command execution'),
}).strict();

/**
 * Execute command payload (input parameters)
 */
export type ExecuteCommandPayload = z.infer<typeof ExecuteCommandInputSchema>;

/**
 * Execute command result (output data)
 */
export type ExecuteCommandResult = z.infer<typeof ExecuteCommandOutputSchema>; 