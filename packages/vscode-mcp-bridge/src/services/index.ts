// Export service functions
export { callAgent } from './call-agent/index.js';
export { executeCommand } from './execute-command';
export { getCommands } from './get-commands';
export { getDiagnostics } from './get-diagnostics';
export { getReferences } from './get-references';
export { getSymbolLSPInfo } from './get-symbol-lsp-info';
export { health } from './health';
export { highlightCode } from './highlight-code';
export { listWorkspaces } from './list-workspaces';
export { openDiff } from './open-diff';
export { openFiles } from './open-files';
export { renameSymbol } from './rename-symbol';

// Export utilities
export { getCurrentWorkspacePath } from './utils'; 