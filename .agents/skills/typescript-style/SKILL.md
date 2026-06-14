---
name: typescript-style
description: TypeScript code style and repo conventions for VSCode MCP — inference vs explicit types, ESM import suffixes, zod schema contracts, async VSCode/Node APIs, JSON-safe IPC results, JSDoc for public contracts, and focused validation. Use whenever editing or reviewing `.ts` / `.tsx` files in this project.
---

# TypeScript Style

## Types And Contracts

- Avoid explicit type annotations when TypeScript can infer them.
- Add explicit types when inference would become `any`, `unknown` needs narrowing, or public contracts benefit from IntelliSense.
- Prefer `interface` for object shapes and public contracts; keep `type` for unions, intersections, mapped types, and `z.infer`.
- Prefer accurate broad types such as `Record<PropertyKey, unknown>` over `object`.
- Prefer `as const satisfies SomeInterface` over plain assertions when preserving literal values.
- Keep zod schemas as the runtime contract for IPC params/results. Derive payload/result types with `z.infer`.

## Module And Import Rules

- `vscode-mcp-ipc`, `vscode-mcp-core`, `vscode-mcp-server`, and `vscode-mcp-cli` are ESM packages. Use `.js` suffixes on relative runtime imports in those packages.
- `vscode-mcp-bridge` is bundled as a VSCode extension. Follow the local import style already used in nearby files.
- Prefer named exports for tools, schemas, services, and helpers.
- Avoid cross-layer imports that skip the architecture: bridge calls VSCode APIs; core/server/cli should not import VSCode.

## Async And Runtime Boundaries

- Prefer `async`/`await` over callbacks and `.then()` chains.
- Prefer promise-based Node APIs from `node:fs/promises`; avoid sync filesystem calls outside narrow startup/cleanup paths that already use them.
- Use `Promise.all` for independent async work, especially socket/workspace discovery, but keep order when output stability matters.
- Bridge services may receive VSCode API objects; serialize them before returning through IPC.
- Core handlers should format text and let unexpected errors throw for adapters to wrap.

## Zod And CLI Compatibility

- Use `.strict()` on object schemas.
- Put reusable path/location/position pieces in `packages/vscode-mcp-ipc/src/common.ts`.
- Do not put a `.refine()`-wrapped schema directly on `ToolDefinition.schema`; server and CLI adapters need `.shape`.
- For CLI-friendly schemas, prefer flat fields. If a field is an array of objects or otherwise complex, add `cli.options` and `cli.transform` in the tool definition.
- Keep `.describe()` concise and operational. Field names like `__NOT_RECOMMEND__filePaths` are intentional steering, not style noise.

## Naming And Readability

- Use descriptive names. Avoid abbreviations unless they are established locally (`LSP`, `IPC`, `URI`).
- Match project naming:
  - IPC events: camelCase (`getDiagnostics`)
  - MCP tool names: snake_case (`get_diagnostics`)
  - CLI commands and files: kebab-case (`get-diagnostics`)
- Prefer object destructuring when accessing multiple properties.
- Replace repeated magic strings with constants when they are part of a contract or reused across layers.

## Comments And JSDoc

- Prefer JSDoc for public interfaces, exported helpers, schemas, and non-obvious contracts.
- Add short comments for compatibility constraints, VSCode object serialization, socket fallback behavior, and adapter coupling.
- Keep existing meaningful comments and update them when behavior changes.
- Do not add comments that only restate the next line of code.

## Validation Habits

- Use `vscode-cli get-diagnostics` from the open workspace root for fast diagnostics on modified files.
- For package-level TypeScript/build checks, run the smallest relevant script with `bun run`.
- Do not do formatting-only churn. Let Prettier/ESLint own formatting unless the task is explicitly formatting.
