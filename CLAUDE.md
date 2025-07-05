# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

### Build Commands
```bash
# Build all packages
pnpm -r build

# Build specific package
pnpm --filter vscode-mcp-ipc build
pnpm --filter vscode-mcp-bridge build
pnpm --filter vscode-mcp-server build

# Watch mode for development
pnpm --filter vscode-mcp-ipc build:watch
```

### Type Checking
```bash
# Type check IPC layer
cd packages/vscode-mcp-ipc && npx tsc --noEmit

# Type check VSCode extension
cd packages/vscode-mcp-bridge && npx tsc --noEmit --project src/tsconfig.json

# Type check MCP server
cd packages/vscode-mcp-server && npx tsc --noEmit --project tsconfig.json
```

### VSCode Extension Development
```bash
# Build extension for development
cd packages/vscode-mcp-bridge && npm run esbuild:base

# Watch mode for extension
cd packages/vscode-mcp-bridge && npm run esbuild:watch

# Run extension tests
cd packages/vscode-mcp-bridge && npm test

# Lint extension code
cd packages/vscode-mcp-bridge && npm run lint
```

### MCP Server Development
```bash
# Run server in development mode
cd packages/vscode-mcp-server && npm run dev

# Start built server
cd packages/vscode-mcp-server && npm start
```

## Architecture

This is a monorepo with 3 packages implementing VSCode MCP Bridge:

```
MCP Client ↔ MCP Server ↔ IPC Layer ↔ VSCode Extension ↔ VSCode API
```

### Package Structure

- **`packages/vscode-mcp-ipc/`**: IPC communication layer with event schemas and Unix socket management
- **`packages/vscode-mcp-bridge/`**: VSCode extension that provides LSP services via socket server
- **`packages/vscode-mcp-server/`**: MCP server that translates MCP protocol to VSCode extension calls

### Critical Development Order

When adding or modifying tools, follow this exact order:

1. **IPC Layer**: Define schemas and types, update EventMap, then `npm run build`
2. **Extension Layer**: Implement service logic, register with validation, then type check
3. **MCP Server Layer**: Implement tool with schema reuse, register in server, then type check

### Schema Validation Pattern

All tools use consistent schema validation with Zod:

```typescript
// IPC Layer defines schemas
export const ToolInputSchema = z.object({...}).strict();
export const ToolOutputSchema = z.object({...}).strict();

// Extension registers with validation
socketServer.register('toolName', {
  handler: toolHandler,
  payloadSchema: ToolInputSchema,
  resultSchema: ToolOutputSchema,
});

// MCP Server reuses schemas
const inputSchema = {
  workspace_path: z.string(),
  ...ToolInputSchema.shape, // Reuse pattern
};
```

### Multi-Window Support

Socket paths are generated using workspace path hash:
- `/Users/user/frontend` → `/tmp/vscode-mcp-a1b2c3d4.sock`
- `/Users/user/backend` → `/tmp/vscode-mcp-e5f6g7h8.sock`

All MCP tools require `workspace_path` parameter to target specific VSCode instances.

## Available MCP Tools

Current implementation includes:
- `health_check`: Test connection and extension status
- `get_diagnostics`: Get diagnostics with Git integration and batch processing
- `get_definition`/`get_references`/`get_hover`/`get_signature_help`: LSP navigation
- `open_files`: Batch file opening with optional editor display
- `execute_command`: Execute VSCode commands

## Package Manager

Uses pnpm with workspace support. The root package.json has minimal configuration; each package has its own build scripts and dependencies.