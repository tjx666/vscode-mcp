import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, RenameSymbolInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...RenameSymbolInputSchema.shape
};

const DESCRIPTION = `Rename a symbol (variable, function, class, etc.) at a specific position across all files. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Refactor code with consistent naming across entire codebase during code improvements
- Fix naming conflicts or improve code readability as part of code review
- ALWAYS prefer this over multiple edit_file calls - much more efficient and accurate for symbol renaming

**Parameter Examples:**
- Rename variable: uri: 'file:///utils.ts', line: 10, character: 15, newName: 'processedData'
- Rename function: uri: 'file:///api.ts', line: 25, character: 8, newName: 'handleUserRequest'
- Rename class: uri: 'file:///models.ts', line: 5, character: 13, newName: 'UserModel'

**Return Format:**
- success: boolean indicating if rename was successful
- symbolName: original symbol name that was renamed
- modifiedFiles: array of files that were changed with change counts
- totalChanges: total number of text changes made
- error: detailed error message if rename failed

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- No need to position cursor at target location - just provide position parameters
- Position must be exactly on a renameable symbol
- Returns error if position is not on a valid symbol
- Modifies files immediately - operation cannot be undone through this tool
- Some symbols may not be renameable (e.g., built-in types, external libraries)`;

export function registerRenameSymbol(server: McpServer) {
  server.registerTool("rename_symbol", {
    title: "⚠️ Rename Symbol",
    description: DESCRIPTION,
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