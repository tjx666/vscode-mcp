# VSCode MCP Bridge Project Architecture

## Project Background

**VSCode MCP Bridge** is a VSCode extension that connects VSCode with MCP (Model Context Protocol), enabling MCP clients to access rich VSCode context information.

### Core Value

- Enable AI assistants to access real-time code state (errors, warnings, type information)
- Provide standardized interfaces compatible with all MCP clients
- Get real-time LSP information, more accurate than static analysis

## Architecture Design

```
MCP Client ↔ MCP Server ↔ VSCode Extension ↔ VSCode API
   stdio    Unix Socket      Extension API
```

### Component Responsibilities

**VSCode Extension**:

- Create Unix Domain Socket server based on workspace path
- Expose VSCode's LSP capabilities
- Handle requests from MCP Server via Unix Socket
- Main file: `src/extension.ts`
- Lifecycle:
  - `activate()`: Start Unix Socket server
  - `deactivate()`: Close Unix Socket server and cleanup

**MCP Server**:

- Implement standard MCP protocol (stdio transport)
- Connect to appropriate VSCode Extension via Unix Socket
- Calculate socket path based on workspace_path parameter
- Handle errors, retries, and timeout logic

### Communication Protocols

- **MCP Client ↔ MCP Server**: stdio + JSON-RPC 2.0
- **MCP Server ↔ VSCode Extension**: Unix Domain Sockets + JSON (no authentication)

## Multi-Window Support

### Socket Path Generation

```typescript
/**
 * VSCode Extension generates socket path based on workspace
 */
function getSocketPath(workspacePath: string): string {
  const hash = crypto.createHash('md5').update(workspacePath).digest('hex').slice(0, 8);

  return process.platform === 'win32'
    ? `\\\\.\\pipe\\vscode-mcp-${hash}`
    : `/tmp/vscode-mcp-${hash}.sock`;
}

// Examples:
// /Users/user/frontend → /tmp/vscode-mcp-a1b2c3d4.sock
// /Users/user/backend  → /tmp/vscode-mcp-e5f6g7h8.sock
```

### Workspace Targeting

```json
{
  "name": "get_diagnostics",
  "inputSchema": {
    "properties": {
      "workspace_path": {
        "type": "string",
        "description": "VSCode workspace path to target"
      },
      "uri": {
        "type": "string",
        "description": "File URI to get diagnostics for"
      }
    },
    "required": ["workspace_path", "uri"]
  }
}
```

## API Specifications

### Unix Socket Communication

**Socket Path**: Calculated based on workspace path hash
**Message Format**: JSON objects over Unix Socket
**Protocol**: Request-Response pattern

### Message Format

**Request Format**:

```json
{
  "id": "unique-request-id",
  "method": "getDiagnostics",
  "params": {
    "uri": "file:///path/to/file.ts"
  }
}
```

**Response Format**:

```json
{
  "id": "unique-request-id",
  "result": {
    "diagnostics": []
  }
}
```

**Error Response Format**:

```json
{
  "id": "unique-request-id",
  "error": {
    "code": 500,
    "message": "Failed to get diagnostics",
    "details": "Document not found"
  }
}
```

### Core Methods (MVP Version)

**Health Check**:

```json
{
  "method": "health",
  "params": {}
}
```

**Response**:

```json
{
  "result": {
    "status": "ok",
    "version": "1.0.0",
    "workspace": "..."
  }
}
```

**LSP Methods (Core Language Service Functions)**:

**Get diagnostics**:

```json
{
  "method": "getDiagnostics",
  "params": { "uri": "file:///path/to/file.ts" }
}
```

**Get definition**:

```json
{
  "method": "getDefinition",
  "params": { "uri": "file://...", "line": 10, "character": 5 }
}
```

**Get references**:

```json
{
  "method": "getReferences",
  "params": { "uri": "file://...", "line": 10, "character": 5 }
}
```

**Get hover information**:

```json
{
  "method": "getHover",
  "params": { "uri": "file://...", "line": 10, "character": 5 }
}
```

**Get completions**:

```json
{
  "method": "getCompletions",
  "params": { "uri": "file://...", "line": 10, "character": 5 }
}
```

**Get signature help**:

```json
{
  "method": "getSignatureHelp",
  "params": { "uri": "file://...", "line": 10, "character": 5 }
}
```

**Get document symbols**:

```json
{
  "method": "getDocumentSymbols",
  "params": { "uri": "file:///path/to/file.ts" }
}
```

**Get workspace symbols**:

```json
{
  "method": "getWorkspaceSymbols",
  "params": { "query": "className" }
}
```

**Basic Utility Methods**:

**Get workspace info**:

```json
{
  "method": "getWorkspaceInfo",
  "params": {}
}
```

## Available MCP Tools (MVP Version)

Through the MCP Server, clients can use these tools (all require `workspace_path` parameter):

### Core LSP Tools

- `get_diagnostics`: Get file diagnostic information (errors, warnings)
- `get_definition`: Get symbol definition locations
- `get_references`: Get symbol reference locations
- `get_hover`: Get symbol hover information
- `get_completions`: Get auto-completion suggestions
- `get_signature_help`: Get function signature help
- `get_document_symbols`: Get document symbols (functions, classes, variables)
- `get_workspace_symbols`: Search workspace symbols

### Basic Utility Tools

- `get_workspace_info`: Get current workspace information

### Usage Example

```typescript
// MCP Client calls tool with workspace targeting
await mcp.call('get_diagnostics', {
  workspace_path: '/Users/user/frontend-project',
  uri: 'file:///Users/user/frontend-project/src/App.tsx',
});

await mcp.call('get_definition', {
  workspace_path: '/Users/user/backend-project',
  uri: 'file:///Users/user/backend-project/src/main.ts',
  line: 10,
  character: 5,
});

await mcp.call('get_hover', {
  workspace_path: '/Users/user/frontend-project',
  uri: 'file:///Users/user/frontend-project/src/components/Button.tsx',
  line: 15,
  character: 8,
});
```

## MVP Implementation Focus

The MVP version focuses on **Language Service capabilities** only, providing AI assistants with:

1. **Real-time Code Analysis**: Access to live diagnostic information (errors, warnings, hints)
2. **Symbol Navigation**: Definition lookup, reference finding, symbol hierarchies
3. **Type Information**: Hover information, signature help, completions
4. **Code Intelligence**: Document and workspace symbol search

This core set of capabilities enables MCP clients to:

- Understand code structure and relationships
- Get real-time error information
- Provide accurate code suggestions
- Navigate large codebases efficiently

**Future Versions** may include:

- Document editing capabilities
- File system operations
- UI interaction tools
- Git integration
- Debug operations

## Development Conventions

### Code Organization

- **Extension Entry**: `src/extension.ts`
- **Socket Server**: Handle Unix Socket connections and LSP method routing
- **Configuration**: `package.json`
- **Build Scripts**: `scripts/`

### Technology Stack

- **Runtime**: Node.js (VSCode extension environment)
- **IPC**: Unix Domain Sockets (cross-platform)
- **Communication Format**: JSON over Unix Socket
- **Concurrency**: Support multiple MCP clients and multiple VSCode windows

### Socket Management

- **Path Generation**: MD5 hash of workspace path (first 8 characters)
- **Cleanup**: Remove socket files on extension deactivation
- **Error Handling**: Graceful fallback if socket creation fails
- **Permissions**: Socket files with appropriate file system permissions

### Security Considerations

- **Local Communication**: Unix sockets are local-only by design
- **File Permissions**: Restrict socket file access to current user
- **No Authentication**: Simplified design for local development use
- **Process Isolation**: Each VSCode window creates its own socket

## Use Cases

- **AI Programming Assistants**: Enable AI to get code diagnostic info, symbol definitions across multiple projects
- **Code Analysis Tools**: Perform code analysis based on VSCode's LSP information
- **Automation Scripts**: Automate VSCode operations across multiple workspaces
- **Multi-Project Development**: Work with frontend/backend/shared libraries simultaneously
