import { z } from 'zod';

export const CallAgentInputSchema = z
  .object({
    prompt: z.string().describe('The main prompt/request to send to the AI agent'),
    files: z
      .array(z.string())
      .optional()
      .describe('Optional list of file paths to include in the context'),
    images: z
      .array(z.string())
      .optional()
      .describe('Optional list of image paths to include in the context'),
    model: z
      .string()
      .optional()
      .describe('Optional model specification (for future use)'),
    mode: z
      .string()
      .optional()
      .describe('Optional mode specification (for future use)'),
    ide_type: z
      .enum(['auto', 'cursor', 'vscode', 'windsurf'])
      .optional()
      .default('auto')
      .describe('Force specific IDE type, or auto-detect if not specified'),
  })
  .strict();

export const CallAgentOutputSchema = z
  .object({
    success: z.boolean().describe('Whether the agent call was successful'),
    message: z.string().describe('Human-readable result message'),
    ide_detected: z.string().describe('The IDE type that was detected or used'),
    command_executed: z
      .string()
      .optional()
      .describe('The actual command that was executed (for debugging)'),
  })
  .strict();

export type CallAgentPayload = z.infer<typeof CallAgentInputSchema>;
export type CallAgentResult = z.infer<typeof CallAgentOutputSchema>; 