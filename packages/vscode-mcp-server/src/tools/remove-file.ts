import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, RemoveFileInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "../utils/formatToolCallError.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...RemoveFileInputSchema.shape
};

const DESCRIPTION = `Remove file or folder using VSCode's workspace API with undo support

**Key Advantage:** 
- Files are always moved to trash (never permanently deleted) for safety
- Deleted files can be restored with Cmd+Z (macOS) / Ctrl+Z (Windows)
- Much safer than rm command which permanently deletes without recovery option

**Safety Restrictions:**
- Only operates on files within workspace boundaries
- Only operates on git-tracked files (committed or staged)

**Parameter Examples:**
- Remove file: filePath: 'src/unused.ts'
- Remove folder: filePath: 'old-components/', recursive: true
- Absolute path: filePath: '/absolute/path/to/file.ts'

**Return Format:**
- success: boolean indicating if removal was successful
- deletedPath: path that was deleted  
- message: success/failure details
- error: detailed error message if removal failed`;

export function registerRemoveFile(server: McpServer) {
  server.registerTool("remove_file", {
    title: "⚠️ Remove File/Folder",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "⚠️ Remove File/Folder",
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false
    }
  }, async ({ workspace_path, filePath, recursive }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("removeFile", { filePath, recursive });
      
      if (result.success) {
        return {
          content: [{
            type: "text",
            text: `✅ Successfully removed '${result.deletedPath}' 🗑️ (moved to trash - can be restored)

💡 **Recovery Tips:**
- Use Cmd+Z (macOS) or Ctrl+Z (Windows) in VSCode to undo this deletion
- Or restore from your system's trash/recycle bin

📊 **Operation Details:**
- Target: ${result.deletedPath}
- Method: Moved to trash (safe deletion)
- Recursive: ${recursive !== false ? 'Yes' : 'No'}`
          }]
        };
      } else {
        return {
          content: [{
            type: "text", 
            text: `❌ Remove failed: ${result.error}

💡 **Troubleshooting Tips:**
- Make sure the file or folder path exists
- Check if the file is currently open in VSCode (close it first)
- For folders, ensure recursive: true if folder contains files
- Verify you have write permissions to the target location
- Try using absolute path if relative path doesn't work

🔍 **Debug Info:**
- Target path: ${filePath}
- Workspace: ${workspace_path}`
          }]
        };
      }
    } catch (error) {
      return formatToolCallError("Remove File", error);
    }
  });
}