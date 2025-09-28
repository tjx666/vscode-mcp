/**
 * List workspaces event types and schemas
 */

import { z } from 'zod';

/**
 * List workspaces input schema
 */
export const ListWorkspacesInputSchema = z.object({}).strict();

/**
 * Workspace info schema
 */
export const WorkspaceInfoSchema = z.object({
  workspace_path: z.string().describe('Workspace path or identifier'),
  workspace_name: z.string().optional().describe('Workspace friendly name'),
  workspace_type: z.enum(['single-folder', 'multi-folder', 'workspace-file']).optional()
    .describe('Type of VSCode workspace'),
  folders: z.array(z.string()).optional()
    .describe('List of folders in multi-folder workspace'),
  status: z.enum(['active', 'available', 'error'])
    .describe('Connection status of the workspace'),
  extension_version: z.string().optional()
    .describe('VSCode MCP Bridge extension version'),
  vscode_version: z.string().optional()
    .describe('VSCode version'),
  ide_type: z.string().optional()
    .describe('IDE type (vscode, cursor, windsurf, trae, unknown)'),
  socket_path: z.string().optional()
    .describe('Socket file path (for debugging)'),
  error: z.string().optional()
    .describe('Error message if status is error'),
  last_seen: z.string().optional()
    .describe('Last active timestamp')
}).strict();

/**
 * List workspaces output schema
 */
export const ListWorkspacesOutputSchema = z.object({
  workspaces: z.array(WorkspaceInfoSchema)
    .describe('List of discovered workspaces'),
  summary: z.object({
    total: z.number().describe('Total number of workspaces found'),
    active: z.number().describe('Number of active workspaces'),
    available: z.number().describe('Number of available but untested workspaces'),
    cleaned: z.number().describe('Number of zombie sockets cleaned')
  }).strict().describe('Summary statistics')
}).strict();

/**
 * List workspaces payload (input parameters)
 */
export type ListWorkspacesPayload = z.infer<typeof ListWorkspacesInputSchema>;

/**
 * List workspaces result (output data)
 */
export type ListWorkspacesResult = z.infer<typeof ListWorkspacesOutputSchema>;

/**
 * Workspace info type
 */
export type WorkspaceInfo = z.infer<typeof WorkspaceInfoSchema>;