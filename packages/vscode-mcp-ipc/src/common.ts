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
  usageCode: z.string().optional().describe('Usage context code around the reference location (included based on usageCodeLineRange parameter)'),
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
 * File path schema - supports both absolute and relative paths
 */
export const FilePathSchema = z.string().describe('File path (absolute or relative to workspace root)');

/**
 * Symbol locator schema - common fields for locating symbols in code
 */
export const SymbolLocatorSchema = z.object({
  filePath: FilePathSchema,
  symbol: z.string().describe('Symbol name'),
  codeSnippet: z.string().optional().describe(`Optional code snippet to help precisely locate the symbol when there are multiple symbols with the same name. Eg: "function getUserName()" when locating the symbol "getUserName"`),
}).strict();

/**
 * Symbol locator type
 */
export type SymbolLocator = z.infer<typeof SymbolLocatorSchema>; 