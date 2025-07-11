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
- ALWAYS prefer this over codebase_search, grep_search when you already know the exact function call position

**Parameter Examples:**
- Get function signature: uri: 'file:///api.ts', line: 25, character: 15 (at function call position)
- Check method parameters: uri: 'file:///utils.js', line: 10, character: 8
- Analyze overloaded functions: uri: 'file:///types.ts', line: 30, character: 12

**Return Format:**
Detailed signature information with parameter details and documentation

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- No need to position cursor at target location - just provide position parameters
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
      
      // Check if result is null and provide helpful feedback
      if (result === null) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ No signature help available at ${uri}:${line}:${character}

💡 **Troubleshooting Tips:**
- Line and character numbers are **0-based** (first line is 0, first character is 0)
- Position should be within a function call or at the opening parenthesis
- Make sure you're at a function call site, not just on a function declaration
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running (e.g., rust-lang.rust for Rust), and the file is properly parsed

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