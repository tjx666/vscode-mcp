import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, OpenFilesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...OpenFilesInputSchema.shape
};

const DESCRIPTION = `Open multiple files in editor with optional display control for efficient LSP processing. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Pre-load files for analysis without cluttering the editor interface (showEditor: false)
- Prepare multiple files for batch operations like diagnostics or cross-file refactoring
- Ensure accurate LSP information by opening files in editor context before analysis
- Open related files (imports, dependencies) before performing complex code operations
- Load file sets for comprehensive code review and understanding

**Parameter Examples:**
- Background loading: files: [{ uri: 'file:///app.ts', showEditor: false }]
- Open in editor: files: [{ uri: 'file:///main.js', showEditor: true }]
- Mixed mode: files: [{ uri: 'file:///config.ts', showEditor: true }, { uri: 'file:///utils.ts', showEditor: false }]

**Return Format:**
Success status with count of files processed and any errors encountered

**Important Notes:**
- showEditor: false loads files for LSP without displaying tabs
- Files must exist and be accessible to VSCode
- Loading large numbers of files may impact performance
- Essential for accurate diagnostics and code analysis`;

export function registerOpenFiles(server: McpServer) {
  server.registerTool("open_files", {
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