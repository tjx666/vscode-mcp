import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetReferencesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetReferencesInputSchema.shape
};

const DESCRIPTION = `Find all reference locations of a symbol (variable, function, class, etc.) across the codebase

**Parameter Examples:**
- Find function references: filePath: 'utils.ts', symbol: 'getUserName', codeSnippet: 'function getUserName', includeDeclaration: true
- Check variable usage: filePath: 'config.js', symbol: 'API_URL', codeSnippet: 'const API_URL ='
- Find imported symbol: filePath: 'app.ts', symbol: 'config', codeSnippet: 'import { config } from'
- Absolute path: filePath: '/absolute/path/service.ts', symbol: 'ApiService'

**Return Format:**
Array of reference locations with file paths and exact positions

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- Uses smart text search to locate the symbol definition first
- codeSnippet helps precisely locate the symbol when multiple occurrences exist
- includeDeclaration: false excludes the symbol definition itself
- Returns empty array if symbol not found or no references exist`;

export function registerGetReferences(server: McpServer) {
  server.registerTool("get_references", {
    title: "Get References",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get References",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, filePath, symbol, codeSnippet, includeDeclaration, usageCodeLineRange }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getReferences", { 
        filePath, 
        symbol, 
        codeSnippet,
        includeDeclaration,
        usageCodeLineRange
      });
      
      // Check if result is empty and provide helpful feedback
      if (result.locations && result.locations.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ No references found for symbol "${symbol}" in ${filePath}

💡 **Troubleshooting Tips:**
- Make sure the symbol name is spelled correctly
- Try providing a codeSnippet if there are multiple symbols with the same name
- Try setting includeDeclaration: true to include the symbol definition itself
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running
- Some symbols may not have references if they're unused or only declared

📄 **Raw Result:**
${JSON.stringify(result, null, 2)}`
          }]
        };
      }
      
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Get References", error);
    }
  });
} 