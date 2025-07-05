import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDispatcher, OpenDiffBaseInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { formatToolCallError } from './utils.js';

// 复用 IPC 层的基础 Schema，只添加 workspace_path
const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...OpenDiffBaseInputSchema.shape,
};

export function registerOpenDiff(server: McpServer) {
  server.registerTool(
    'open_diff',
    {
      title: 'Open Diff Editor',
      description: 'Open a diff editor in VSCode to compare two files or text content side by side. Supports file-to-file, text-to-text, and mixed comparisons.',
      inputSchema,
      annotations: {
        title: 'Open Diff Editor',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false
      },
    },
    async ({ workspace_path, before, after, beforeText, afterText, beforeLabel, afterLabel, language }) => {
      const dispatcher = createDispatcher(workspace_path);

      try {
        const result = await dispatcher.dispatch('openDiff', {
          before,
          after,
          beforeText,
          afterText,
          beforeLabel,
          afterLabel,
          language,
        });

        if (result.success) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ ${result.message}`,
              },
            ],
          };
        } else {
          return {
            content: [
              {
                type: 'text',
                text: `❌ ${result.message}`,
              },
            ],
          };
        }
      } catch (error) {
        return formatToolCallError('Open Diff Editor', error);
      }
    },
  );
} 