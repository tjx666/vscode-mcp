---
name: vscode-mcp-tool-development
description: End-to-end workflow for adding, modifying, or debugging VSCode MCP tools in this repo — IPC zod schema and EventMap, bridge service registration, core ToolDefinition and tool constants, MCP/CLI adapter behavior, workspace_path semantics, CLI flag generation, validation, and regression testing.
---

# VSCode MCP Tool Development

Use this when a change touches tool contracts, service behavior, tool output, or adapter exposure under `packages/vscode-mcp-{ipc,bridge,core,server,cli}/src/`.

## Golden Path

```plaintext
IPC schema/EventMap -> bridge service -> core ToolDefinition/constants -> validation
```

Server and CLI are thin adapters around `vscode-mcp-core`. Do not edit them for ordinary tools unless adapter behavior itself changes.

## 1. IPC Contract

Add or update the event in `packages/vscode-mcp-ipc/src/events/`.

- Use a kebab-case file name and camelCase IPC event name.
- Export `InputSchema`, `OutputSchema`, payload type, and result type.
- Use `.strict()` on object schemas.
- Put shared path/location/position fields in `packages/vscode-mcp-ipc/src/common.ts` when they are reused.
- Update `packages/vscode-mcp-ipc/src/events/index.ts`:
  - import payload/result types
  - export the event module
  - add the event to `EventMap`

Keep `ToolDefinition.schema` compatible with `.shape`. If a schema needs `.refine()` or another wrapper that hides `.shape`, expose a base `z.object(...).strict()` schema for core/adapter usage and apply refined validation in the layer that needs it.

## 2. Bridge Service

Implement the VSCode API behavior in `packages/vscode-mcp-bridge/src/services/`.

- Type service payloads as `EventParams<'eventName'>` and results as `EventResult<'eventName'>`.
- Register the service in `packages/vscode-mcp-bridge/src/extension.ts` with payload and result schemas.
- Keep VSCode API objects inside the bridge layer. Return plain JSON-compatible data that passes the IPC output schema.
- Throw errors for true failures. Include `cause` when it helps debugging.
- For command-style operations that intentionally surface command failure as data, follow the existing `executeCommand` pattern.

## 3. Core Tool

Create or update `packages/vscode-mcp-core/src/tools/<tool-name>.ts`.

- Reuse the IPC input schema directly: `schema: SomeInputSchema`.
- Use snake_case for MCP `name`, kebab-case for CLI `cliName`, and kebab-case file names.
- Set `requiresWorkspace: true` unless the tool is genuinely global, like `list_workspaces`.
- In `handler`, create a dispatcher with `createDispatcher(workspacePath)`, dispatch the camelCase IPC event, and return the final human-readable text.
- Let unexpected errors throw. MCP and CLI adapters add the `❌ <title> failed` wrapper.
- Use `errorTips` only for extra operator guidance, such as extension installation or version mismatch hints.

Then update:

- `packages/vscode-mcp-core/src/tools/index.ts`: export the tool and add it to `getAllTools({ clientVersion })`.
- `packages/vscode-mcp-core/src/constants.ts`: add the tool name to `VscodeMcpToolName` so server filtering validates it.

## 4. CLI Exposure

The CLI auto-generates one flag per zod object field.

- Simple string/number/boolean/enum/array-of-primitive fields need no CLI code.
- Arrays of objects and other non-flat shapes require `tool.cli.options` plus `tool.cli.transform`.
- Boolean defaults of `true` become `--no-<flag>`.
- `__NOT_RECOMMEND__filePaths` becomes `--not-recommend-file-paths`; the CLI rebuilds the original zod key before parsing.

## 5. Descriptions And Agent Steering

Tool descriptions are prompt surface. Include only operational guidance that helps an agent use the tool correctly.

- Say that `workspace_path` selects a VSCode socket, not an arbitrary repository root.
- Tell agents to run `list_workspaces` when unsure which workspace path to use.
- For git-modified diagnostics, preserve the existing empty-array behavior of `__NOT_RECOMMEND__filePaths`.
- Use `__NOT_RECOMMEND__` field names for params that are technically configurable but usually should be left at defaults.
- Mark dangerous tools accurately. `execute_command` is destructive/open-ended unless the specific command is proven safe.

## 6. Validation

Prefer targeted validation matching the layer changed.

```bash
# IPC schema/type changes
cd packages/vscode-mcp-ipc && bun run build

# Bridge service or extension registration
cd packages/vscode-mcp-bridge && bun run compile:test

# Core tool definitions, descriptions, constants, or formatting
cd packages/vscode-mcp-core && bun run build

# Adapter behavior changes
cd packages/vscode-mcp-server && bun run build
cd packages/vscode-mcp-cli && bun run build
```

For repo diagnostics, run from the VSCode workspace root:

```bash
vscode-cli get-diagnostics
```

If the extension is available, smoke-test the changed tool through `vscode-cli` because it exercises the same core handler and socket path as MCP. Use `vscode-cli list-workspaces` first when the workspace path is uncertain.

## Regression Tests

- Add or update a regression test when fixing a bug.
- Prefer the smallest testable unit. For bridge VSCode API behavior, use the existing extension test harness only when the logic cannot be isolated.
- Avoid changing server/CLI tests for a new ordinary tool unless adapter behavior changes; core registration plus a CLI smoke test is usually enough.

## Common Failure Modes

- `Unknown method`: missing `EventMap` entry or bridge `socketServer.register`.
- Tool not available through server filtering: missing `VscodeMcpToolName` entry.
- CLI crashes during registration: schema field is not representable as flat flags and needs `cli.options`/`cli.transform`.
- Connection points at the wrong VSCode window: `workspace_path` is a child folder or submodule path instead of the open workspace.
- Result validation fails: bridge service returned a VSCode object or non-JSON shape instead of schema-compatible data.
