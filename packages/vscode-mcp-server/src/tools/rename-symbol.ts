import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, RenameSymbolInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...RenameSymbolInputSchema.shape
};
const DESCRIPTION = `Rename a symbol with VSCode F2 ability

Advantages over search and replace:

- Faster
- More accurate
- Automatically updates imports and reference locations

**Important Notes:**
- Some symbols may not be renameable (e.g., built-in types, external libraries)`;

export function registerRenameSymbol(server: McpServer) {
  server.registerTool(VscodeMcpToolName.RENAME_SYMBOL, {
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
  }, async ({ workspace_path, filePath, symbol, codeSnippet, newName }) => {
    const dispatcher = await createDispatcher(workspace_path);

    try {
      const result = await dispatcher.dispatch("renameSymbol", { filePath, symbol, codeSnippet, newName });
      
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