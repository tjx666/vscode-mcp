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
- **Call IDE AI agents** (`call-agent`) - Integrate with built-in AI assistants like Cursor Composer, GitHub Copilot, and others

### Core Advantages

1. **Real-time**: Leverage VSCode's LSP for real-time code state without executing slow commands
2. **Accuracy**: Precise analysis based on language servers, more reliable than static analysis
3. **Efficiency**: Significantly reduce AI coding agent wait times
4. **Integration**: Deep integration with VSCode ecosystem, supporting multiple languages and extensions
5. **AI Collaboration**: Enable AI agents to work together by calling IDE-native AI assistants (Cursor Composer, GitHub Copilot, etc.)

## Available Tools

VSCode MCP provides the following tools through the MCP protocol:

| Tool                    | Description                                                      |
| ----------------------- | ---------------------------------------------------------------- |
| **call_agent**          | Call IDE's AI agent with prompts and context                     |
| **execute_command**     | ⚠️ Execute VSCode commands with JSON string arguments            |
| **get_symbol_lsp_info** | Get comprehensive LSP info (definition, hover, signatures, etc.) |
| **get_diagnostics**     | Get real-time diagnostics, replace slow tsc/eslint               |
| **get_references**      | Find symbol references with usage context code                   |
| **health_check**        | Test connection to VSCode MCP Bridge extension                   |
| **list_workspaces**     | List all available VSCode workspaces                             |
| **open_files**          | Open multiple files with optional editor display                 |
| **rename_symbol**       | ⚠️ Rename symbols across all files in workspace                  |

> **⚠️ Security Warning**: The `execute_command` tool can execute arbitrary VSCode commands and potentially trigger dangerous operations. Use with extreme caution and only with trusted AI models.

### AI Agent Integration

The `call_agent` tool enables seamless integration between external AI assistants and IDE-native AI agents. This creates a powerful collaborative AI ecosystem where different AI agents can work together on complex coding tasks.

**Supported IDEs:**

- **Cursor**: Integrates with Cursor Composer for advanced code generation
- **VSCode**: Supports GitHub Copilot, Cline, Continue, and other popular extensions
- **Windsurf**: Integrates with Windsurf's native AI capabilities

**Supported AI Agents:**

- **Cursor Composer**: Advanced code generation and refactoring
- **GitHub Copilot**: Code completion and chat assistance
- **Cline**: Interactive coding assistant with file management
- **Continue**: Open-source coding assistant

**Key Features:**

- **Auto-detection**: Automatically detects your IDE and available AI extensions
- **Flexible Input**: Supports text prompts, file attachments, and image inputs
- **Smart Routing**: Chooses the best available AI agent based on capability and priority
- **Cross-platform**: Works across different operating systems and IDE configurations

All tools require the `workspace_path` parameter to target specific VSCode instances.

## Installation

> **🚨 IMPORTANT**: Before installing the MCP server, you must first install the VSCode MCP Bridge extension in your VSCode instance. The extension is required for the MCP server to communicate with VSCode.

### Step 1: Install VSCode Extension

Install the VSCode MCP Bridge extension using ID: `YuTengjing.vscode-mcp-bridge`

[![Install VSCode Extension](https://img.shields.io/badge/VSCode%20Marketplace-Install%20Extension-007ACC?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge)

Or search for "VSCode MCP Bridge" in the VSCode Extensions marketplace.

### Step 2: Install MCP Server

#### Claude Code

Claude Code (claude.ai/code) provides built-in MCP support. Simply run:

```bash
claude mcp add vscode-mcp -- npx -y @vscode-mcp/vscode-mcp-server@latest
```

This command will automatically configure the MCP server in your Claude Code environment.

#### Cursor

##### ⚠️ Gemini 2.5 Pro Compatibility Note

The `execute_command` tool is currently not compatible with Gemini 2.5 Pro in Cursor due to potential security restrictions. If you plan to use Gemini 2.5 Pro, it is **highly recommended** to disable this tool to prevent any issues.

You can disable it by adding a command-line argument to the MCP server configuration in Cursor's settings.

1. Go to `Cursor Settings` -> `Tools & Integrations`.
2. Find your `vscode-mcp` server configuration and click `Edit`.
3. In the `args` array, add the following argument: `"--disable-tools=execute_command"`
4. Your final config should look similar to this:

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": ["@vscode-mcp/vscode-mcp-server@latest", "--disable-tools=execute_command"]
    }
  }
}
```

This will prevent the `execute_command` tool from being registered with the server, ensuring compatibility with Gemini 2.5 Pro.

##### Click the button to install

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=vscode-mcp&config=eyJjb21tYW5kIjoibnB4IEB2c2NvZGUtbWNwL3ZzY29kZS1tY3Atc2VydmVyQGxhdGVzdCJ9)

##### Or install manually

Go to `Cursor Settings` -> `Tools & Integrations` -> `New MCP Server`. Name to your liking, use `command` type with the command `npx @vscode-mcp/vscode-mcp-server@latest`. You can also verify config or add command line arguments via clicking `Edit`.

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": ["@vscode-mcp/vscode-mcp-server@latest"]
    }
  }
}
```

## Architecture

VSCode MCP follows a modular architecture with three main components communicating through Unix sockets:

```mermaid
graph TB
    subgraph "MCP Client"
        Client[AI Assistant<br/>Cursor/Claude/etc]
    end

    subgraph "vscode-mcp-server"
        Server[MCP Server<br/>Protocol Implementation]
    end

    subgraph "vscode-mcp-ipc"
        IPC[IPC Layer<br/>Type-safe Communication]
        Socket[Unix Socket<br/>Cross-platform]
    end

    subgraph "VSCode Instance"
        Extension[VSCode Extension<br/>vscode-mcp-bridge]
        LSP[Language Server Protocol]
        API[VSCode API]
    end

    Client <-->|JSON-RPC<br/>stdio| Server
    Server <-->|TypeScript<br/>Function Calls| IPC
    IPC <-->|JSON<br/>Unix Socket| Socket
    Socket <-->|Local Connection| Extension
    Extension <-->|Extension API| API
    Extension <-->|Diagnostics<br/>Navigation| LSP

    classDef client fill:#e1f5fe
    classDef server fill:#f3e5f5
    classDef ipc fill:#e8f5e8
    classDef vscode fill:#fff3e0

    class Client client
    class Server server
    class IPC,Socket ipc
    class Extension,LSP,API vscode
```

### Communication Flow

1. **MCP Client** sends requests via JSON-RPC over stdio
2. **MCP Server** translates requests to TypeScript function calls
3. **IPC Layer** handles type-safe communication and validation
4. **Unix Socket** provides fast, local-only communication
5. **VSCode Extension** executes operations using VSCode APIs
6. **LSP Integration** provides real-time code analysis and navigation

### Multi-Workspace Support

Each VSCode workspace gets its own socket connection:

- `/Users/user/frontend` → `/tmp/vscode-mcp-a1b2c3d4.sock`
- `/Users/user/backend` → `/tmp/vscode-mcp-e5f6g7h8.sock`

### How It Works

Once installed and configured, VSCode MCP works seamlessly with MCP-compatible clients:

1. **VSCode Extension**: Runs in your VSCode instance and provides access to LSP data
2. **MCP Server**: Translates MCP protocol calls to VSCode extension requests
3. **Socket Communication**: Uses Unix sockets for fast, local-only communication
4. **AI Integration**: MCP clients can access real-time code context through standard tools

The system operates transparently - MCP clients use standard tool calls, and VSCode MCP handles all the complexity of communicating with VSCode's APIs.

All tools require the `workspace_path` parameter to target specific VSCode instances. Each VSCode workspace gets its own socket connection for multi-window support.

## License

This project is licensed under the [Anti 996](https://github.com/996icu/996.ICU/blob/master/LICENSE) License.
