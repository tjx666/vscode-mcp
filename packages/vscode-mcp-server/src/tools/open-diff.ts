import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDispatcher, OpenDiffBaseInputSchema } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { formatToolCallError } from './utils.js';

// 复用 IPC 层的基础 Schema，只添加 workspace_path
const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...OpenDiffBaseInputSchema.shape,
};

const DESCRIPTION = `Open diff editor in VSCode to compare files or text content side by side.

**AI Coding Agent Use Cases:**
- Show before/after comparisons of code changes
- Compare different versions of files during refactoring
- Demonstrate code improvements or alternatives
- Review generated code against existing implementations

**Parameter Examples:**
- Compare files: before: 'file:///old.ts', after: 'file:///new.ts'
- Compare text: beforeText: 'old code', afterText: 'new code', language: 'typescript'
- Custom labels: beforeLabel: 'Original', afterLabel: 'Generated', language: 'javascript'

**Return Format:**
Confirmation of diff editor opened successfully

**AI Coding Agent Benefits:**
- Visual code comparison for better understanding
- Clear demonstration of proposed changes
- Easy review of AI-generated modifications
- Side-by-side analysis of code alternatives

**Important Notes:**
- Either use file URIs (before/after) or text content (beforeText/afterText)
- Language parameter helps with syntax highlighting for text comparisons
- Custom labels improve readability in diff view
- Files are automatically opened if they don't exist in editor`;

export function registerOpenDiff(server: McpServer) {
  server.registerTool(
    'open_diff',
    {
      title: 'Open Diff Editor',
      description: DESCRIPTION,
      inputSchema,
      annotations: {
        title: 'Open Diff Editor',
        readOnlyHint: true,
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