# VSCode MCP Bridge Project Architecture

## Project Background

**VSCode MCP Bridge** is a monorepo project that provides a comprehensive solution for connecting VSCode with MCP (Model Context Protocol), enabling MCP clients to access rich VSCode context information.

## Core Mission

**VSCode MCP Bridge primarily serves AI IDEs (like Cursor) and AI coding agents**, helping them develop and analyze code more efficiently.

### Design Motivation

Traditional AI coding agents often need to execute time-consuming commands when validating code modifications:

- `tsc --noEmit` - TypeScript type checking
- `eslint .` - Code style checking
- `npm run build` - Project building

These commands run slowly in large projects, severely impacting AI development efficiency. VSCode MCP Bridge provides real-time LSP (Language Server Protocol) information, allowing AI agents to:

- **Get fast diagnostics** (`get-diagnostics`) - Replace time-consuming type checking and lint commands
- **Access real-time type information** (`get-hover`) - Get accurate type definitions without compilation
- **Navigate code efficiently** (`get-definition`, `get-references`) - Understand code structure and dependencies
- **Smart file operations** (`open-files`, `open-diff`) - Efficient code review and comparison

### Core Advantages

1. **Real-time**: Leverage VSCode's LSP for real-time code state without executing slow commands
2. **Accuracy**: Precise analysis based on language servers, more reliable than static analysis
3. **Efficiency**: Significantly reduce AI coding agent wait times
4. **Integration**: Deep integration with VSCode ecosystem, supporting multiple languages and extensions

### Core Value

- Enable AI assistants to access real-time code state (errors, warnings, type information)
- Provide standardized interfaces compatible with all MCP clients
- Get real-time LSP information, more accurate than static analysis
- Modular architecture for easy maintenance and extension

## Monorepo Architecture

```plaintext
MCP Client ↔ MCP Server ↔ IPC Layer ↔ VSCode Extension ↔ VSCode API
   stdio      Unix Socket    Types     Extension API
```

### Component Responsibilities

**1. vscode-mcp-ipc** (IPC Communication Layer):

- **Event Definitions**: Define all event types and schemas using Zod for validation
- **Type Safety**: Export type-safe EventMap, EventParams, and EventResult types
- **Communication**: Provide EventDispatcher for Unix Socket communication with timeout handling
- **Socket Management**: Generate cross-platform socket paths based on workspace hash
- **Schema Validation**: Centralized input/output validation schemas for all events
- **Cross-Platform Support**: Handle Windows named pipes and Unix sockets

**2. vscode-mcp-bridge** (VSCode Extension):

- **Socket Server**: SocketServer class with service registration and schema validation
- **Service Registry**: Modular service architecture with type-safe handlers
- **Request Routing**: Route incoming requests to appropriate service handlers
- **Schema Validation**: Validate both request payloads and response results
- **Error Handling**: Comprehensive error handling with detailed error messages
- **Lifecycle Management**: Extension activation/deactivation and resource cleanup
- **Logging**: Structured logging for debugging and monitoring service calls

**3. vscode-mcp-server** (MCP Server):

- **MCP Protocol**: Implement standard MCP protocol with stdio transport
- **Tool Registration**: Register all available tools with proper schema definitions
- **Request Translation**: Translate MCP tool calls to VSCode extension requests
- **Schema Reuse**: Reuse IPC schemas with `...InputSchema.shape` pattern
- **Error Handling**: Graceful error handling with user-friendly messages
- **Output Formatting**: Format responses with status icons and structured output

### Communication Protocols

- **MCP Client ↔ MCP Server**: stdio + JSON-RPC 2.0
- **MCP Server ↔ IPC Layer**: TypeScript imports and function calls
- **IPC Layer ↔ VSCode Extension**: Unix Domain Sockets + JSON (no authentication)

## Multi-Window Support

### Socket Path Generation

Socket paths are generated consistently across both IPC layer and Extension:

```typescript
// IPC Layer: packages/vscode-mcp-ipc/src/dispatch.ts
export function getSocketPath(workspacePath: string): string {
  const hash = createHash('md5').update(workspacePath).digest('hex').slice(0, 8);
  return process.platform === 'win32'
    ? `\\\\.\\pipe\\vscode-mcp-${hash}`
    : join(tmpdir(), `vscode-mcp-${hash}.sock`);
}
```

```typescript
// Extension: packages/vscode-mcp-bridge/src/socket-server.ts
class SocketServer {
  private generateSocketPath(workspacePath: string): string {
    const hash = crypto.createHash('md5').update(workspacePath).digest('hex').slice(0, 8);
    return process.platform === 'win32'
      ? `\\\\.\\pipe\\vscode-mcp-${hash}`
      : path.join(os.tmpdir(), `vscode-mcp-${hash}.sock`);
  }
}
```

**Examples:**

- `/Users/user/frontend` → `/tmp/vscode-mcp-a1b2c3d4.sock`
- `/Users/user/backend` → `/tmp/vscode-mcp-e5f6g7h8.sock`

### Workspace Targeting

All MCP tools require `workspace_path` parameter to target specific VSCode instances.

## Development Workflow

### Development Order (Critical)

When adding/modifying tools, follow this exact order:

1. **IPC Layer** (`packages/vscode-mcp-ipc/`)
   - Define schemas and types
   - Update EventMap
   - Build package: `npm run build`

2. **Extension Layer** (`packages/vscode-mcp-bridge/`)
   - Implement service logic
   - Register with validation
   - Type check: `npx tsc --noEmit --project src/tsconfig.json`

3. **MCP Server Layer** (`packages/vscode-mcp-server/`)
   - Implement tool with schema reuse
   - Register in server
   - Type check: `npx tsc --noEmit --project tsconfig.json`

## Security Considerations

- **Local Communication**: Unix sockets are local-only by design
- **File Permissions**: Socket files restricted to current user
- **No Authentication**: Simplified design for local development use
- **Process Isolation**: Each VSCode window creates its own socket
- **Schema Validation**: Input/output validation prevents injection attacks

## Usage Examples

### Basic Tool Usage

```json
{
  "workspace_path": "/path/to/workspace",
  "uri": "file:///path/to/file.ts",
  "line": 10,
  "character": 5
}
```

### Error Handling

Tools provide detailed error information:

- **Connection Errors**: Socket connection failures
- **Validation Errors**: Schema validation failures with field details
- **VSCode Errors**: Extension operation failures
- **Timeout Errors**: Request timeout handling

## Performance Considerations

- **Batch Operations**: Most tools support batch processing
- **Connection Reuse**: EventDispatcher manages socket connections efficiently
- **Background Loading**: Files can be loaded without editor display
- **Schema Validation**: Fast Zod validation for type safety
- **Workspace Targeting**: Efficient multi-window support

## Troubleshooting

### Common Issues

1. **Type Errors**: Ensure IPC package is built after schema changes
2. **Unknown Method**: Check service registration in all layers
3. **Connection Failures**: Verify workspace path and socket permissions
4. **Schema Validation**: Check parameter types match schema definitions

### Debug Information

- **Extension Logs**: VSCode Output panel → "VSCode MCP Bridge"
- **Socket Paths**: Check generated socket paths for each workspace
- **Service Registration**: Verify all services are registered correctly
