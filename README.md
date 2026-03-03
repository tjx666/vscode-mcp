# VSCode MCP

<p align="center">
  <img src="packages/vscode-mcp-bridge/assets/logo.png" alt="VSCode MCP" width="200"/>
</p>

<p align="center">
  <strong>Connect VSCode with MCP (Model Context Protocol) for enhanced AI assistant capabilities</strong>
</p>

<p align="center">
  <a href="#design-motivation">Design Motivation</a> •
  <a href="#available-tools">Available Tools</a> •
  <a href="#installation">Installation</a> •
  <a href="#tool-filtering">Tool Filtering</a> •
  <a href="#extension-api">Extension API</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#license">License</a>
</p>

[![MCP Badge](https://lobehub.com/badge/mcp/tjx666-vscode-mcp)](https://lobehub.com/mcp/tjx666-vscode-mcp) ![CI](https://github.com/tjx666/vscode-mcp/actions/workflows/vscode-extension-ci.yml/badge.svg) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat)](http://makeapullrequest.com) [![Github Open Issues](https://img.shields.io/github/issues/tjx666/vscode-mcp)](https://github.com/tjx666/vscode-mcp/issues) [![LICENSE](https://img.shields.io/badge/license-Anti%20996-blue.svg?style=flat-square)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

## Overview

VSCode MCP is a comprehensive monorepo solution that enables MCP (Model Context Protocol) clients to access rich VSCode context information in real-time. This project bridges the gap between AI assistants and your development environment, providing accurate code analysis, diagnostics, and intelligent code navigation.

## Design Motivation

**VSCode MCP Bridge primarily serves AI IDEs (like Cursor) and AI coding agents**, helping them develop and analyze code more efficiently.

Traditional AI coding agents often need to execute time-consuming commands when validating code modifications:

- `tsc --noEmit` - TypeScript type checking
- `eslint .` - Code style checking
- `npm run build` - Project building

These commands run slowly in large projects, severely impacting AI development efficiency. VSCode MCP Bridge provides real-time LSP (Language Server Protocol) information, allowing AI agents to:

- **Get fast diagnostics** (`get-diagnostics`) - Replace time-consuming type checking and lint commands
- **Access comprehensive LSP information** (`get-symbol-lsp-info`) - Get definition, hover, signatures, and type info in one call
- **Navigate code efficiently** (`get-references`) - Understand code structure and dependencies with usage context
- **Safe file operations** - Rename symbols across files with automatic import updates

### Core Advantages

1. **Real-time**: Leverage VSCode's LSP for real-time code state without executing slow commands
2. **Accuracy**: Precise analysis based on language servers, more reliable than static analysis
3. **Efficiency**: Significantly reduce AI coding agent wait times
4. **Integration**: Deep integration with VSCode ecosystem, supporting multiple languages and extensions

## Available Tools

VSCode MCP provides the following tools through the MCP protocol:

| Tool                    | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| **execute_command**     | ⚠️ Execute VSCode commands with JSON string arguments            |
| **get_symbol_lsp_info** | Get comprehensive LSP info (definition, hover, signatures, etc.) |
| **get_diagnostics**     | Get real-time diagnostics, replace slow tsc/eslint               |
| **get_references**      | Find symbol references with usage context code                   |
| **health_check**        | Test connection to VSCode MCP Bridge extension                   |
| **list_workspaces**     | List all available VSCode workspaces                             |
| **open_files**          | Open multiple files with optional editor display                 |
| **rename_symbol**       | Rename symbols across all files in workspace                     |

> **⚠️ Security Warning**: The `execute_command` tool can execute arbitrary VSCode commands and potentially trigger dangerous operations. Use with extreme caution and only with trusted AI models.

## Installation

> **🚨 IMPORTANT**: Before installing the MCP server, you must first install the VSCode MCP Bridge extension in your VSCode instance. The extension is required for the MCP server to communicate with VSCode.

### Step 1: Install VSCode Extension

Install the VSCode MCP Bridge extension using ID: `YuTengjing.vscode-mcp-bridge`

[![Install VSCode Extension](https://img.shields.io/badge/VSCode%20Marketplace-Install%20Extension-007ACC?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge)

Or search for "VSCode MCP Bridge" in the VSCode Extensions marketplace.

### Step 2: Install MCP Server

#### Codex

Add the following configuration to your `~/.codex/config.toml`:

```toml
[mcp_servers.vscode-mcp]
command = "bunx"
args = ["-y", "@vscode-mcp/vscode-mcp-server@latest"]
env = { "VSCODE_MCP_DISABLED_TOOLS" = "health_check,list_workspaces,open_files" }
startup_timeout_ms = 16_000
```

#### Claude Code

Claude Code (claude.ai/code) provides built-in MCP support. Simply run:

```bash
claude mcp add vscode-mcp -- npx -y @vscode-mcp/vscode-mcp-server@latest
```

This command will automatically configure the MCP server in your Claude Code environment.

#### Cursor

##### Click the button to install

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=vscode-mcp&config=eyJjb21tYW5kIjoibnB4IEB2c2NvZGUtbWNwL3ZzY29kZS1tY3Atc2VydmVyQGxhdGVzdCJ9)

##### Or install manually

Go to `Cursor Settings` -> `Tools & Integrations` -> `New MCP Server`. Name to your liking, use `command` type with the command `npx @vscode-mcp/vscode-mcp-server@latest`. You can also verify config or add command line arguments via clicking `Edit`.

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": ["@vscode-mcp/vscode-mcp-server@latest --workspace-path", "${workspaceFolder}"]
    }
  }
}
```

#### Gemini CLI

Add the following configuration to your `~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": ["-y", "@vscode-mcp/vscode-mcp-server@latest"],
      "env": {},
      "includeTools": [
        "get_symbol_lsp_info",
        "get_diagnostics",
        "get_references",
        "health_check",
        "rename_symbol"
      ]
    }
  }
}
```

## Tool Filtering

You can control which tools are available using command-line arguments or environment variables:

**Command-line arguments:**

- `--enable-tools` - Comma-separated list of tools to enable (whitelist mode). If specified, only these tools will be available.
- `--disable-tools` - Comma-separated list of tools to disable (blacklist mode). Applied after `--enable-tools`.

**Environment variables:**

- `VSCODE_MCP_ENABLED_TOOLS` - Same as `--enable-tools`
- `VSCODE_MCP_DISABLED_TOOLS` - Same as `--disable-tools`

## Extension API

VSCode MCP Bridge provides a public API that other VSCode extensions can use to register their own tools into the MCP server. This makes it easy to expose any VSCode extension capability to MCP clients like Cursor.

### How It Works

When the MCP server starts with `--workspace-path`, it connects to that workspace's extension and discovers all dynamically registered tools. These tools then appear alongside the built-in tools in `tools/list`, so MCP clients can call them directly.

```
Other Extension → registerTool() → vscode-mcp-bridge → MCP Server → MCP Client
```

### Registering a Tool from Another Extension

In your extension's `activate()` function, get the VSCode MCP Bridge API and register your tools:

```typescript
import type { VscodeMcpBridgeAPI } from 'vscode-mcp-bridge';

export async function activate(context: vscode.ExtensionContext) {
  const bridgeExt = vscode.extensions.getExtension('YuTengjing.vscode-mcp-bridge');
  const api: VscodeMcpBridgeAPI | undefined = await bridgeExt?.activate();

  api?.registerTool({
    name: 'docker_list_containers',
    description: 'List all Docker containers in the current workspace',
    inputSchema: {
      type: 'object',
      properties: {
        all: { type: 'boolean', description: 'Include stopped containers' },
      },
    },
    handler: async (input) => {
      const all = input['all'] as boolean | undefined;
      // ... your implementation
      return { containers: [] };
    },
  });

  // Unregister when the extension is deactivated
  context.subscriptions.push({
    dispose: () => api?.unregisterTool('docker_list_containers'),
  });
}
```

The `inputSchema` field is a standard [JSON Schema](https://json-schema.org/) object — no dependency on Zod is required.

### Starting the MCP Server with a Bound Workspace

To expose extension-registered tools, start the MCP server with `--workspace-path`:

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": [
        "@vscode-mcp/vscode-mcp-server@latest",
        "--workspace-path",
        "${workspaceFolder}"
      ]
    }
  }
}
```

Or use the environment variable:

```bash
VSCODE_MCP_WORKSPACE_PATH=/path/to/workspace npx @vscode-mcp/vscode-mcp-server@latest
```

When the server starts, it queries the extension for all registered tools and makes them available to MCP clients. Tools registered by other extensions will appear naturally in `tools/list` alongside the built-in tools.

## Architecture

Once installed and configured, VSCode MCP works seamlessly with MCP-compatible clients:

1. **VSCode Extension**: Runs in your VSCode instance and provides access to LSP data
2. **MCP Server**: Translates MCP protocol calls to VSCode extension requests

All tools require the `workspace_path` parameter to target specific VSCode instances. Each VSCode workspace gets its own socket connection for multi-window support.

## License

This project is licensed under the [Anti 996](https://github.com/996icu/996.ICU/blob/master/LICENSE) License.
