/**
 * Get signature help event types and schemas
 */

import { z } from 'zod';

import { SymbolContextSchema } from './common.js';

/**
 * Parameter information schema
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
 * Get signature help input schema
 */
export const GetSignatureHelpInputSchema = SymbolContextSchema;

/**
 * Get signature help output schema
 */
export const GetSignatureHelpOutputSchema = z.object({
  signatureHelp: SignatureHelpSchema.nullable(),
}).strict();

/**
 * Get signature help payload (input parameters)
 */
export type GetSignatureHelpPayload = z.infer<typeof GetSignatureHelpInputSchema>;

/**
 * Get signature help result (output data)
 */
export type GetSignatureHelpResult = z.infer<typeof GetSignatureHelpOutputSchema>;

/**
 * Parameter information type (for backward compatibility)
 */
export type ParameterInformation = z.infer<typeof ParameterInformationSchema>;

/**
 * Signature information type (for backward compatibility)
 */
export type SignatureInformation = z.infer<typeof SignatureInformationSchema>;

/**
 * Signature help type (for backward compatibility)
 */
export type SignatureHelp = z.infer<typeof SignatureHelpSchema>; 