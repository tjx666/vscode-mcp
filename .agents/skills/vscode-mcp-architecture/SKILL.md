---
name: vscode-mcp-architecture
description: VSCode MCP Bridge project architecture — current monorepo layout, IPC/EventDispatcher flow, per-workspace socket discovery, MCP/CLI adapters, tool filtering, and VSCode extension services. Consult this before non-trivial project changes, connection debugging, workspace_path reasoning, or onboarding to the codebase.
---

# VSCode MCP Bridge Architecture

Use this skill to rebuild the current project shape before changing code. Prefer source files over this summary when they disagree.

## Mission

VSCode MCP lets MCP clients and shell-based agents use live VSCode context: diagnostics, LSP navigation, references, workspace rename, file opening, and selected VSCode commands. The project optimizes agent workflows that would otherwise run slower `tsc`, `eslint`, or build commands for every check.

## Package Map

```plaintext
MCP client
  -> packages/vscode-mcp-server
  -> packages/vscode-mcp-core
  -> packages/vscode-mcp-ipc
  -> per-workspace socket
  -> packages/vscode-mcp-bridge
  -> VSCode API

Shell agent
  -> packages/vscode-mcp-cli
  -> packages/vscode-mcp-core
  -> packages/vscode-mcp-ipc
  -> per-workspace socket
  -> packages/vscode-mcp-bridge
  -> VSCode API
```

- `vscode-mcp-ipc`: zod schemas, `EventMap`, shared types, `EventDispatcher`, socket path generation.
- `vscode-mcp-bridge`: VSCode extension, `SocketServer`, service handlers, extension commands, terminal launcher.
- `vscode-mcp-core`: framework-agnostic `ToolDefinition`s, output formatting, workspace discovery, tool-name constants.
- `vscode-mcp-server`: stdio MCP server, tool filtering, `McpServer.registerTool` adapter.
- `vscode-mcp-cli`: `vscode-cli`, commander subcommands generated from core tool definitions.

## Runtime Flow

1. MCP server or CLI obtains a core `ToolDefinition` from `getAllTools({ clientVersion })`.
2. The MCP adapter adds `workspace_path` for tools with `requiresWorkspace: true`; the CLI adds `--workspace` and defaults it to `process.cwd()`.
3. The adapter validates params with the tool schema, then the core handler creates an `EventDispatcher`, dispatches the camelCase IPC event, and returns human-readable text.
4. `EventDispatcher` connects to the socket derived from `workspace_path`.
5. The bridge `SocketServer` validates payload and result schemas, calls the registered service, and returns JSON.
6. The adapter surfaces handler text. Thrown handler errors become MCP `isError` responses or CLI stderr exits.

## Workspace And Socket Rules

- `workspace_path` selects the VSCode window/socket. It must match the workspace folder reported by `list_workspaces` or the extension activation log.
- Do not pass a child project, package, or git submodule path unless VSCode itself is opened at that path. Keep `workspace_path` at the open workspace root and pass child paths through tool-specific params.
- Socket names use `md5(workspacePath).slice(0, 8)`.
- Current socket locations:
  - macOS: `~/Library/Application Support/YuTengjing.vscode-mcp/vscode-mcp-<hash>.sock`
  - Linux/Unix: `${XDG_DATA_HOME:-~/.local/share}/yutengjing-vscode-mcp/vscode-mcp-<hash>.sock`
  - Windows: `\\.\pipe\vscode-mcp-<hash>`
- The dispatcher tries the current app-data socket first and falls back to legacy `/tmp/vscode-mcp-<hash>.sock` for older extensions.
- `list_workspaces` is global (`requiresWorkspace: false`). Core discovers socket files, health-checks them, and may clean zombie sockets.
- If no workspace folder is open, the bridge extension activates terminal launcher commands but does not start the socket server.

## Current Tools

Tool names live in `packages/vscode-mcp-core/src/constants.ts` and core exports them from `packages/vscode-mcp-core/src/tools/index.ts`.

- `health_check`: verify bridge connection and version compatibility.
- `get_diagnostics`: read VSCode diagnostics; empty `__NOT_RECOMMEND__filePaths` means git-modified files.
- `get_symbol_lsp_info`: combined hover, signature help, type definition, definition, and implementation lookup.
- `get_references`: references with optional usage context.
- `execute_command`: run arbitrary VSCode commands; treat as destructive unless proven safe.
- `open_files`: open files, optionally in background.
- `rename_symbol`: VSCode workspace rename.
- `list_workspaces`: discover connectable VSCode windows.

## Adapter Details

- Server filtering is handled by `--enable-tools`, `--disable-tools`, `VSCODE_MCP_ENABLED_TOOLS`, and `VSCODE_MCP_DISABLED_TOOLS`.
- Filtering validates against `VscodeMcpToolName`; adding a tool requires updating the enum as well as `getAllTools`.
- CLI auto-generates flat flags from each zod object schema. Tools with arrays of objects or other non-flat params must set `tool.cli.options` and `tool.cli.transform`.
- MCP and CLI should expose the same core handler text. Avoid formatting in server or CLI adapters.

## Bridge Extension Notes

- `packages/vscode-mcp-bridge/src/extension.ts` registers socket services and VSCode commands.
- `packages/vscode-mcp-bridge/src/services/*` is the only layer that should call VSCode APIs for MCP tools.
- `packages/vscode-mcp-bridge/src/terminal-launcher/*` contributes terminal toolbar buttons from extension configuration. It is not an MCP tool.
- Bridge service return values must pass IPC output schemas and be JSON-serializable. Convert VSCode objects before returning them.

## Debugging Checklist

- Connection failure: run `vscode-cli list-workspaces` or MCP `list_workspaces`, then use the reported `workspace_path`.
- Unknown method: check IPC `EventMap`, bridge `socketServer.register`, and core `getAllTools`.
- Tool hidden in MCP: check server enable/disable args/env vars and `VscodeMcpToolName`.
- Payload/result validation failure: inspect the zod schema in `packages/vscode-mcp-ipc/src/events/*` and bridge service output.
- Slow or noisy validation: prefer `vscode-cli get-diagnostics` from the open workspace root before broader package builds.
