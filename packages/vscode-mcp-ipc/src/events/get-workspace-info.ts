/**
 * Get workspace info event types and schemas
 */

import { z } from 'zod';

/**
 * Workspace folder schema
 */
const WorkspaceFolderSchema = z.object({
  uri: z.string(),
  name: z.string(),
}).strict();

/**
 * Workspace info schema
 */
const WorkspaceInfoSchema = z.object({
  name: z.string().optional(),
  uri: z.string(),
  folders: z.array(WorkspaceFolderSchema),
}).strict();

/**
 * Get workspace info input schema
 */
export const GetWorkspaceInfoInputSchema = z.object({}).strict();

/**
 * Get workspace info output schema
 */
export const GetWorkspaceInfoOutputSchema = z.object({
  workspace: WorkspaceInfoSchema,
}).strict();

/**
 * Get workspace info payload (input parameters)
 */
export type GetWorkspaceInfoPayload = z.infer<typeof GetWorkspaceInfoInputSchema>;

/**
 * Get workspace info result (output data)
 */
export type GetWorkspaceInfoResult = z.infer<typeof GetWorkspaceInfoOutputSchema>;

/**
 * Workspace info type (for backward compatibility)
 */
export type WorkspaceInfo = z.infer<typeof WorkspaceInfoSchema>; 