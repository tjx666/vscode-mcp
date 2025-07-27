import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ListWorkspacesInputSchema } from "@vscode-mcp/vscode-mcp-ipc";

import { discoverAvailableWorkspaces } from "../utils/workspace-discovery.js";
import { formatToolCallError } from "./utils.js";

// MCP tools don't have workspace_path parameter for list_workspaces
// since it discovers all workspaces
const inputSchema = ListWorkspacesInputSchema.shape;

const DESCRIPTION = `List all available VSCode workspaces that can be connected via MCP tools. Works with all VSCode-based editors (VSCode, Cursor, Windsurf, etc.).

**Core Function:**
Discovers and lists all VSCode workspaces that have the MCP Bridge extension active, helping clients choose the correct workspace_path parameter.

**AI Coding Agent Use Cases:**
- Show users available workspaces in multi-project environments
- Help users identify the correct workspace_path for other MCP tools
- Clean up stale socket files from closed VSCode instances
- Verify which workspaces have active MCP Bridge connections

**Parameter Examples:**
- Basic listing: {} (uses all defaults)
- Detailed info: include_details: true
- Discovery only: clean_zombie_sockets: false, test_connection: false
- Quick list: test_connection: false

**Return Format:**
Array of workspace objects with paths, names, status, and optional details.
Includes summary statistics about discovered workspaces.

**Important Notes:**
- Workspace paths are hashed to generate socket names
- Only shows workspaces where MCP Bridge extension is activated
- Active status means successfully connected and verified
- Available status means socket exists but not tested
- Automatically cleans up zombie sockets by default`;

export function registerListWorkspaces(server: McpServer) {
  server.registerTool("list_workspaces", {
    title: "List Available Workspaces",
    description: DESCRIPTION,
    inputSchema,
    annotations: {
      title: "List Available Workspaces",
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // May clean zombie sockets
      openWorldHint: false
    }
  }, async (params) => {
    try {
      // Directly call the discovery function
      const result = await discoverAvailableWorkspaces({
        cleanZombieSockets: params.clean_zombie_sockets,
        includeDetails: params.include_details,
        testConnection: params.test_connection
      });
      
      const workspaces = result.workspaces;
      const hasLegacyWorkspaces = result.hasLegacyWorkspaces;
      
      // Calculate summary statistics
      const activeCount = workspaces.filter(w => w.status === 'active').length;
      const availableCount = workspaces.filter(w => w.status === 'available').length;
      
      const summary = {
        total: workspaces.length,
        active: activeCount,
        available: availableCount,
        cleaned: 0 // We can't track exact cleaned count from the current implementation
      };
      
      // Format the response for display
      let response = "🔍 Available VSCode Workspaces:\n\n";
      
      if (workspaces.length === 0) {
        response += "No active VSCode workspaces found.\n\n";
        response += "💡 Tips:\n";
        response += "- Make sure VSCode/Cursor/Windsurf is running\n";
        response += "- Ensure VSCode MCP Bridge extension is installed and activated\n";
        response += "- Check the extension output panel for any errors\n";
      } else {
        // Group workspaces by status
        const activeWorkspaces = workspaces.filter(w => w.status === 'active');
        const availableWorkspaces = workspaces.filter(w => w.status === 'available');
        const errorWorkspaces = workspaces.filter(w => w.status === 'error');
        
        // Show active workspaces first
        if (activeWorkspaces.length > 0) {
          response += "✅ Active Workspaces:\n";
          activeWorkspaces.forEach((workspace, index) => {
            response += `\n${index + 1}. ${workspace.workspace_path}\n`;
            if (workspace.workspace_name) {
              response += `   📁 Name: ${workspace.workspace_name}\n`;
            }
            if (workspace.workspace_type) {
              response += `   📦 Type: ${workspace.workspace_type}\n`;
            }
            if (workspace.folders && workspace.folders.length > 1) {
              response += `   📂 Folders:\n`;
              workspace.folders.forEach(folder => {
                response += `      - ${folder}\n`;
              });
            }
            if (workspace.extension_version) {
              response += `   🔌 Extension: v${workspace.extension_version}\n`;
            }
            if (workspace.vscode_version) {
              response += `   💻 VSCode: v${workspace.vscode_version}\n`;
            }
            if (params.include_details && workspace.socket_path) {
              response += `   🔧 Socket: ${workspace.socket_path}\n`;
            }
          });
        }
        
        // Show available but untested workspaces
        if (availableWorkspaces.length > 0) {
          response += "\n📋 Available (not tested):\n";
          availableWorkspaces.forEach((workspace, index) => {
            response += `\n${activeWorkspaces.length + index + 1}. ${workspace.workspace_path}\n`;
            if (params.include_details && workspace.socket_path) {
              response += `   🔧 Socket: ${workspace.socket_path}\n`;
            }
          });
        }
        
        // Show error workspaces
        if (errorWorkspaces.length > 0) {
          response += "\n❌ Workspaces with errors:\n";
          errorWorkspaces.forEach(workspace => {
            response += `\n- ${workspace.workspace_path}\n`;
            if (workspace.error) {
              response += `  Error: ${workspace.error}\n`;
            }
          });
        }
      }
      
      // Add summary
      response += `\n📊 Summary:\n`;
      response += `- Total workspaces: ${summary.total}\n`;
      response += `- Active: ${summary.active}\n`;
      if (summary.available > 0) {
        response += `- Available (untested): ${summary.available}\n`;
      }
      if (summary.cleaned > 0) {
        response += `- Zombie sockets cleaned: ${summary.cleaned}\n`;
      }
      
      // Add legacy workspace warning
      if (hasLegacyWorkspaces) {
        response += `\n⚠️  Legacy Socket Paths Detected:\n`;
        response += `   These workspaces are using the old socket path format.\n`;
        response += `   Please upgrade your VSCode MCP Bridge extension to the latest version:\n`;
        response += `   Extension: YuTengjing.vscode-mcp-bridge\n`;
        response += `   Marketplace: https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge\n`;
      }
      
      // Add usage hint
      if (workspaces.length > 0) {
        response += `\n💡 To use a workspace with other MCP tools, copy the workspace_path parameter from above.`;
      }
      
      return {
        content: [{
          type: "text",
          text: response
        }]
      };
    } catch (error) {
      // Check if it's a connection error
      if (error instanceof Error && error.message.includes('connect')) {
        // Special handling for no workspaces available
        return {
          content: [{
            type: "text",
            text: `🔍 No VSCode workspaces currently available.

This could mean:
1. No VSCode/Cursor/Windsurf instances are running
2. VSCode MCP Bridge extension is not installed or activated
3. All VSCode instances were recently closed (sockets cleaned up)

💡 To make workspaces available:
1. Open VSCode/Cursor/Windsurf with a project
2. Ensure VSCode MCP Bridge extension is installed: https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge
3. Check the extension is activated (see Output panel → "VSCode MCP Bridge")
4. Try running this command again`
          }]
        };
      }
      
      return formatToolCallError("List Workspaces", error);
    }
  });
}