import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetDefinitionInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetDefinitionInputSchema.shape
};

const DESCRIPTION = `Get definition location information for a symbol (variable, function, class, etc.) at a specific position. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**AI Coding Agent Use Cases:**
- Retrieve definition location data to understand where symbols are declared
- Get precise file paths and positions for symbols before code analysis
- Obtain LSP-based definition information for accurate code understanding
- Prefer this over codebase_search, grep_search when you already know the exact symbol position

**Parameter Examples:**
- Get function definition: uri: 'file:///path/to/file.ts', line: 10, character: 15
- Get class definition: uri: 'file:///component.tsx', line: 25, character: 8

**Return Format:**
Array of Location objects, each containing:
- uri: File path where the symbol is defined
- range: Exact position coordinates (line/character numbers)
- Returns empty array if no definition found

**Important Notes:**
- Files are automatically opened to ensure accurate LSP information
- No need to position cursor at target location - just provide position parameters
- Line and character numbers are zero-based
- Position must be exactly on a symbol (variable, function, class, etc.)
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
  }, async ({ workspace_path, uri, line, character }) => {
    try {
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getDefinition", { uri, line, character });
      
      // Check if result is empty and provide helpful feedback
      if (Array.isArray(result) && result.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: `❌ No definition found at ${uri}:${line}:${character}

💡 **Troubleshooting Tips:**
- Line and character numbers are **0-based** (first line is 0, first character is 0)
- Make sure the position(line, col) is exactly on a symbol (variable, function, class, etc.)
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
      return formatToolCallError("Get Definition", error);
    }
  });
} 