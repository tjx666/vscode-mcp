import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetCompletionsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...GetCompletionsInputSchema.shape
};

const DESCRIPTION = `Get code completions at a specific position in a file.

**Use Cases:**
- Get autocomplete suggestions at cursor position
- Discover available methods/properties after typing '.'
- Find function parameters after typing '('
- Explore available imports

**Parameters:**
- filePath: File path (absolute or relative to workspace root)
- line: Line number (0-indexed)
- character: Character position (0-indexed)
- triggerCharacter: Optional trigger character (e.g., '.', '(', '<')
- offset: Pagination offset (default: 0)
- limit: Number of items per page, max 100 (default: 50)

**Returns:**
- items: Array of completion items with label, kind, detail, documentation, insertText
- total: Total number of completions available
- offset: Current offset
- limit: Current limit
- hasMore: Whether there are more items
- isIncomplete: Whether completions are incomplete (language server may have more)
`;

export function registerGetCompletions(server: McpServer) {
  server.registerTool(VscodeMcpToolName.GET_COMPLETIONS, {
    title: "Get Completions",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Completions",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, filePath, line, character, triggerCharacter, offset, limit }) => {
    try {
      const dispatcher = await createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getCompletions", {
        filePath,
        line,
        character,
        triggerCharacter,
        offset,
        limit
      });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Get Completions", error);
    }
  });
}
