/**
 * Centralized tool name enum, used for `--enable-tools` / `--disable-tools`
 * filtering on both the MCP server and CLI.
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

export function getAllToolNames(): string[] {
  return Object.values(VscodeMcpToolName);
}
