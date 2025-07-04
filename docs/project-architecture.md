# VSCode MCP Bridge Project Architecture

## Project Background

**VSCode MCP Bridge** is a monorepo project that provides a comprehensive solution for connecting VSCode with MCP (Model Context Protocol), enabling MCP clients to access rich VSCode context information.

### Core Value

- Enable AI assistants to access real-time code state (errors, warnings, type information)
- Provide standardized interfaces compatible with all MCP clients
- Get real-time LSP information, more accurate than static analysis
- Modular architecture for easy maintenance and extension

## Monorepo Architecture

```
MCP Client ↔ MCP Server ↔ IPC Layer ↔ VSCode Extension ↔ VSCode API
   stdio      Unix Socket    Types     Extension API
```

### Project Structure

```
vscode-mcp/
├── packages/
│   ├── vscode-mcp-ipc/        # 🔗 IPC Communication Layer
│   │   ├── src/
│   │   │   ├── events.ts      # Event definitions and types
│   │   │   ├── dispatch.ts    # Unix Socket communication
│   │   │   └── index.ts       # Module exports
│   │   ├── dist/              # Compiled output
│   │   └── package.json
│   │
│   ├── vscode-mcp-bridge/     # 🔌 VSCode Extension
│   │   ├── src/
│   │   │   └── extension.ts   # Extension entry point
│   │   ├── assets/
│   │   └── package.json
│   │
│   └── vscode-mcp-server/     # 🌐 MCP Server
│       ├── src/               # (To be implemented)
│       └── package.json
│
├── docs/
│   └── project-architecture.md
├── pnpm-workspace.yaml
└── package.json
```

### Component Responsibilities

**1. vscode-mcp-ipc** (IPC Communication Layer):

- Define all event types and interfaces between MCP Server and VSCode Extension
- Provide type-safe event dispatching with Unix Socket communication
- Handle cross-platform socket path generation
- Manage request/response lifecycle with timeout and error handling
- Export: `EventDispatcher`, `createDispatcher`, and all LSP-related types

**2. vscode-mcp-bridge** (VSCode Extension):

- Create Unix Domain Socket server based on workspace path
- Implement VSCode's LSP capabilities handlers
- Handle requests from MCP Server via Unix Socket
- Main file: `src/extension.ts`
- Lifecycle:
  - `activate()`: Start Unix Socket server
  - `deactivate()`: Close Unix Socket server and cleanup

**3. vscode-mcp-server** (MCP Server):

- Implement standard MCP protocol (stdio transport)
- Connect to appropriate VSCode Extension via Unix Socket using `vscode-mcp-ipc`
- Handle MCP client requests and translate them to VSCode extension calls
- Handle errors, retries, and timeout logic

### Communication Protocols

- **MCP Client ↔ MCP Server**: stdio + JSON-RPC 2.0
- **MCP Server ↔ IPC Layer**: TypeScript imports and function calls
- **IPC Layer ↔ VSCode Extension**: Unix Domain Sockets + JSON (no authentication)

## Multi-Window Support

### Socket Path Generation

The `vscode-mcp-ipc` package handles socket path generation:

```typescript
// From packages/vscode-mcp-ipc/src/dispatch.ts
export function getSocketPath(workspacePath: string): string {
  const hash = createHash('md5').update(workspacePath).digest('hex').slice(0, 8);

  return process.platform === 'win32'
    ? `\\\\.\\pipe\\vscode-mcp-${hash}`
    : `/tmp/vscode-mcp-${hash}.sock`;
}

// Examples:
// /Users/user/frontend → /tmp/vscode-mcp-a1b2c3d4.sock
// /Users/user/backend  → /tmp/vscode-mcp-e5f6g7h8.sock
```

### Workspace Targeting

MCP Server tools require `workspace_path` parameter to target specific VSCode instances:

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

### IPC Layer Interface

The `vscode-mcp-ipc` package defines all communication interfaces:

```typescript
// Type-safe event dispatching
const dispatcher = createDispatcher('/path/to/workspace');

// Get diagnostics
const diagnostics = await dispatcher.dispatch('getDiagnostics', {
  uri: 'file:///path/to/file.ts',
});

// Get definitions
const definitions = await dispatcher.dispatch('getDefinition', {
  uri: 'file:///path/to/file.ts',
  line: 10,
  character: 5,
});
```

### Core Events (MVP Version)

All events are defined in `packages/vscode-mcp-ipc/src/events.ts`:

**Health Check**:

```typescript
health: {
  params: Record<string, never>;
  result: {
    status: 'ok' | 'error';
    version: string;
    workspace?: string;
  };
}
```

**LSP Methods**:

- `getDiagnostics`: Get file diagnostic information
- `getDefinition`: Get symbol definition locations
- `getReferences`: Get symbol reference locations
- `getHover`: Get symbol hover information
- `getCompletions`: Get auto-completion suggestions
- `getSignatureHelp`: Get function signature help
- `getDocumentSymbols`: Get document symbols
- `getWorkspaceSymbols`: Search workspace symbols

**Basic Utility**:

- `getWorkspaceInfo`: Get current workspace information

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

### Monorepo Structure

- **Root Package**: `vscode-mcp` - Workspace configuration and shared tooling
- **IPC Package**: `vscode-mcp-ipc` - Type definitions and communication layer
- **Extension Package**: `vscode-mcp-bridge` - VSCode extension implementation
- **Server Package**: `vscode-mcp-server` - MCP server implementation

### Package Management

- **Package Manager**: pnpm with workspace support
- **Dependency Management**: Shared dependencies in root `package.json`
- **Build System**: TypeScript compilation per package
- **Version Management**: Independent versioning per package

### Code Organization

- **Extension Entry**: `packages/vscode-mcp-bridge/src/extension.ts`
- **IPC Layer**: `packages/vscode-mcp-ipc/src/`
- **Server Entry**: `packages/vscode-mcp-server/src/` (to be implemented)
- **Shared Types**: All types defined in `vscode-mcp-ipc` package

### Technology Stack

- **Runtime**: Node.js (VSCode extension environment)
- **Language**: TypeScript with strict mode
- **IPC**: Unix Domain Sockets (cross-platform)
- **Communication Format**: JSON over Unix Socket
- **Build Tool**: TypeScript compiler
- **Package Manager**: pnpm

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

## Development Workflow

### Building Packages

```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter vscode-mcp-ipc build

# Watch mode for development
pnpm --filter vscode-mcp-ipc build:watch
```

### Installing Dependencies

```bash
# Install all dependencies
pnpm install

# Add dependency to specific package
pnpm --filter vscode-mcp-server add some-package
```

### Testing

```bash
# Test all packages
pnpm -r test

# Test specific package
pnpm --filter vscode-mcp-bridge test
```

## Use Cases

- **AI Programming Assistants**: Enable AI to get code diagnostic info, symbol definitions across multiple projects
- **Code Analysis Tools**: Perform code analysis based on VSCode's LSP information
- **Automation Scripts**: Automate VSCode operations across multiple workspaces
- **Multi-Project Development**: Work with frontend/backend/shared libraries simultaneously

## Next Steps

1. **Implement vscode-mcp-server**: Create MCP server using `vscode-mcp-ipc`
2. **Update vscode-mcp-bridge**: Implement socket server handlers
3. **Add comprehensive testing**: Unit tests for all packages
4. **Documentation**: API documentation and usage examples
5. **CI/CD**: Automated testing and publishing workflows
