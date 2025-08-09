// Export service functions
export { callAgent } from './call-agent/index.js';
export { executeCommand } from './execute-command';
export { getCommands } from './get-commands';
export { getDefinition } from './get-definition';
export { getDiagnostics } from './get-diagnostics';
export { getHover } from './get-hover';
export { getReferences } from './get-references';
export { getSignatureHelp } from './get-signature-help';
export { health } from './health';
export { highlightCode } from './highlight-code';
export { listWorkspaces } from './list-workspaces';
export { openDiff } from './open-diff';
export { openFiles } from './open-files';
export { renameSymbol } from './rename-symbol';

// Export utilities
export { getCurrentWorkspacePath } from './utils'; 