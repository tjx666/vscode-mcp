import type { z } from 'zod';

/**
 * MCP-style annotations for a tool. Mirrors the subset of fields we set
 * via `McpServer.registerTool`'s `annotations` option.
 */
export interface ToolAnnotations {
  readOnlyHint: boolean;
  destructiveHint: boolean;
  idempotentHint: boolean;
  openWorldHint: boolean;
}

/**
 * Context passed to every tool handler.
 *
 * `workspacePath` is always provided. The MCP adapter forwards the
 * `workspace_path` argument; the CLI adapter forwards either `--workspace`
 * or `process.cwd()`. Tools that don't need it (e.g. `list_workspaces`)
 * simply ignore the field.
 */
export interface ToolHandlerContext {
  workspacePath: string;
}

/**
 * Per-tool CLI customization. When omitted, the CLI adapter auto-generates
 * one commander `--option` per zod field in the schema. Tools whose params
 * can't be expressed as flat flags (e.g. nested object arrays) should set
 * `options` + `transform` to map flags onto the IPC schema.
 */
export interface ToolCliCustomization {
  options?: Array<{
    flags: string;
    description: string;
    defaultValue?: unknown;
    parse?: (value: string, previous?: unknown) => unknown;
  }>;
  transform?: (cliArgs: Record<string, unknown>) => unknown;
}

/**
 * A single, framework-agnostic tool definition. The MCP adapter wraps it
 * into a `McpServer.registerTool` call; the CLI adapter wraps it into a
 * commander subcommand. The handler is responsible for dispatching to the
 * VSCode extension via IPC and returning the human-readable text that both
 * adapters surface verbatim.
 */
export interface ToolDefinition<TSchema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>> {
  /** snake_case identifier used as MCP tool name */
  name: string;
  /** kebab-case identifier used as CLI subcommand */
  cliName: string;
  /** Human-readable title (may contain emoji) */
  title: string;
  description: string;
  /** IPC params schema, without `workspace_path` */
  schema: TSchema;
  annotations: ToolAnnotations;
  /**
   * When false (only `list_workspaces`), the MCP `inputSchema` skips
   * `workspace_path` and the CLI command doesn't require `--workspace`.
   */
  requiresWorkspace: boolean;
  /** Extra hint appended to error messages (only used by `health_check`) */
  errorTips?: string;
  cli?: ToolCliCustomization;
  handler(params: z.infer<TSchema>, ctx: ToolHandlerContext): Promise<string>;
}

export type AnyToolDefinition = ToolDefinition<z.ZodObject<z.ZodRawShape>>;
