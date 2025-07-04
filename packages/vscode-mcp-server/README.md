# @vscode-mcp/vscode-mcp-server

A Model Context Protocol (MCP) server that provides access to VSCode workspace information through Unix Socket communication.

## Features

- **Real-time Diagnostics**: Get errors, warnings, and hints from VSCode's Language Server
- **Symbol Navigation**: Find definitions, references, and hover information
- **Signature Help**: Get function signature information
- **Multi-workspace Support**: Target different VSCode workspaces simultaneously
- **Type-safe Communication**: Full TypeScript support with the VSCode extension

## Installation

```bash
npm install @vscode-mcp/vscode-mcp-server
```

## Usage

### As a Binary

```bash
# Start the MCP server
npx vscode-mcp-server

# Or install globally
npm install -g @vscode-mcp/vscode-mcp-server
vscode-mcp-server
```

### With MCP Client

Configure your MCP client to use this server:

```json
{
  "servers": {
    "vscode": {
      "command": "npx",
      "args": ["@vscode-mcp/vscode-mcp-server"]
    }
  }
}
```

## Available Tools

All tools require a `workspace_path` parameter to target the correct VSCode instance.

### `health_check`

Check if the VSCode extension is running and healthy.

**Parameters:**

- `workspace_path` (string): VSCode workspace path

**Example:**

```json
{
  "name": "health_check",
  "arguments": {
    "workspace_path": "/path/to/your/project"
  }
}
```

### `get_diagnostics`

Get diagnostic information (errors, warnings, hints) for a file.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `uri` (string): File URI (e.g., "file:///path/to/file.ts")

### `get_definition`

Get definition locations for a symbol at a specific position.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `uri` (string): File URI
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)

### `get_references`

Get reference locations for a symbol at a specific position.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `uri` (string): File URI
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)
- `include_declaration` (boolean, optional): Whether to include declaration (default: true)

### `get_hover`

Get hover information for a symbol at a specific position.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `uri` (string): File URI
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)

### `get_signature_help`

Get signature help for a function call at a specific position.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `uri` (string): File URI
- `line` (number): Line number (0-based)
- `character` (number): Character position (0-based)

### `get_workspace_info`

Get workspace information including folders and settings.

**Parameters:**

- `workspace_path` (string): VSCode workspace path

### `get_workspace_symbols`

Search for symbols in the workspace.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `query` (string): Search query for symbols

### `execute_command`

Execute a VSCode command.

**Parameters:**

- `workspace_path` (string): VSCode workspace path
- `command` (string): VSCode command to execute (e.g., 'vscode.open', 'editor.action.formatDocument')
- `args` (array, optional): Arguments to pass to the command

**Examples:**

```json
{
  "name": "execute_command",
  "arguments": {
    "workspace_path": "/path/to/your/project",
    "command": "editor.action.formatDocument"
  }
}
```

```json
{
  "name": "execute_command",
  "arguments": {
    "workspace_path": "/path/to/your/project",
    "command": "vscode.open",
    "args": ["file:///path/to/file.ts"]
  }
}
```

**Common VSCode Commands:**

- `editor.action.formatDocument` - Format the current document
- `editor.action.organizeImports` - Organize imports
- `vscode.open` - Open a file (requires file URI argument)
- `workbench.action.files.save` - Save current file
- `workbench.action.reloadWindow` - Reload VSCode window
- `workbench.action.closeActiveEditor` - Close active editor

## Prerequisites

This MCP server requires the VSCode MCP Bridge extension to be installed and running in the target workspace.

1. Install the VSCode MCP Bridge extension
2. Open your project in VSCode
3. The extension will automatically create a Unix socket for communication

## Communication Protocol

The server communicates with VSCode through Unix Domain Sockets:

- **Socket Path**: `/tmp/vscode-mcp-{hash}.sock` (Linux/macOS) or `\\.\pipe\vscode-mcp-{hash}` (Windows)
- **Hash**: MD5 hash of the workspace path (first 8 characters)
- **Protocol**: JSON over Unix Socket

## Error Handling

The server includes comprehensive error handling:

- **Connection Errors**: Graceful handling when VSCode extension is not running
- **Timeout Management**: Automatic timeout for long-running operations
- **Type Validation**: Runtime validation of all parameters
- **Graceful Shutdown**: Clean shutdown on SIGINT/SIGTERM signals

## Development

```bash
# Install dependencies
pnpm install

# Build the project
pnpm build

# Run in development mode
pnpm dev

# Start the built server
pnpm start
```

## Architecture

```
MCP Client ↔ MCP Server ↔ Unix Socket ↔ VSCode Extension ↔ VSCode API
```

This server acts as a bridge between MCP clients and VSCode's Language Server Protocol capabilities, providing real-time access to code intelligence information.

## License

MIT
