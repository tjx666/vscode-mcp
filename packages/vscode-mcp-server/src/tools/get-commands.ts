import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createDispatcher, GetCommandsInputSchema } from "@vscode-mcp/vscode-mcp-ipc";
import { z } from "zod";

import { formatToolCallError } from "./utils.js";

const inputSchema = {
  workspace_path: z.string().describe("VSCode workspace path to target"),
  ...GetCommandsInputSchema.shape
};

const DESCRIPTION = `Get all available VSCode commands in the current workspace. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**Use Cases:**
- Discover available commands for automation and scripting
- Debug command availability issues in different VSCode environments
- Build command-based workflows and integrations
- Find commands by category or keyword for specific functionality
- Analyze command coverage across different extensions

**Parameter Examples:**
- Get all public commands: include_internal: false
- Search for editor commands: filter: "editor", category: "editor"
- Limit results: limit: 50
- Find TypeScript commands: filter: "typescript"

**Return Format:**
- **commands**: Array of command objects with id and category
- **total**: Number of commands returned
- **total_available**: Total commands available before filtering
- **categories**: Command count statistics by category
- **filtered**: Whether results were filtered

**Important Notes:**
- VSCode typically has 1000+ commands available
- Use filters to reduce result size for better performance
- Internal commands are excluded by default for cleaner results
- Categories are automatically extracted from command prefixes
`;

export function registerGetCommands(server: McpServer) {
  server.registerTool("get_commands", {
    title: "Get VSCode Commands",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "Get VSCode Commands",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
  }, async (request) => {
    try {
      const { workspace_path, include_internal, filter, category, limit } = request;
      const dispatcher = createDispatcher(workspace_path);
      const result = await dispatcher.dispatch("getCommands", { 
        include_internal, 
        filter, 
        category, 
        limit 
      });
      
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