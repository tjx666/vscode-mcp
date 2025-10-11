import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, OpenFilesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...OpenFilesInputSchema.shape
};

const DESCRIPTION = `Open files in vscode`
export function registerOpenFiles(server: McpServer) {
  server.registerTool(VscodeMcpToolName.OPEN_FILES, {
    title: "Open Files",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Open Files",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, files }) => {
    const dispatcher = await createDispatcher(workspace_path);

    try {
      const result = await dispatcher.dispatch("openFiles", { files });
      
      // Handle case where no files were provided
      if (result.results.length === 0) {
        return {
          content: [{
            type: "text",
            text: "📄 No files provided to open."
          }]
        };
      }
      
      // Count successful and failed operations
      const successful = result.results.filter(r => r.success);
      const failed = result.results.filter(r => !r.success);
      
      // Format output for better readability
      const output = result.results.map(fileResult => {
        if (fileResult.success) {
          return `✅ ${fileResult.filePath}\n   ${fileResult.message}`;
        } else {
          return `❌ ${fileResult.filePath}\n   ${fileResult.message}`;
        }
      }).join('\n\n');
      
      const summary = `📁 Opened ${successful.length}/${result.results.length} files successfully${ 
        failed.length > 0 ? ` (${failed.length} failed)` : '' 
        }:\n\n${  output}`;
      
      return {
        content: [{
          type: "text",
          text: summary
        }]
      };
    } catch (error) {
      return formatToolCallError("Open Files", error);
    }
  });
} 