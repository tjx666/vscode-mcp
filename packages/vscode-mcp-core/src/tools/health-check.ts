import { createDispatcher, HealthCheckInputSchema } from '@vscode-mcp/vscode-mcp-ipc';

import type { ToolDefinition } from '../types.js';

const DESCRIPTION = `Test connection to VSCode MCP Bridge extension. Troubleshoot when other VSCode MCP tools return connection errors or timeouts`;

const ERROR_TIPS = `💡 Tips:
  1. Check if the "VSCode MCP Bridge" extension is installed and activated: https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge
  2. Check the "VSCode MCP Bridge" extension log in VSCode Output panel → "VSCode MCP Bridge"
      `;

/**
 * Health check tool is parameterized by `clientVersion` (the version of the
 * surrounding MCP server or CLI), used for version-mismatch warnings against
 * the bridge extension. Other tools are static singletons.
 */
export function createHealthCheckTool(clientVersion: string): ToolDefinition<typeof HealthCheckInputSchema> {
  return {
    name: 'health_check',
    cliName: 'health-check',
    title: 'Health Check',
    description: DESCRIPTION,
    schema: HealthCheckInputSchema,
    requiresWorkspace: true,
    errorTips: ERROR_TIPS,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
    async handler(_params, { workspacePath }) {
      const dispatcher = await createDispatcher(workspacePath);
      const result = await dispatcher.dispatch('health', {});

      const versionMatch = result.extension_version === clientVersion;
      const statusIcon = result.status === 'ok' ? '✅' : '❌';
      const versionIcon = versionMatch ? '✅' : '⚠️';

      let statusMessage = `${statusIcon} Health Check Result:\n`;
      statusMessage += `  • Status: ${result.status}\n`;
      statusMessage += `  • Extension Version: ${result.extension_version}\n`;
      statusMessage += `  • Server Version: ${clientVersion}\n`;
      statusMessage += `  • ${versionIcon} Version Match: ${versionMatch ? 'Yes' : 'No'}\n`;
      statusMessage += `  • Workspace: ${result.workspace || 'None'}\n`;
      statusMessage += `  • Timestamp: ${result.timestamp}\n`;

      if (result.system_info) {
        statusMessage += `  • Platform: ${result.system_info.platform}\n`;
        statusMessage += `  • Node.js: ${result.system_info.node_version}\n`;
        if (result.system_info.vscode_version) {
          statusMessage += `  • VSCode: ${result.system_info.vscode_version}\n`;
        }
        if (result.system_info.ide_type) {
          statusMessage += `  • IDE Type: ${result.system_info.ide_type}\n`;
        }
      }

      if (result.error) {
        statusMessage += `  • Error: ${result.error}\n`;
      }

      if (!versionMatch) {
        statusMessage += `\n⚠️  Warning: Version mismatch detected!\n`;
        statusMessage += `   This may cause compatibility issues. Please update both components to the same version:\n\n`;
        statusMessage += `   📦 Update MCP Server:\n`;
        statusMessage += `   npx @vscode-mcp/vscode-mcp-server@latest --version\n\n`;
        statusMessage += `   🔌 Update VSCode Extension:\n`;
        statusMessage += `   Please update the "VSCode MCP Bridge" extension (YuTengjing.vscode-mcp-bridge) to the latest version in VSCode Extensions marketplace\n\n`;
        statusMessage += `   🔄 Important: After updating both components, please restart your editor to ensure the changes take effect.`;
      }

      return statusMessage;
    },
  };
}
