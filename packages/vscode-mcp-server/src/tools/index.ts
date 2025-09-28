/**
 * VSCode MCP Tools Index
 * 
 * This module exports all tool registration functions.
 */

// 工具错误处理函数
export { formatToolCallError } from "../utils/format-tool-call-error.js";

// 工具注册函数
export { registerExecuteCommand } from "./execute-command.js"; 
export { registerGetDiagnostics } from "./get-diagnostics.js";
export { registerGetReferences } from "./get-references.js";
export { registerGetSymbolLSPInfo } from "./get-symbol-lsp-info.js";
export { registerHealthCheck } from "./health-check.js";
export { registerListWorkspaces } from "./list-workspaces.js";
export { registerOpenFiles } from "./open-files.js";
export { registerRenameSymbol } from "./rename-symbol.js";
