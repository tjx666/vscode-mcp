import { isAbsolute } from 'path';

import { z } from 'zod';

/**
 * Shared schema for validating VSCode workspace paths
 * Ensures the path is absolute, relative paths like "." are not supported
 */
export const workspacePathSchema = z
  .string()
  .describe('VSCode workspace path to target')
  .refine(
    (path) => isAbsolute(path),
    {
      message: 'Workspace path must be an absolute path. Relative paths like "." are not supported.',
    }
  );

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