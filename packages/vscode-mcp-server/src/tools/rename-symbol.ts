import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, RenameSymbolInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...RenameSymbolInputSchema.shape
};

export function registerRenameSymbol(server: McpServer) {
  server.registerTool("rename_symbol", {
    title: "⚠️ Rename Symbol",
    description: "Rename a symbol (variable, function, class, etc.) at a specific position across all files.\n\n**AI Coding Agent Use Cases:**\n- Refactor code with consistent naming across entire codebase\n- Rename variables/functions during code review and improvement\n- Fix naming conflicts or improve code readability\n- Batch rename operations guided by AI analysis\n\n**Parameter Examples:**\n- Rename variable: uri: 'file:///utils.ts', line: 10, character: 15, newName: 'processedData'\n- Rename function: uri: 'file:///api.ts', line: 25, character: 8, newName: 'handleUserRequest'\n- Rename class: uri: 'file:///models.ts', line: 5, character: 13, newName: 'UserModel'\n\n**Return Format:**\n- success: boolean indicating if rename was successful\n- symbolName: original symbol name that was renamed\n- modifiedFiles: array of files that were changed with change counts\n- totalChanges: total number of text changes made\n- error: detailed error message if rename failed\n\n**AI Coding Agent Benefits:**\n- Automatic cross-file consistency without manual search-replace\n- Language-aware renaming that respects scope and context\n- Batch processing eliminates need for multiple manual operations\n- Prevents breaking references through LSP-powered accuracy\n\n**Important Notes:**\n- Position must be exactly on a renameable symbol\n- Returns error if position is not on a valid symbol\n- Modifies files immediately - operation cannot be undone through this tool\n- Some symbols may not be renameable (e.g., built-in types, external libraries)",
    inputSchema,
    annotations: {
      title: "⚠️ Rename Symbol",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, line, character, newName }) => {
    const dispatcher = createDispatcher(workspace_path);
    
    try {
      const result = await dispatcher.dispatch("renameSymbol", { uri, line, character, newName });
      
      if (result.success) {
        const filesList = result.modifiedFiles
          .map(f => `  📄 ${f.uri} (${f.changeCount} changes)`)
          .join('\n');
          
        return {
          content: [{
            type: "text",
            text: `✅ Successfully renamed '${result.symbolName}' to '${newName}'

📊 Summary:
- Total changes: ${result.totalChanges}
- Modified files: ${result.modifiedFiles.length}

📁 Files modified:
${filesList}`
          }]
        };
      } else {
        return {
          content: [{
            type: "text", 
            text: `❌ Rename failed: ${result.error}`
          }]
        };
      }
    } catch (error) {
      return formatToolCallError("Rename Symbol", error);
    }
  });
} 