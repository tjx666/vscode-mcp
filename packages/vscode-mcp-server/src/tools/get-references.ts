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
- Find all usage patterns of a function or variable for comprehensive understanding
- Identify dependencies and relationships in complex codebases
- Locate unused code or find opportunities for refactoring and cleanup
- Understand how changes to APIs or interfaces will affect the entire codebase

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