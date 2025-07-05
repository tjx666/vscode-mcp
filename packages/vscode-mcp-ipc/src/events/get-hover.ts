/**
 * Get hover event types and schemas
 */

import { z } from 'zod';

import { RangeSchema } from './common.js';

/**
 * Hover position schema
 */
const HoverPositionSchema = z.object({
  uri: z.string().describe('File URI'),
  line: z.number().describe('Line number (0-based)'),
  character: z.number().describe('Character position (0-based)'),
}).strict();

/**
 * Hover schema
 */
const HoverSchema = z.object({
  contents: z.union([z.string(), z.array(z.string())]),
  range: RangeSchema.optional(),
}).strict();

/**
 * Position hover result schema
 */
const PositionHoverResultSchema = z.object({
  position: HoverPositionSchema,
  hovers: z.array(HoverSchema),
  error: z.string().optional(),
}).strict();

/**
 * Get hover input schema
 */
export const GetHoverInputSchema = z.object({
  positions: z.array(HoverPositionSchema).min(1).describe('Array of positions to get hover information for'),
  includeAllHovers: z.boolean().optional().default(false).describe('Whether to include all hover information from all providers (true) or just the first one (false)'),
}).strict();

/**
 * Get hover output schema
 */
export const GetHoverOutputSchema = z.object({
  results: z.array(PositionHoverResultSchema),
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
 * Hover position type
 */
export type HoverPosition = z.infer<typeof HoverPositionSchema>;

/**
 * Position hover result type
 */
export type PositionHoverResult = z.infer<typeof PositionHoverResultSchema>;

/**
 * Hover type (for backward compatibility)
 */
export type Hover = z.infer<typeof HoverSchema>; 