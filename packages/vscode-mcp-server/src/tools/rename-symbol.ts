import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, RenameSymbolInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...RenameSymbolInputSchema.shape
};

const DESCRIPTION = `Rename a symbol (variable, function, class, etc.) by name across codebase

**Parameter Examples:**
- Rename variable: uri: 'file:///utils.ts', symbol: 'userData', codeSnippet: 'const userData =', newName: 'processedData'
- Rename function: uri: 'file:///api.ts', symbol: 'handleRequest', codeSnippet: 'async function handleRequest', newName: 'handleUserRequest'
- Rename class: uri: 'file:///models.ts', symbol: 'User', codeSnippet: 'class User extends', newName: 'UserModel'

**Return Format:**
- success: boolean indicating if rename was successful
- symbolName: original symbol name that was renamed
- modifiedFiles: array of files that were changed with change counts
- totalChanges: total number of text changes made
- error: detailed error message if rename failed

**Important Notes:**
- codeSnippet helps precisely locate the symbol when multiple occurrences exist
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
  }, async ({ workspace_path, uri, symbol, codeSnippet, newName }) => {
    const dispatcher = createDispatcher(workspace_path);
    
    try {
      const result = await dispatcher.dispatch("renameSymbol", { uri, symbol, codeSnippet, newName });
      
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
            text: `❌ Rename failed: ${result.error}

💡 **Troubleshooting Tips:**
- Make sure the symbol name is spelled correctly
- Try providing a codeSnippet if there are multiple symbols with the same name
- Some symbols cannot be renamed (e.g., built-in types, external libraries)
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running`
          }]
        };
      }
    } catch (error) {
      return formatToolCallError("Rename Symbol", error);
    }
  });
} 