/**
 * Get symbol LSP info event types and schemas
 * This combines all LSP-related symbol information queries into one unified tool
 */

import { z } from 'zod';

import { LocationSchema, RangeSchema, SymbolLocatorSchema } from './common.js';

/**
 * LSP info types that can be requested
 */
export const LSPInfoTypeSchema = z.enum([
  'hover',
  'signature_help',
  'type_definition',
  'definition',
  'implementation',
  'all'
]);

/**
 * Hover schema
 */
const HoverSchema = z.object({
  contents: z.union([z.string(), z.array(z.string())]),
  range: RangeSchema.optional(),
}).strict();

/**
 * Parameter information schema for signature help
 */
const ParameterInformationSchema = z.object({
  label: z.string(),
  documentation: z.string().optional(),
}).strict();

/**
 * Signature information schema
 */
const SignatureInformationSchema = z.object({
  label: z.string(),
  documentation: z.string().optional(),
  parameters: z.array(ParameterInformationSchema).optional(),
}).strict();

/**
 * Signature help schema
 */
const SignatureHelpSchema = z.object({
  signatures: z.array(SignatureInformationSchema),
  activeSignature: z.number().optional(),
  activeParameter: z.number().optional(),
}).strict();

/**
 * Get symbol LSP info input schema
 */
export const GetSymbolLSPInfoInputSchema = SymbolLocatorSchema.extend({
  infoType: LSPInfoTypeSchema.optional().default('all').describe('Type of LSP information to retrieve. Defaults to "all" which includes all available information. Can specify individual types like "definition", "hover" for selective retrieval.'),
}).strict();

/**
 * Get symbol LSP info output schema
 */
export const GetSymbolLSPInfoOutputSchema = z.object({
  hover: z.array(HoverSchema).optional().describe('Hover information for the symbol'),
  signature_help: SignatureHelpSchema.nullable().optional().describe('Function signature help information'),
  type_definition: z.array(LocationSchema).optional().describe('Symbol type definition locations'),
  definition: z.array(LocationSchema).optional().describe('Symbol definition locations'),
  implementation: z.array(LocationSchema).optional().describe('Symbol implementation locations'),
}).strict();

/**
 * Get symbol LSP info payload (input parameters)
 */
export type GetSymbolLSPInfoPayload = z.infer<typeof GetSymbolLSPInfoInputSchema>;

/**
 * Get symbol LSP info result (output data)
 */
export type GetSymbolLSPInfoResult = z.infer<typeof GetSymbolLSPInfoOutputSchema>;

/**
 * LSP info type
 */
export type LSPInfoType = z.infer<typeof LSPInfoTypeSchema>;

/**
 * Internal types for schema composition - not exported to avoid conflicts
 * These types are already exported by their respective modules
 */