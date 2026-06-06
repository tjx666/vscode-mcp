import type { AnyToolDefinition } from '../types.js';
import { executeCommandTool } from './execute-command.js';
import { getDiagnosticsTool } from './get-diagnostics.js';
import { getReferencesTool } from './get-references.js';
import { getSymbolLspInfoTool } from './get-symbol-lsp-info.js';
import { createHealthCheckTool } from './health-check.js';
import { listOpenEditorsTool } from './list-open-editors.js';
import { listWorkspacesTool } from './list-workspaces.js';
import { openFilesTool } from './open-files.js';
import { renameSymbolTool } from './rename-symbol.js';

export { executeCommandTool } from './execute-command.js';
export { getDiagnosticsTool } from './get-diagnostics.js';
export { getReferencesTool } from './get-references.js';
export { getSymbolLspInfoTool } from './get-symbol-lsp-info.js';
export { createHealthCheckTool } from './health-check.js';
export { listOpenEditorsTool } from './list-open-editors.js';
export { listWorkspacesTool } from './list-workspaces.js';
export { openFilesTool } from './open-files.js';
export { renameSymbolTool } from './rename-symbol.js';

/**
 * Resolve the full list of tools. The caller supplies its own version string
 * so the health-check tool can compare against the bridge extension's version.
 */
export function getAllTools(opts: { clientVersion: string }): AnyToolDefinition[] {
  return [
    createHealthCheckTool(opts.clientVersion) as AnyToolDefinition,
    getDiagnosticsTool as AnyToolDefinition,
    getSymbolLspInfoTool as AnyToolDefinition,
    getReferencesTool as AnyToolDefinition,
    executeCommandTool as AnyToolDefinition,
    openFilesTool as AnyToolDefinition,
    renameSymbolTool as AnyToolDefinition,
    listWorkspacesTool as AnyToolDefinition,
    listOpenEditorsTool as AnyToolDefinition,
  ];
}
