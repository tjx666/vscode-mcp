/**
 * VSCode MCP Tool Names
 *
 * Centralized definition of all available tool names used throughout the MCP server.
 * This enum ensures type safety and consistent naming across the codebase.
 */
export enum VscodeMcpToolName {
  EXECUTE_COMMAND = 'execute_command',
  GET_DIAGNOSTICS = 'get_diagnostics',
  GET_REFERENCES = 'get_references',
  GET_SYMBOL_LSP_INFO = 'get_symbol_lsp_info',
  HEALTH_CHECK = 'health_check',
  LIST_WORKSPACES = 'list_workspaces',
  OPEN_FILES = 'open_files',
  RENAME_SYMBOL = 'rename_symbol',
}

/**
 * Get all available tool names as an array
 */
export function getAllToolNames(): string[] {
  return Object.values(VscodeMcpToolName);
}
