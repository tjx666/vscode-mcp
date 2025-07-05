/**
 * VSCode MCP Tools Index
 * 
 * This module exports all tool registration functions.
 */

export { registerExecuteCommand } from "./execute-command.js"; 
export { registerGetDefinition } from "./get-definition.js";
export { registerGetDiagnostics } from "./get-diagnostics.js";
export { registerGetHover } from "./get-hover.js";
export { registerGetReferences } from "./get-references.js";
export { registerGetSignatureHelp } from "./get-signature-help.js";
export { registerGetWorkspaceInfo } from "./get-workspace-info.js";
export { registerGetWorkspaceSymbols } from "./get-workspace-symbols.js";
export { registerHealthCheck } from "./health-check.js";
export { registerOpenFiles } from "./open-files.js";