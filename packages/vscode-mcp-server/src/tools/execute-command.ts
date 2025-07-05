import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, ExecuteCommandInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...ExecuteCommandInputSchema.shape
};

const DESCRIPTION = `⚠️ Execute VSCode commands with arguments - DANGEROUS tool that can modify workspace, settings, or trigger harmful operations. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**SECURITY WARNING:**
This tool can execute arbitrary VSCode commands and potentially:
- Modify files, settings, or workspace configuration
- Install/uninstall extensions
- Change editor state or user preferences
- Trigger external processes or network operations

**AI Coding Agent Use Cases:**
- Format entire documents or selected code: 'editor.action.formatDocument'
- Open specific files for analysis: 'vscode.open' with file URI
- Trigger intelligent refactoring operations: 'editor.action.rename'
- Run build tasks and scripts: 'workbench.action.tasks.runTask'
- Save all modified files after bulk operations: 'workbench.action.files.saveAll'

**Parameter Examples:**
- Format code: command: 'editor.action.formatDocument'
- Open file: command: 'vscode.open', args: ['file:///path/to/file.ts']
- Save all: command: 'workbench.action.files.saveAll'

**Return Format:**
Command execution result or confirmation message

**Important Notes:**
- USE WITH EXTREME CAUTION - can cause irreversible changes
- Always validate command safety before execution
- Some commands may require specific context or editor state
- Command availability depends on installed extensions and VSCode version`;

export function registerExecuteCommand(server: McpServer) {
  server.registerTool("execute_command", {
    title: "⚠️ Execute VSCode Command",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "⚠️ Execute VSCode Command",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, command, args }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("executeCommand", { command, args });
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Execute Command", error);
    }
  });
} 