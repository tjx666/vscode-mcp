/**
 * List open editors event types and schemas
 */

import { z } from 'zod';

/**
 * List open editors input schema (no parameters — the bound window is implied
 * by the workspace_path the MCP/CLI adapter uses to pick the socket).
 */
export const ListOpenEditorsInputSchema = z.object({}).strict();

/**
 * A single open editor tab.
 */
export const OpenEditorTabSchema = z
  .object({
    label: z.string().describe('Tab label as shown in the VSCode UI'),
    uri: z
      .string()
      .optional()
      .describe(
        'Resource URI of the tab when it has one (file/untitled/notebook/custom). Diff tabs report the modified-side URI. Webview/terminal tabs have none.',
      ),
    kind: z
      .enum([
        'text',
        'diff',
        'notebook',
        'notebook-diff',
        'custom',
        'webview',
        'terminal',
        'other',
      ])
      .describe('Kind of tab input'),
    group_index: z.number().describe('Index of the tab group (editor column) this tab belongs to'),
    is_active: z.boolean().describe('Whether this is the active tab in its group'),
    is_dirty: z.boolean().describe('Whether the tab has unsaved changes'),
    is_pinned: z.boolean().describe('Whether the tab is pinned'),
    is_preview: z.boolean().describe('Whether the tab is a preview (italic, single-click) tab'),
  })
  .strict();

/**
 * List open editors output schema
 */
export const ListOpenEditorsOutputSchema = z
  .object({
    editors: z
      .array(OpenEditorTabSchema)
      .describe('Every open editor tab across all tab groups, in group/tab order'),
    summary: z
      .object({
        total: z.number().describe('Total number of open tabs'),
        groups: z.number().describe('Number of tab groups (editor columns)'),
        active_group_index: z
          .number()
          .optional()
          .describe('Index of the active tab group, if any'),
      })
      .strict()
      .describe('Summary statistics'),
  })
  .strict();

/**
 * List open editors payload (input parameters)
 */
export type ListOpenEditorsPayload = z.infer<typeof ListOpenEditorsInputSchema>;

/**
 * List open editors result (output data)
 */
export type ListOpenEditorsResult = z.infer<typeof ListOpenEditorsOutputSchema>;

/**
 * Single open editor tab type
 */
export type OpenEditorTab = z.infer<typeof OpenEditorTabSchema>;
