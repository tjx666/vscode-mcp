import { z } from 'zod';

export const ListExtensionToolsInputSchema = z.object({}).strict();

export const ExtensionToolInfoSchema = z.object({
  name: z.string().describe('Tool name'),
  description: z.string().describe('Tool description'),
  inputSchema: z.record(z.unknown()).describe('JSON Schema for tool input'),
  outputSchema: z.record(z.unknown()).optional().describe('JSON Schema for tool output'),
});

export const ListExtensionToolsOutputSchema = z.object({
  tools: z.array(ExtensionToolInfoSchema),
}).strict();

export const CallExtensionToolInputSchema = z.object({
  name: z.string().describe('Tool name to call'),
  input: z.record(z.unknown()).describe('Tool input parameters'),
}).strict();

export const CallExtensionToolOutputSchema = z.object({
  result: z.unknown().describe('Tool execution result'),
}).strict();

export type ListExtensionToolsPayload = z.infer<typeof ListExtensionToolsInputSchema>;
export type ListExtensionToolsResult = z.infer<typeof ListExtensionToolsOutputSchema>;
export type CallExtensionToolPayload = z.infer<typeof CallExtensionToolInputSchema>;
export type CallExtensionToolResult = z.infer<typeof CallExtensionToolOutputSchema>;
