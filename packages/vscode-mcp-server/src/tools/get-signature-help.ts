import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetSignatureHelpInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetSignatureHelpInputSchema.shape
};

const DESCRIPTION = `Get detailed function signature information including parameter types, descriptions, and current parameter context. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Generate correct function calls with precise parameter types and order
- Understand function overloads and choose the right signature for the context

**Parameter Examples:**
- Get function signature: uri: 'file:///api.ts', symbol: 'fetchUserData'
- Check method parameters: uri: 'file:///utils.js', symbol: 'processData'
- Precise location: uri: 'file:///app.ts', symbol: 'handleRequest', codeSnippet: 'await handleRequest('

**Return Format:**
Detailed signature information with parameter details and documentation

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- Uses smart text search to locate function calls
- codeSnippet helps precisely locate the function call when multiple occurrences exist
- Returns null if no signature help available at position
- May include multiple signatures for overloaded functions`;

export function registerGetSignatureHelp(server: McpServer) {
  server.registerTool("get_signature_help", {
    title: "Get Signature Help",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Signature Help",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, uri, symbol, codeSnippet }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getSignatureHelp", { uri, symbol, codeSnippet });
      
      // Check if result is null and provide helpful feedback
      if (result === null || result.signatureHelp === null) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ No signature help available for function "${symbol}" in ${uri}

💡 **Troubleshooting Tips:**
- Make sure the symbol name is a function or method name
- Try providing a codeSnippet that includes the opening parenthesis (e.g., 'functionName(')
- Make sure you're looking for a function call site, not just a function declaration
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running

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
      return formatToolCallError("Get Signature Help", error);
    }
  });
} 