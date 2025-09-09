import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, RenameFileInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "../utils/format-tool-call-error.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...RenameFileInputSchema.shape
};

const DESCRIPTION = `Rename a file with automatic import updates

**Key Advantage:**
- Automatically updates TypeScript/JavaScript import statements
- Much more reliable than using 'mv' command directly

**Safety Restrictions:**
- Only operates on files within workspace boundaries
- Only operates on git-tracked files (committed or staged)

**Parameter Examples:**
- Simple rename: filePath: 'src/utils.ts', newName: 'helpers.ts'
- Change extension: filePath: '/absolute/path/Button.jsx', newName: 'Button.tsx'
- Add prefix: filePath: 'lib/api.js', newName: 'api-client.js'

**Return Format:**
- success: boolean indicating if rename was successful
- newUri: new file URI after rename
- error: detailed error message if rename failed`;

export function registerRenameFile(server: McpServer) {
  server.registerTool("rename_file", {
    title: "⚠️ Rename File",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "⚠️ Rename File",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, filePath, newName }) => {
    const dispatcher = createDispatcher(workspace_path);
    
    try {
      const result = await dispatcher.dispatch("renameFile", { filePath, newName });
      
      if (result.success) {
        return {
          content: [{
            type: "text",
            text: `✅ File renamed successfully!

📄 **Before:** ${filePath}
📄 **After:**  ${result.newUri}

✨ **Benefits Applied:**
- All import statements automatically updated
- Project integrity maintained
- TypeScript references updated`
          }]
        };
      } else {
        return {
          content: [{
            type: "text", 
            text: `❌ File rename failed: ${result.error}

💡 **Troubleshooting Tips:**
- Verify the source file exists: ${filePath}
- Make sure the new name is not already taken
- Check that the file is not currently in use by another process
- Ensure you have write permissions for the directory
- Try closing the file in the editor if it's currently open`
          }]
        };
      }
    } catch (error) {
      return formatToolCallError("Rename File", error);
    }
  });
}