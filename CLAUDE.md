# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode MCP is a comprehensive monorepo solution that enables MCP (Model Context Protocol) clients to access rich VSCode context information in real-time. It bridges AI assistants with development environments, providing accurate code analysis, diagnostics, and intelligent code navigation.

The project serves AI IDEs (like Cursor) and AI coding agents, helping them replace slow commands like `tsc --noEmit`, `eslint .`, and `npm run build` with real-time LSP information.

## Architecture

This monorepo follows a **three-layer architecture** with strict development ordering requirements:

```plaintext
MCP Client ↔ MCP Server ↔ IPC Layer ↔ VSCode Extension ↔ VSCode API
```

### Packages

1. **`packages/vscode-mcp-ipc`** - Type-safe communication layer
   - Defines Zod schemas and TypeScript types
   - Manages Unix socket communication
   - Provides EventDispatcher for cross-platform socket paths

2. **`packages/vscode-mcp-bridge`** - VSCode extension
   - Implements VSCode-specific service logic
   - Handles socket server and service registration
   - Connects to VSCode APIs and Language Server Protocol

3. **`packages/vscode-mcp-server`** - MCP protocol server
   - Provides standard MCP tool interfaces
   - Translates MCP calls to VSCode extension requests
   - Published as `@vscode-mcp/vscode-mcp-server` on npm

## Development Commands

### Package Management

```bash
# Install dependencies (uses pnpm workspaces)
pnpm install

# Release all packages
pnpm run release
```

### Development Workflow (CRITICAL ORDER)

**MUST follow this exact sequence for any tool development:**

```bash
# 1. IPC Layer - Define schemas and types first
cd packages/vscode-mcp-ipc
npm run build

# 2. Extension Layer - Implement service logic
cd packages/vscode-mcp-bridge
pnpm compile:test  # Type checking
pnpm test         # Run tests

# 3. MCP Server Layer - Create MCP tools
cd packages/vscode-mcp-server
npm run build
npm run typecheck
```

### Individual Package Commands

**vscode-mcp-ipc:**

```bash
npm run build        # Build TypeScript
npm run build:watch  # Watch mode
npm run typecheck    # Type checking only
npm run clean        # Clean dist folder
```

**vscode-mcp-bridge:**

```bash
pnpm compile:test        # Compile for testing
pnpm test               # Run extension tests
pnpm lint               # ESLint checking
pnpm package            # Package .vsix file
pnpm esbuild:watch      # Development build with watch
```

**vscode-mcp-server:**

```bash
npm run build           # Build for production
npm run build:watch     # Watch mode
npm run dev            # Development with tsx
npm run start          # Start built server
npm run typecheck      # Type checking only
```

## Tool Development Process

### CRITICAL Development Order

The project requires a **strict development sequence** that cannot be altered:

1. **IPC Layer** - Define interfaces and schemas
2. **Extension Layer** - Implement VSCode service logic
3. **MCP Server Layer** - Create MCP protocol tools
4. **Quality Optimization** - Error handling and MCP compliance

**After each step**: Always run `get_diagnostics` mcp tool to validate changes and catch errors immediately before proceeding to the next layer.

### Naming Conventions

- **Event names**: camelCase (`getDiagnostics`, `openFiles`)
- **MCP tool names**: snake_case (`get_diagnostics`, `open_files`)
- **File names**: kebab-case (`get-diagnostics.ts`, `open-files.ts`)

### Schema Requirements

- All schemas use Zod with `.strict()` for type safety
- IPC layer schemas must be reused in MCP server layer using `...InputSchema.shape`
- Use `.describe()` for all parameters
- MCP tools must add `workspace_path` parameter

### Error Handling Standards

All MCP tools must use the unified error handler:

```typescript
import { formatToolCallError } from './utils.js';

return formatToolCallError('Tool Name', error);
```

### Multi-Workspace Support

- Each VSCode workspace gets unique socket paths via MD5 hash
- Socket paths: `/tmp/vscode-mcp-{hash}.sock` (Unix) or `\\\\.\\pipe\\vscode-mcp-{hash}` (Windows)
- All tools require `workspace_path` parameter for targeting

## Communication Protocols

- **MCP Client ↔ MCP Server**: JSON-RPC over stdio
- **MCP Server ↔ IPC Layer**: TypeScript function calls
- **IPC Layer ↔ VSCode Extension**: JSON over Unix Domain Sockets
- **Extension ↔ VSCode**: VSCode Extension API + Language Server Protocol

## Available Tools

The project provides 13 MCP tools including:

- `get_diagnostics` - Real-time LSP diagnostics with filtering
- `call_agent` - Integration with IDE AI agents (Cursor Composer, GitHub Copilot)
- `get_definition`/`get_references` - Code navigation
- `highlight_code` - Visual code highlighting
- `execute_command` - VSCode command execution (⚠️ potentially destructive)
- `health_check` - Connection testing
- ... (see `packages/vscode-mcp-server/src/tools`)

## Testing and Validation

### Build Validation Sequence

After each development phase:

```bash
# 1. Validate IPC types
cd packages/vscode-mcp-ipc && npm run build

# 2. Validate Extension implementation
cd packages/vscode-mcp-bridge && pnpm compile:test

# 3. Validate MCP Server tools
cd packages/vscode-mcp-server && npm run build
```

### Real-Time Error Checking with get_diagnostics

**CRITICAL PRACTICE**: Always run `get_diagnostics` after code modifications to catch errors immediately:

```bash
# After any code edits, check for errors using the MCP tool
# This replaces slow commands like `tsc --noEmit` and `eslint .`
get_diagnostics with workspace_path and uris: [] (checks all git modified files)
```

**When to use get_diagnostics:**

- After editing any TypeScript/JavaScript files
- After multiple consecutive edits to validate cumulative changes
- Before committing code changes
- When debugging type errors or ESLint issues
- As an alternative to running build commands that take time

**Benefits:**

- **Instant feedback**: Much faster than running `tsc` or `eslint` commands
- **Git integration**: Automatically checks all modified files when `uris: []`
- **Filtered results**: Can filter by source (`eslint`, `ts`) or severity (`error`, `warning`)
- **Real-time LSP**: Uses VSCode's Language Server Protocol for accurate diagnostics

### Extension Testing

```bash
cd packages/vscode-mcp-bridge
pnpm test  # Runs Mocha tests via VS Code Test Runner
```

## Important Notes

- **Type Safety**: Zod schemas provide runtime validation and TypeScript types
- **Socket Security**: Local-only Unix sockets with file permissions restricted to current user
- **LSP Integration**: Leverages VSCode's Language Server Protocol for real-time code analysis
- **Cross-Platform**: Supports Windows (named pipes) and Unix (domain sockets)
- **Tool Annotations**: Follow MCP specification for tool metadata (readOnlyHint, destructiveHint, etc.)

## Cursor Rules Integration

The project includes comprehensive Cursor rules in `.cursor/rules/vscode-mcp-development-guide.mdc` that provide detailed development workflows, troubleshooting guides, and quality standards for tool development.
