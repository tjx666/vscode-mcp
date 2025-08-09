import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetDefinitionInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetDefinitionInputSchema.shape
};

const DESCRIPTION = `Get definition location information for a symbol (variable, function, class, etc.) by name. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Obtain LSP-based definition information for accurate code understanding

**Parameter Examples:**
- Get function definition: uri: 'file:///utils.ts', symbol: 'processData'
- Get class definition: uri: 'file:///models.ts', symbol: 'UserModel'  
- Precise location: uri: 'file:///config.ts', symbol: 'config', codeSnippet: 'export const config'

**Return Format:**
Array of Location objects, each containing:
- uri: File path where the symbol is defined
- range: Exact position coordinates (line/character numbers)
- Returns empty array if no definition found

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- Uses smart text search to locate the symbol definition first
- codeSnippet helps precisely locate the symbol when multiple occurrences exist
- Some symbols may not have definitions (e.g., built-in types, external libraries)`;

export function registerGetDefinition(server: McpServer) {
  server.registerTool("get_definition", {
    title: "Get Definition",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Definition",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, symbol, codeSnippet }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getDefinition", { uri, symbol, codeSnippet });
      
      // Check if result is empty and provide helpful feedback
      if (Array.isArray(result) && result.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ No definition found for symbol "${symbol}" in ${uri}

💡 **Troubleshooting Tips:**
- Make sure the symbol name is spelled correctly
- Try providing a codeSnippet if there are multiple symbols with the same name
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running
- Some symbols may not have definitions (e.g., built-in types, external libraries)

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
      return formatToolCallError("Get Definition", error);
    }
  });
} 