/**
 * Common types and schemas used across events
 */

import { z } from 'zod';

/**
 * Position schema
 */
export const PositionSchema = z.object({
  line: z.number(),
  character: z.number(),
}).strict();

/**
 * Range schema
 */
export const RangeSchema = z.object({
  start: PositionSchema,
  end: PositionSchema,
}).strict();

/**
 * Location schema
 */
export const LocationSchema = z.object({
  uri: z.string(),
  range: RangeSchema,
}).strict();

/**
 * Position type
 */
export type Position = z.infer<typeof PositionSchema>;

/**
 * Range type
 */
export type Range = z.infer<typeof RangeSchema>;

/**
 * Location type
 */
export type Location = z.infer<typeof LocationSchema>;

/**
 * Symbol context schema - common fields for symbol-based operations
 */
export const SymbolContextSchema = z.object({
  uri: z.string().describe('File URI'),
  symbol: z.string().describe('Symbol name'),
  codeSnippet: z.string().optional().describe('Optional code snippet to precisely locate the symbol when multiple occurrences exist'),
}).strict();

/**
 * Symbol context type
 */
export type SymbolContext = z.infer<typeof SymbolContextSchema>; 