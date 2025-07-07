import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { CallAgentInputSchema,createDispatcher } from '@vscode-mcp/vscode-mcp-ipc';
import { z } from 'zod';

import { formatToolCallError } from './utils.js';

const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...CallAgentInputSchema.shape,
};

export function registerCallAgent(server: McpServer) {
  server.registerTool(
    'call_agent',
    {
      title: 'Call IDE Agent',
      description: `Call the AI agent in VSCode, Cursor, Windsurf, or other IDE forks with a prompt. Works with all VSCode-based editors.

**AI Coding Agent Use Cases:**
- Send requests to the IDE's built-in AI agent (like Cursor's Composer, GitHub Copilot Chat, etc.)
- Delegate tasks to the IDE's agent for code generation, explanation, or modification
- Leverage IDE-specific AI features that are already available in the workspace
- Combine with other MCP tools for comprehensive AI-assisted development workflows

**Parameter Examples:**
- Simple request: prompt: "Explain this function", ide_type: "auto"
- With files: prompt: "Refactor this code", files: ["src/utils.ts", "src/types.ts"]
- Force specific IDE: prompt: "Generate tests", ide_type: "cursor"

**Return Format:** 
JSON object with success status, human-readable message, detected IDE type, and executed command

**Important Notes:**
- Automatically detects IDE type (Cursor, VSCode, Windsurf) or can be forced with ide_type parameter
- For Cursor: Uses composer.fixerrormessage command with formatted prompt prefix
- For VSCode: Attempts GitHub Copilot Chat, Continue extension, or shows installation guidance
- For Windsurf: Looks for Windsurf-specific AI commands, falls back to VSCode approach
- Files and images parameters are included in the context when supported by the IDE`,
      inputSchema,
      annotations: {
        title: 'Call IDE Agent',
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: false,
      },
    },
    async ({ workspace_path, prompt, files, images, model, mode, ide_type }) => {
      try {
        const dispatcher = createDispatcher(workspace_path);
        const result = await dispatcher.dispatch('callAgent', { 
          prompt, 
          files, 
          images, 
          model, 
          mode, 
          ide_type 
        });

        const statusIcon = result.success ? '✅' : '❌';
        const message = `${statusIcon} ${result.message}`;
        
        const details = [
          `IDE detected: ${result.ide_detected}`,
          result.command_executed ? `Command executed: ${result.command_executed}` : null,
          files && files.length > 0 ? `Files included: ${files.length}` : null,
          images && images.length > 0 ? `Images included: ${images.length}` : null,
        ].filter(Boolean).join('\n');

        return {
          content: [
            {
              type: 'text' as const,
              text: details ? `${message}\n\n${details}` : message,
            },
          ],
        };
      } catch (error) {
        return formatToolCallError('Call IDE Agent', error);
      }
    },
  );
} 