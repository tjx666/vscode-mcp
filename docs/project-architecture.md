# VSCode MCP Bridge Project Architecture

## Project Background

**VSCode MCP Bridge** is a monorepo project that provides a comprehensive solution for connecting VSCode with MCP (Model Context Protocol), enabling MCP clients to access rich VSCode context information.

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

### Project Structure

```plaintext
vscode-mcp/
├── packages/
│   ├── vscode-mcp-ipc/        # 🔗 IPC Communication Layer
│   │   ├── src/
│   │   │   ├── events/        # Event definitions and schemas
│   │   │   │   ├── index.ts   # EventMap and exports
│   │   │   │   ├── common.ts  # Common types (Position, Range, Location)
│   │   │   │   ├── health-check.ts
│   │   │   │   ├── get-*.ts   # LSP method definitions
│   │   │   │   ├── execute-command.ts
│   │   │   │   ├── open-diff.ts
│   │   │   │   └── open-file.ts
│   │   │   ├── dispatch.ts    # Unix Socket communication
│   │   │   └── index.ts       # Module exports
│   │   ├── dist/              # Compiled output
│   │   └── package.json
│   │
│   ├── vscode-mcp-bridge/     # 🔌 VSCode Extension
│   │   ├── src/
│   │   │   ├── extension.ts   # Extension entry point and lifecycle
│   │   │   ├── socket-server.ts # Unix Socket server with schema validation
│   │   │   ├── logger.ts      # Structured logging for service calls
│   │   │   ├── services/      # Modular service implementations
│   │   │   │   ├── index.ts   # Service exports
│   │   │   │   ├── utils.ts   # Workspace utilities
│   │   │   │   ├── types.ts   # Service types
│   │   │   │   ├── health.ts
│   │   │   │   ├── get-*.ts   # LSP service implementations
│   │   │   │   ├── execute-command.ts
│   │   │   │   ├── open-diff.ts
│   │   │   │   └── open-files.ts
│   │   │   └── tsconfig.json
│   │   ├── assets/
│   │   ├── scripts/           # Build scripts
│   │   ├── test/              # Extension tests
│   │   └── package.json
│   │
│   └── vscode-mcp-server/     # 🌐 MCP Server
│       ├── src/
│       │   ├── index.ts       # Server entry point
│       │   ├── server.ts      # Server configuration and tool registration
│       │   └── tools/         # MCP tool implementations
│       │       ├── index.ts   # Tool exports
│       │       ├── health-check.ts
│       │       ├── get-*.ts   # LSP tools
│       │       ├── execute-command.ts
│       │       ├── open-diff.ts
│       │       └── open-files.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docs/
│   ├── project-architecture.md
│   └── adjust-tools.md        # Tool development guide
├── pnpm-workspace.yaml
└── package.json
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

## Available MCP Tools (Current Implementation)

### Core Tools (Implemented)

#### 1. **Health Check**

- **Tool**: `health_check`
- **Description**: Test connection and get extension status
- **Parameters**: None
- **Returns**: Status, version, workspace info

#### 2. **Diagnostics**

- **Tool**: `get_diagnostics`
- **Description**: Get diagnostic information for multiple files with Git integration
- **Parameters**: `uris` (array, empty = all git modified files)
- **Features**:
  - Auto-detect git modified files (staged and unstaged)
  - Batch processing multiple files
  - Auto-open files for accurate LSP diagnostics
  - Formatted output with severity icons

#### 3. **Code Navigation**

- **Tool**: `get_definition`
- **Description**: Get symbol definition locations
- **Parameters**: `uri`, `line`, `character`

- **Tool**: `get_references`
- **Description**: Get symbol reference locations
- **Parameters**: `uri`, `line`, `character`, `includeDeclaration?`

- **Tool**: `get_hovers`
- **Description**: Get hover information for multiple positions in code files
- **Parameters**: `positions` (array of position objects), `includeAllHovers?` (boolean)
- **Features**:
  - Batch processing multiple positions
  - Option to get all hover providers' information vs first one only
  - Parallel processing for performance
  - Individual error handling for each position

- **Tool**: `get_signature_help`
- **Description**: Get function signature help
- **Parameters**: `uri`, `line`, `character`

#### 4. **File Operations**

- **Tool**: `open_files`
- **Description**: Open multiple files with optional editor display
- **Parameters**: `files` (array with `uri` and optional `showEditor`)
- **Features**:
  - Batch file opening
  - Background loading for LSP processing
  - Individual operation status reporting

#### 5. **Diff Operations**

- **Tool**: `open_diff`
- **Description**: Open a diff editor in VSCode to compare two files or text content side by side
- **Parameters**: `before?`, `after?`, `beforeText?`, `afterText?`, `beforeLabel?`, `afterLabel?`, `language?`
- **Features**:
  - File-to-file comparison using URIs
  - Text-to-text comparison using content strings
  - Mixed mode (file vs text) comparison
  - Custom labels for text content
  - Language-specific syntax highlighting
  - Automatic diff editor title generation

#### 6. **Command Execution**

- **Tool**: `execute_command`
- **Description**: Execute VSCode commands with arguments
- **Parameters**: `command`, `args?`

### Future Tools (Not implemented)

None currently planned.

## API Specifications

### Schema Validation Architecture

All tools use consistent schema validation:

```typescript
// IPC Layer defines schemas
export const ToolInputSchema = z
  .object({
    // Schema definition here
  })
  .strict();

export const ToolOutputSchema = z
  .object({
    // Schema definition here
  })
  .strict();

// Extension registers with validation
socketServer.register('toolName', {
  handler: toolHandler,
  payloadSchema: ToolInputSchema,
  resultSchema: ToolOutputSchema,
});

// MCP Server reuses schemas
const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...ToolInputSchema.shape, // ✅ Correct schema reuse
};
```

**Special Case: Schema with Validation**

For schemas that need validation (e.g., `.refine()`), use the base schema pattern:

```typescript
// IPC Layer: Define base schema for reuse
export const ToolBaseInputSchema = z
  .object({
    // Schema definition here
  })
  .strict();

// IPC Layer: Define complete schema with validation
export const ToolInputSchema = ToolBaseInputSchema.refine(
  (data) => {
    // Validation logic here
    return isValid;
  },
  { message: 'Validation error message' },
);

// MCP Server: Reuse base schema to avoid ZodEffects type issues
const inputSchema = {
  workspace_path: z.string().describe('VSCode workspace path to target'),
  ...ToolBaseInputSchema.shape, // ✅ Correct base schema reuse
};
```

### Event-Driven Communication

```typescript
// Type-safe event dispatching
const dispatcher = createDispatcher('/path/to/workspace');

// All events are strongly typed
const diagnostics = await dispatcher.dispatch('getDiagnostics', {
  uris: ['file:///path/to/file.ts'],
});
```

## Development Workflow

### Prerequisites

- Node.js 18+
- pnpm
- TypeScript knowledge
- VSCode Extension API familiarity

### Setup and Build

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Build specific package
pnpm --filter vscode-mcp-ipc build

# Watch mode for development
pnpm --filter vscode-mcp-ipc build:watch
```

### Development Commands

```bash
# Type checking (no compilation)
cd packages/vscode-mcp-ipc && npx tsc --noEmit
cd packages/vscode-mcp-bridge && npx tsc --noEmit --project src/tsconfig.json
cd packages/vscode-mcp-server && npx tsc --noEmit --project tsconfig.json

# Extension building
cd packages/vscode-mcp-bridge && npm run esbuild:base

# Linting
cd packages/vscode-mcp-bridge && npm run lint
```

### Testing

Currently, testing is limited to:

- **Type Checking**: TypeScript compilation validation
- **Manual Testing**: VSCode extension manual testing
- **Connection Testing**: Socket connection validation

**Note**: Unit tests and integration tests are not yet implemented for most packages.

### Package Management

- **Package Manager**: pnpm with workspace support
- **Dependency Management**: Shared dependencies in root `package.json`
- **Build System**: TypeScript compilation per package
- **Version Management**: Independent versioning per package

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

### Code Quality

- **TypeScript Strict Mode**: All packages use strict TypeScript
- **Schema Validation**: Runtime validation with Zod
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Consistent Patterns**: Standardized patterns across all tools

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
  "uris": ["file:///path/to/file1.ts", "file:///path/to/file2.ts"]
}
```

```json
{
  "workspace_path": "/path/to/workspace",
  "uris": []
}
```

```json
{
  "workspace_path": "/path/to/workspace",
  "files": [
    { "uri": "file:///path/to/file1.ts", "showEditor": true },
    { "uri": "file:///path/to/file2.ts", "showEditor": false }
  ]
}
```

```json
{
  "workspace_path": "/path/to/workspace",
  "before": "file:///path/to/file1.ts",
  "after": "file:///path/to/file2.ts",
  "language": "typescript"
}
```

```json
{
  "workspace_path": "/path/to/workspace",
  "beforeText": "const old = 'version';",
  "afterText": "const new = 'version';",
  "beforeLabel": "Old Code",
  "afterLabel": "New Code",
  "language": "typescript"
}
```

```json
{
  "workspace_path": "/path/to/workspace",
  "positions": [
    { "uri": "file:///path/to/file1.ts", "line": 10, "character": 5 },
    { "uri": "file:///path/to/file2.ts", "line": 20, "character": 10 }
  ],
  "includeAllHovers": true
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

## Future Enhancements

### Planned Features

- **Comprehensive Testing**: Unit and integration tests
- **Performance Monitoring**: Request/response timing
- **Configuration Management**: User-configurable settings
- **Enhanced Error Recovery**: Retry mechanisms and fallbacks

### Potential Extensions

- **Document Editing**: File modification capabilities
- **Git Integration**: Extended Git operations
- **UI Interaction**: Direct VSCode UI manipulation
- **Debug Support**: Debugging session integration
