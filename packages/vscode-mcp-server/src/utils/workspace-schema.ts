
import { z } from 'zod';

/**
 * Shared schema for validating VSCode workspace paths
 * Ensures the path is absolute, relative paths like "." are not supported
 */
export const workspacePathSchema = z
  .string()
  .describe(
    'Absolute path of the open VSCode workspace folder that runs the VSCode MCP Bridge extension. This value selects the VSCode socket, so it must match the workspace shown by list_workspaces or the extension activation log. Do not pass a child project or submodule path unless VSCode is opened at that path.',
  )

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
