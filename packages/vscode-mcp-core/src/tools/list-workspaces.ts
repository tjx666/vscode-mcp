import { ListWorkspacesInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';
import { discoverAvailableWorkspaces } from '../utils/workspace-discovery.js';

const DESCRIPTION = `List all available VSCode workspaces that can be connected to use vscode mcp tools

**Return Format:**
Array of workspace objects with paths, names, status, and optional details.
Includes summary statistics about discovered workspaces.

**Important Notes:**
- **Active status** means successfully connected and verified
- **Available status** means socket exists but not tested`;

const NO_WORKSPACES_HELP = `🔍 No VSCode workspaces currently available.

This could mean:
1. No VSCode/Cursor/Windsurf instances are running
2. VSCode MCP Bridge extension is not installed or activated
3. All VSCode instances were recently closed (sockets cleaned up)

💡 To make workspaces available:
1. Open VSCode/Cursor/Windsurf with a project
2. Ensure VSCode MCP Bridge extension is installed: https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge
3. Check the extension is activated (see Output panel → "VSCode MCP Bridge")
4. Try running this command again`;

export const listWorkspacesTool: ToolDefinition<typeof ListWorkspacesInputSchema> = {
  name: 'list_workspaces',
  cliName: 'list-workspaces',
  title: 'List Available Workspaces',
  description: DESCRIPTION,
  schema: ListWorkspacesInputSchema,
  requiresWorkspace: false,
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: false, // May clean zombie sockets
    openWorldHint: false,
  },
  async handler() {
    try {
      const result = await discoverAvailableWorkspaces({
        cleanZombieSockets: true,
        includeDetails: true,
        testConnection: true,
      });

      const { workspaces, hasLegacyWorkspaces } = result;

      const activeCount = workspaces.filter((w) => w.status === 'active').length;
      const availableCount = workspaces.filter((w) => w.status === 'available').length;

      const summary = {
        total: workspaces.length,
        active: activeCount,
        available: availableCount,
        cleaned: 0,
      };

      let response = '🔍 Available VSCode Workspaces:\n\n';

      if (workspaces.length === 0) {
        response += 'No active VSCode workspaces found.\n\n';
        response += '💡 Tips:\n';
        response += '- Make sure VSCode/Cursor/Windsurf is running\n';
        response += '- Ensure VSCode MCP Bridge extension is installed and activated\n';
        response += '- Check the extension output panel for any errors\n';
      } else {
        const activeWorkspaces = workspaces.filter((w) => w.status === 'active');
        const availableWorkspaces = workspaces.filter((w) => w.status === 'available');
        const errorWorkspaces = workspaces.filter((w) => w.status === 'error');

        if (activeWorkspaces.length > 0) {
          response += '✅ Active Workspaces:\n';
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
              workspace.folders.forEach((folder) => {
                response += `      - ${folder}\n`;
              });
            }
            if (workspace.extension_version) {
              response += `   🔌 Extension: v${workspace.extension_version}\n`;
            }
            if (workspace.vscode_version) {
              response += `   💻 VSCode: v${workspace.vscode_version}\n`;
            }
            if (workspace.socket_path) {
              response += `   🔧 Socket: ${workspace.socket_path}\n`;
            }
          });
        }

        if (availableWorkspaces.length > 0) {
          response += '\n📋 Available (not tested):\n';
          availableWorkspaces.forEach((workspace, index) => {
            response += `\n${activeWorkspaces.length + index + 1}. ${workspace.workspace_path}\n`;
            if (workspace.socket_path) {
              response += `   🔧 Socket: ${workspace.socket_path}\n`;
            }
          });
        }

        if (errorWorkspaces.length > 0) {
          response += '\n❌ Workspaces with errors:\n';
          errorWorkspaces.forEach((workspace) => {
            response += `\n- ${workspace.workspace_path}\n`;
            if (workspace.error) {
              response += `  Error: ${workspace.error}\n`;
            }
          });
        }
      }

      response += `\n📊 Summary:\n`;
      response += `- Total workspaces: ${summary.total}\n`;
      response += `- Active: ${summary.active}\n`;
      if (summary.available > 0) {
        response += `- Available (untested): ${summary.available}\n`;
      }
      if (summary.cleaned > 0) {
        response += `- Zombie sockets cleaned: ${summary.cleaned}\n`;
      }

      if (hasLegacyWorkspaces) {
        response += `\n⚠️  Legacy Socket Paths Detected:\n`;
        response += `   These workspaces are using the old socket path format.\n`;
        response += `   Please upgrade your VSCode MCP Bridge extension to the latest version:\n`;
        response += `   Extension: YuTengjing.vscode-mcp-bridge\n`;
        response += `   Marketplace: https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge\n`;
      }

      if (workspaces.length > 0) {
        response += `\n💡 To use a workspace with other MCP tools, copy the workspace_path parameter from above.`;
      }

      return response;
    } catch (error) {
      if (error instanceof Error && error.message.includes('connect')) {
        return NO_WORKSPACES_HELP;
      }
      throw error;
    }
  },
};
