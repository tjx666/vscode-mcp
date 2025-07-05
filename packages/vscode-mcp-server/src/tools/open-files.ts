import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, OpenFilesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...OpenFilesInputSchema.shape
};

export function registerOpenFiles(server: McpServer) {
  server.registerTool("open_files", {
    title: "Open Files",
    description: "Open multiple files in VSCode. Each file can be optionally displayed in the editor or just loaded in the background for LSP processing.",
    inputSchema,
    annotations: {
      title: "Open Files",
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, files }) => {
    const dispatcher = createDispatcher(workspace_path);
    
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
          return `✅ ${fileResult.uri}\n   ${fileResult.message}`;
        } else {
          return `❌ ${fileResult.uri}\n   ${fileResult.message}`;
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