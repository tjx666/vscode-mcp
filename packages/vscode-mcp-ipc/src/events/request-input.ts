import { z } from 'zod';

export const RequestInputInputSchema = z
  .object({
    prompt: z.string().describe('The question or request to show to the user'),
    placeholder: z.string().optional().describe('Placeholder text for the input box'),
    title: z.string().optional().describe('Title for the input dialog'),
    password: z.boolean().optional().default(false).describe('Whether to mask the input as password'),
    validateInput: z.boolean().optional().default(false).describe('Whether to validate that input is not empty'),
  })
  .strict();

export const RequestInputOutputSchema = z
  .object({
    userInput: z.string().optional().describe('The text entered by the user (undefined if cancelled)'),
    cancelled: z.boolean().describe('Whether the user cancelled the input dialog'),
  })
  .strict();

export type RequestInputPayload = z.infer<typeof RequestInputInputSchema>;
export type RequestInputResult = z.infer<typeof RequestInputOutputSchema>; 