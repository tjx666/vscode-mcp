# VSCode MCP

<p align="center">
  <img src="packages/vscode-mcp-bridge/assets/logo.png" alt="VSCode MCP" width="200"/>
</p>

<p align="center">
  <strong>Connect VSCode with MCP (Model Context Protocol) for enhanced AI assistant capabilities</strong>
</p>

<p align="center">
  <a href="#available-tools">Available Tools</a> •
  <a href="#installation">Installation</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#usage">Usage</a> •
  <a href="#development-status">Development Status</a> •
  <a href="#disclaimer">Disclaimer</a>
</p>

## Overview

VSCode MCP is a comprehensive monorepo solution that enables MCP (Model Context Protocol) clients to access rich VSCode context information in real-time. This project bridges the gap between AI assistants and your development environment, providing accurate code analysis, diagnostics, and intelligent code navigation.

## Available Tools

VSCode MCP provides the following tools through the MCP protocol:

| Tool                   | Description                                      | Parameters                                                                                   | Read-only | Notes                                |
| ---------------------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- | --------- | ------------------------------------ |
| **health_check**       | Test connection and get extension status         | None                                                                                         | ✅        | Check if VSCode extension is running |
| **get_diagnostics**    | Get diagnostic information with Git integration  | `uris` (array, empty = all git modified files)                                               | ✅        | Auto-detects modified files          |
| **get_definition**     | Get symbol definition locations                  | `uri`, `line`, `character`                                                                   | ✅        | Jump to symbol definitions           |
| **get_references**     | Get symbol reference locations                   | `uri`, `line`, `character`, `includeDeclaration?`                                            | ✅        | Find all symbol references           |
| **get_hovers**         | Get hover information for multiple positions     | `positions` (array), `includeAllHovers?`                                                     | ✅        | Batch hover information              |
| **get_signature_help** | Get function signature help                      | `uri`, `line`, `character`                                                                   | ✅        | Function parameter info              |
| **rename_symbol** ⚠️   | Rename symbols across all files in workspace     | `uri`, `line`, `character`, `newName`                                                        | ❌        | **Language-aware cross-file rename** |
| **request_input**      | Request simple text input from user              | `prompt`, `placeholder?`, `title?`, `password?`, `validateInput?`                            | ❌        | Interactive user input dialog        |
| **open_files**         | Open multiple files with optional editor display | `files` (array with `uri` and `showEditor?`)                                                 | ✅        | Background LSP processing            |
| **open_diff**          | Open diff editor to compare files or text        | `before?`, `after?`, `beforeText?`, `afterText?`, `beforeLabel?`, `afterLabel?`, `language?` | ✅        | Side-by-side comparison              |
| **execute_command** ⚠️ | Execute VSCode commands with arguments           | `command`, `args?`                                                                           | ❌        | **DANGEROUS - Use with caution**     |

> **⚠️ Security Warning**: The `execute_command` and `rename_symbol` tools can modify your workspace. The `execute_command` tool can execute arbitrary VSCode commands and potentially trigger dangerous operations. Use with extreme caution and only with trusted AI models.

All tools require the `workspace_path` parameter to target specific VSCode instances.

## Installation

> **🚨 IMPORTANT**: Before installing the MCP server, you must first install the VSCode MCP Bridge extension in your VSCode instance. The extension is required for the MCP server to communicate with VSCode.

### Step 1: Install VSCode Extension

Install the VSCode MCP Bridge extension using ID: `YuTengjing.vscode-mcp-bridge`

[![Install VSCode Extension](https://img.shields.io/badge/VSCode%20Marketplace-Install%20Extension-007ACC?style=for-the-badge&logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=YuTengjing.vscode-mcp-bridge)

Or search for "VSCode MCP Bridge" in the VSCode Extensions marketplace.

### Step 2: Install MCP Server

#### Install in Cursor ✅ Tested

##### Click the button to install

[![Install MCP Server](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/install-mcp?name=vscode-mcp&config=eyJjb21tYW5kIjoibnB4IHZzY29kZS1tY3Atc2VydmVyQGxhdGVzdCJ9)

##### Or install manually

Go to `Cursor Settings` -> `MCP` -> `Add new MCP Server`. Name to your liking, use `command` type with the command `npx vscode-mcp-server@latest`. You can also verify config or add command line arguments via clicking `Edit`.

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": ["vscode-mcp-server@latest"]
    }
  }
}
```

<details>
<summary><strong>Install in VS Code</strong></summary>

[Install in VS Code](https://insiders.vscode.dev/redirect?url=vscode%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522vscode-mcp%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522vscode-mcp-server%2540latest%2522%255D%257D)

[Install in VS Code Insiders](https://insiders.vscode.dev/redirect?url=vscode-insiders%3Amcp%2Finstall%3F%257B%2522name%2522%253A%2522vscode-mcp%2522%252C%2522command%2522%253A%2522npx%2522%252C%2522args%2522%253A%255B%2522vscode-mcp-server%2540latest%2522%255D%257D)

You can also install the VSCode MCP server using the VS Code CLI:

```bash
# For VS Code
code --add-mcp '{"name":"vscode-mcp","command":"npx","args":["vscode-mcp-server@latest"]}'
```

After installation, the VSCode MCP server will be available for use with your GitHub Copilot agent in VS Code.

</details>

<details>
<summary><strong>Install in Windsurf</strong></summary>

Follow Windsurf MCP [documentation](https://docs.windsurf.com/windsurf/cascade/mcp). Use following configuration:

```json
{
  "mcpServers": {
    "vscode-mcp": {
      "command": "npx",
      "args": ["vscode-mcp-server@latest"]
    }
  }
}
```

</details>

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

## Usage

### How It Works

Once installed and configured, VSCode MCP works seamlessly with MCP-compatible clients:

1. **VSCode Extension**: Runs in your VSCode instance and provides access to LSP data
2. **MCP Server**: Translates MCP protocol calls to VSCode extension requests
3. **Socket Communication**: Uses Unix sockets for fast, local-only communication
4. **AI Integration**: MCP clients can access real-time code context through standard tools

The system operates transparently - MCP clients use standard tool calls, and VSCode MCP handles all the complexity of communicating with VSCode's APIs.

### Prerequisites

- **Node.js 18+** (for running MCP server)
- **VSCode** with the VSCode MCP Bridge extension installed (see Step 1 above)
- **A workspace open in VSCode** (required for MCP server to connect)

### Configuration

All tools require the `workspace_path` parameter to target specific VSCode instances. Each VSCode workspace gets its own socket connection for multi-window support.

## Development Status

> **⚠️ EARLY DEVELOPMENT WARNING**
>
> This project is currently in **active development** and should be considered **experimental**. Key points:
>
> - **Pre-Alpha Stage**: Core functionality is being developed and tested
> - **Breaking Changes**: APIs and interfaces may change without notice
> - **Limited Testing**: Comprehensive test suite is not yet implemented
> - **Documentation**: Some features may be undocumented or examples may be incomplete
> - **Platform Support**: While designed for cross-platform use, testing has been limited
>
> **We welcome early adopters and contributors**, but please be aware that stability is not guaranteed at this stage.

### Current Implementation Status

- ✅ **Core Architecture**: Monorepo structure with IPC communication
- ✅ **Basic Tools**: Health check, diagnostics, code navigation
- ✅ **File Operations**: Opening files, diff comparison
- ✅ **Multi-Window Support**: Socket-based workspace targeting
- 🚧 **Testing**: Limited manual testing only
- 🚧 **Documentation**: Architecture documented, usage examples in progress
- 🚧 **Error Handling**: Basic error handling implemented
- ⏳ **Performance Optimization**: Not yet optimized for large codebases
- ⏳ **Configuration**: No configuration options currently supported

For detailed architecture information, see [Project Architecture](docs/project-architecture.md).

## Disclaimer

### Experimental Software Notice

This software is provided "as is" without any warranties, express or implied. By using VSCode MCP, you acknowledge and agree to the following:

### 🔒 Security Considerations

- This software creates local Unix socket connections for communication
- All communication is local-only and does not transmit data over the network
- Socket files are restricted to the current user, but no additional authentication is implemented
- **Use only in trusted development environments**

### 📋 Functionality Limitations

- **No Production Use**: This software is intended for development and testing purposes only
- **Data Safety**: While read-only operations are generally safe, always backup your work before using file manipulation features
- **Performance**: The software has not been optimized for large codebases or high-frequency operations
- **Compatibility**: VSCode API compatibility is not guaranteed across all versions

### 🛠️ Development Status

- **Alpha Software**: Features may be incomplete, unstable, or subject to significant changes
- **Limited Support**: Community support is provided on a best-effort basis
- **Breaking Changes**: APIs may change without deprecation notices during development

### 🔧 System Impact

- The software may create temporary files and socket connections
- Resource usage and cleanup behaviors are not fully optimized
- **Monitor system resources** when using with large workspaces

### 📞 Support and Liability

- **No Warranty**: The authors and contributors provide no warranty of any kind
- **No Liability**: Users assume all risks associated with using this software
- **Community Support**: Support is provided by the community through GitHub issues
- **Educational Purpose**: This software is primarily for learning and experimentation

### 🧪 Recommended Usage

- Use in isolated development environments
- Test thoroughly before relying on any functionality
- Keep backups of important work
- Monitor system resources and performance
- Report issues and contribute improvements

**By using this software, you acknowledge that you have read, understood, and agreed to these terms.**

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
