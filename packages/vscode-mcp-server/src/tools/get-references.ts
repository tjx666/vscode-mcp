import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetReferencesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetReferencesInputSchema.shape
};

const DESCRIPTION = `Find all reference locations for a symbol (variable, function, class, etc.) across the codebase. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Assess the impact of modifying or removing a symbol before making changes
- Assess the impact of refactoring function or class logic
- Find all usage patterns in complex codebases

**Parameter Examples:**
- Find function references: uri: 'file:///utils.ts', symbol: 'getUserName', includeDeclaration: true
- Check variable usage: uri: 'file:///config.js', symbol: 'API_URL'
- Precise location: uri: 'file:///app.ts', symbol: 'config', codeSnippet: 'import { config } from'

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
  }, async ({ workspace_path, uri, symbol, codeSnippet, includeDeclaration, usageCodeLineRange }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getReferences", { 
        uri, 
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
            text: `❌ No references found for symbol "${symbol}" in ${uri}

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