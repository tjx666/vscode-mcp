// Export service functions
export { callAgent } from './call-agent/index.js';
export { executeCommand } from './execute-command';
export { getDiagnostics } from './get-diagnostics';
export { getReferences } from './get-references';
export { getSymbolLSPInfo } from './get-symbol-lsp-info';
export { health } from './health';
export { listWorkspaces } from './list-workspaces';
export { openFiles } from './open-files';
export { renameSymbol } from './rename-symbol';

// Export utilities
export { getCurrentWorkspacePath } from '../utils/workspace.js'; 