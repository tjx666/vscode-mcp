/**
 * VSCode MCP Tools Index
 * 
 * This module exports all tool registration functions.
 */

// 工具错误处理函数
export { formatToolCallError } from "./utils.js";

// 工具注册函数
export { registerCallAgent } from "./call-agent.js";
export { registerExecuteCommand } from "./execute-command.js"; 
export { registerGetCommands } from "./get-commands.js";
export { registerGetDefinition } from "./get-definition.js";
export { registerGetDiagnostics } from "./get-diagnostics.js";
export { registerGetHovers } from "./get-hover.js";
export { registerGetReferences } from "./get-references.js";
export { registerGetSignatureHelp } from "./get-signature-help.js";
export { registerHealthCheck } from "./health-check.js";
export { registerHighlightCode } from "./highlight-code.js";
export { registerListWorkspaces } from "./list-workspaces.js";
export { registerOpenDiff } from "./open-diff.js";
export { registerOpenFiles } from "./open-files.js";
export { registerRenameSymbol } from "./rename-symbol.js";
export { registerRequestInput } from "./request-input.js";