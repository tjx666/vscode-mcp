import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetCommandsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { VscodeMcpToolName } from "../constants.js";
import { formatToolCallError } from "../utils/format-tool-call-error.js";
import { workspacePathInputSchema } from "../utils/workspace-schema.js";

const inputSchema = {
  ...workspacePathInputSchema,
  ...GetCommandsInputSchema.shape
};

const DESCRIPTION = `Get all available VSCode commands with pagination support.

**Use Cases:**
- Explore available VSCode commands
- Find commands matching a pattern
- Browse commands page by page

**Parameters:**
- filterInternal: Filter out internal commands starting with _ (default: true)
- pattern: Optional regex pattern to filter commands (e.g., "editor", "workbench")
- offset: Pagination offset (default: 0)
- limit: Number of commands per page, max 500 (default: 100)

**Returns:**
- commands: Array of command IDs for current page
- total: Total number of commands matching filter
- offset: Current offset
- limit: Current limit
- hasMore: Whether there are more commands
`;

export function registerGetCommands(server: McpServer) {
  server.registerTool(VscodeMcpToolName.GET_COMMANDS, {
    title: "Get Commands",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get Commands",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async ({ workspace_path, filterInternal, pattern, offset, limit }) => {
    try {
      const dispatcher = await createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getCommands", { filterInternal, pattern, offset, limit });

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      return formatToolCallError("Get Commands", error);
    }
  });
}
