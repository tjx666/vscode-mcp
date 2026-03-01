# VSCode MCP Bridge

<div align="center">

[![Version](https://img.shields.io/visual-studio-marketplace/v/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items/YuTengjing.vscode-mcp-bridge/changelog) [![Installs](https://img.shields.io/visual-studio-marketplace/i/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge) [![Downloads](https://img.shields.io/visual-studio-marketplace/d/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge) [![Rating Star](https://img.shields.io/visual-studio-marketplace/stars/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge&ssr=false#review-details) [![Last Updated](https://img.shields.io/visual-studio-marketplace/last-updated/YuTengjing.vscode-mcp-bridge)](https://github.com/tjx666/vscode-mcp)

</div>

check [VSCode MCP Repository](https://github.com/tjx666/vscode-mcp) for usage and more details.

## Commands & Keybindings

This extension provides several useful commands to enhance your development workflow:

### 📋 Copy Opened Files Path

**Command**: `VSCode MCP Bridge: Copy Opened Files Path`

use shortcut `alt+cmd+o` to send all opened files path to active terminal.

### ⏱️ Sleep

**Command**: `VSCode MCP Bridge: Sleep`

Utility command that pauses execution for a specified duration (in seconds). Designed for use in VSCode shortcuts.json `runCommands` sequences to add delays between multiple commands.

## Extension API

Other VSCode extensions can register custom tools that become accessible via the MCP server. Acquire the API through the standard VSCode extension API:

```typescript
const ext = vscode.extensions.getExtension<VscodeMcpBridgeAPI>('yutengjing.vscode-mcp-bridge');
const api = await ext?.activate();

api?.registerTool({
    name: 'my_tool',
    description: 'Description of what the tool does',
    inputSchema: {
        type: 'object',
        properties: {
            param: { type: 'string', description: 'A parameter' },
        },
        required: ['param'],
    },
    handler: async (input) => {
        return { result: `processed: ${input.param}` };
    },
});

// Unregister when no longer needed
api?.unregisterTool('my_tool');
```

Registered tools are exposed via the `list_extension_tools` and `call_extension_tool` MCP tools.

## My extensions

- [Open in External App](https://github.com/tjx666/open-in-external-app)
- [VSCode archive](https://github.com/tjx666/vscode-archive)
- [Neo File Utils](https://github.com/tjx666/vscode-neo-file-utils)
- [VSCode FE Helper](https://github.com/tjx666/vscode-fe-helper)
- [Modify File Warning](https://github.com/tjx666/modify-file-warning)
- [Power Edit](https://github.com/tjx666/power-edit)
- [Adobe Extension Development Tools](https://github.com/tjx666/vscode-adobe-extension-devtools)
- [Scripting Listener](https://github.com/tjx666/scripting-listener)

Check all here: [publishers/YuTengjing](https://marketplace.visualstudio.com/publishers/YuTengjing)
