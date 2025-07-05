import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetSignatureHelpInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetSignatureHelpInputSchema.shape
};

const DESCRIPTION = `Get detailed function signature information including parameter types, descriptions, and current parameter context.

**AI Coding Agent Use Cases:**
- Generate correct function calls with proper parameter types
- Understand function overloads and parameter requirements
- Provide contextual assistance for function parameter completion
- Verify function usage patterns during code generation

**Parameter Examples:**
- Get function signature: uri: 'file:///api.ts', line: 25, character: 15 (at function call position)
- Check method parameters: uri: 'file:///utils.js', line: 10, character: 8
- Analyze overloaded functions: uri: 'file:///types.ts', line: 30, character: 12

**Return Format:**
Detailed signature information with parameter details and documentation

**AI Coding Agent Benefits:**
- Generate type-safe function calls
- Understand complex function signatures and overloads
- Provide accurate parameter suggestions
- Reduce function call errors in generated code

**Important Notes:**
- Line and character numbers are zero-based
- Position should be within a function call or at opening parenthesis
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
  }, async ({ workspace_path, uri, line, character }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getSignatureHelp", { uri, line, character });
      
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