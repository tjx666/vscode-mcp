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
- Find all usage patterns and dependencies in complex codebases
- ALWAYS prefer this over codebase_search, grep_search when you already know the exact symbol position

**Parameter Examples:**
- Find function usage: uri: 'file:///utils.ts', line: 15, character: 10, includeDeclaration: true
- Check variable references: uri: 'file:///config.js', line: 8, character: 5
- Exclude declaration: includeDeclaration: false

**Return Format:**
Array of reference locations with file paths and exact positions

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- No need to position cursor at target location - just provide position parameters
- Line and character numbers are zero-based
- includeDeclaration: false excludes the symbol definition itself
- Returns empty array if no references found`;

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
  }, async ({ workspace_path, uri, line, character, includeDeclaration }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getReferences", { 
        uri, 
        line, 
        character, 
        includeDeclaration 
      });
      
      // Check if result is empty and provide helpful feedback
      if (Array.isArray(result) && result.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ No references found at ${uri}:${line}:${character}

💡 **Troubleshooting Tips:**
- Line and character numbers are **0-based** (first line is 0, first character is 0)
- Make sure the position(line, col) is exactly on a symbol (variable, function, class, etc.)
- Try setting includeDeclaration: true to include the symbol definition itself
- Verify the file URI is correct and the file exists
- Ensure the language server extension is installed and running (e.g., rust-lang.rust for Rust), and the file is properly parsed
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