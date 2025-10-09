
import { z } from 'zod';

/**
 * Shared schema for validating VSCode workspace paths
 * Ensures the path is absolute, relative paths like "." are not supported
 */
export const workspacePathSchema = z
  .string()
  .describe('Absolute path to the VSCode workspace. Never use relative paths like ".".')

/**
 * Helper object for creating tool input schemas that include workspace_path
 * Can be merged with other schema shapes
 *
 * @example
 * ```typescript
 * const inputSchema = {
 *   ...workspacePathInputSchema,
 *   ...SomeToolInputSchema.shape,
 * };
 * ```
 */
export const workspacePathInputSchema = {
  workspace_path: workspacePathSchema,
} as const;