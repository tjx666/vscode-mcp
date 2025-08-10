# VSCode MCP Bridge

<div align="center">

[![Version](https://img.shields.io/visual-studio-marketplace/v/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items/YuTengjing.vscode-mcp-bridge/changelog) [![Installs](https://img.shields.io/visual-studio-marketplace/i/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge) [![Downloads](https://img.shields.io/visual-studio-marketplace/d/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge) [![Rating Star](https://img.shields.io/visual-studio-marketplace/stars/YuTengjing.vscode-mcp-bridge)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge&ssr=false#review-details) [![Last Updated](https://img.shields.io/visual-studio-marketplace/last-updated/YuTengjing.vscode-mcp-bridge)](https://github.com/tjx666/vscode-mcp)

</div>

check [VSCode MCP Repository](https://github.com/tjx666/vscode-mcp) for usage and more details.

## Commands & Keybindings

This extension provides several useful commands to enhance your development workflow:

### 📋 Copy Opened Files Path

**Command**: `VSCode MCP Bridge: Copy Opened Files Path`

Collects all currently opened file paths with dual output modes:
- **Copy to clipboard** (default): Copies paths for external use
- **Send to terminal**: Use `isSendToActiveTerminal: true` parameter to send directly to active terminal

Smart path handling:
- Uses relative paths when files are within workspace
- Falls back to absolute paths for files outside workspace  
- Automatically filters out non-file URIs (like untitled documents)
- Sorts paths alphabetically

### 📝 Temp Edit to Terminal

**Command**: `VSCode MCP Bridge: Temp Edit to Terminal`  
**Shortcut**: `Cmd+K Cmd+E`

Opens a temporary markdown file for quick editing. When you close the file:
- Content is automatically sent to the active terminal
- Temporary files are cleaned up automatically
- Empty content is ignored

Perfect for drafting commands, prompts, or quick notes to send to terminal.

### ⏱️ Sleep

**Command**: `VSCode MCP Bridge: Sleep`

Utility command that pauses execution for a specified duration (in seconds). Designed for use in VSCode shortcuts.json `runCommands` sequences to add delays between multiple commands.

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
