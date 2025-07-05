/**
 * Get hover event types and schemas
 */

import { z } from 'zod';

import { RangeSchema } from './common.js';

/**
 * Hover schema
 */
const HoverSchema = z.object({
  contents: z.union([z.string(), z.array(z.string())]),
  range: RangeSchema.optional(),
}).strict();

/**
 * Get hover input schema
 */
export const GetHoverInputSchema = z.object({
  uri: z.string().describe('File URI'),
  line: z.number().describe('Line number (0-based)'),
  character: z.number().describe('Character position (0-based)'),
}).strict();

/**
 * Get hover output schema
 */
export const GetHoverOutputSchema = z.object({
  hover: HoverSchema.nullable(),
}).strict();

/**
 * Get hover payload (input parameters)
 */
export type GetHoverPayload = z.infer<typeof GetHoverInputSchema>;

/**
 * Get hover result (output data)
 */
export type GetHoverResult = z.infer<typeof GetHoverOutputSchema>;

/**
 * Hover type (for backward compatibility)
 */
export type Hover = z.infer<typeof HoverSchema>; 