import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetDefinitionInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetDefinitionInputSchema.shape
};

const DESCRIPTION = `Navigate to the definition of a symbol (variable, function, class, etc.) at a specific position.

**AI Coding Agent Use Cases:**
- Find where a symbol is declared/defined
- Understand the implementation of a function/class
- Navigate through code dependencies before making changes

**Parameter Examples:**
- Jump to function: uri: 'file:///path/to/file.ts', line: 10, character: 15
- Find class: uri: 'file:///component.tsx', line: 25, character: 8

**Return Format:**
Array of Location objects with file URI and exact position coordinates

**Important Notes:**
- Line and character numbers are zero-based
- Returns empty array if no definition found`;

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
  }, async ({ workspace_path, uri, line, character }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getDefinition", { uri, line, character });
      
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