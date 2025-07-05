// Import all event modules
import type { ExecuteCommandPayload, ExecuteCommandResult } from './execute-command.js';
import type { GetCompletionsPayload, GetCompletionsResult } from './get-completions.js';
import type { GetDefinitionPayload, GetDefinitionResult } from './get-definition.js';
import type { GetDiagnosticsPayload, GetDiagnosticsResult } from './get-diagnostics.js';
import type { GetHoverPayload, GetHoverResult } from './get-hover.js';
import type { GetReferencesPayload, GetReferencesResult } from './get-references.js';
import type { GetSignatureHelpPayload, GetSignatureHelpResult } from './get-signature-help.js';
import type { GetWorkspaceInfoPayload, GetWorkspaceInfoResult } from './get-workspace-info.js';
import type { GetWorkspaceSymbolsPayload, GetWorkspaceSymbolsResult } from './get-workspace-symbols.js';
import type { HealthCheckPayload, HealthCheckResult } from './health-check.js';
import type { OpenFilesPayload, OpenFilesResult } from './open-file.js';

// Re-export all event types and schemas
export * from './common.js';
export * from './execute-command.js';
export * from './get-completions.js';
export * from './get-definition.js';
export * from './get-diagnostics.js';
export * from './get-hover.js';
export * from './get-references.js';
export * from './get-signature-help.js';
export * from './get-workspace-info.js';
export * from './get-workspace-symbols.js';
export * from './health-check.js';
export * from './open-file.js';

/**
 * Base request structure
 */
export interface BaseRequest {
  id: string;
  method: string;
  params?: Record<string, any>;
}

/**
 * Base response structure
 */
export interface BaseResponse {
  id: string;
  result?: any;
  error?: {
    code: number;
    message: string;
    details?: string;
  };
}

/**
 * Event definitions for MCP Server -> VSCode Extension communication
 */
export interface EventMap {
  /** Health check */
  health: {
    params: HealthCheckPayload;
    result: HealthCheckResult;
  };

  /** LSP Methods */
  getDiagnostics: {
    params: GetDiagnosticsPayload;
    result: GetDiagnosticsResult;
  };

  getDefinition: {
    params: GetDefinitionPayload;
    result: GetDefinitionResult;
  };

  getReferences: {
    params: GetReferencesPayload;
    result: GetReferencesResult;
  };

  getHover: {
    params: GetHoverPayload;
    result: GetHoverResult;
  };

  getCompletions: {
    params: GetCompletionsPayload;
    result: GetCompletionsResult;
  };

  getSignatureHelp: {
    params: GetSignatureHelpPayload;
    result: GetSignatureHelpResult;
  };

  getWorkspaceSymbols: {
    params: GetWorkspaceSymbolsPayload;
    result: GetWorkspaceSymbolsResult;
  };

  getWorkspaceInfo: {
    params: GetWorkspaceInfoPayload;
    result: GetWorkspaceInfoResult;
  };

  /** Execute VSCode command */
  executeCommand: {
    params: ExecuteCommandPayload;
    result: ExecuteCommandResult;
  };

  /** Open files */
  openFiles: {
    params: OpenFilesPayload;
    result: OpenFilesResult;
  };
}

/**
 * Event names type
 */
export type EventName = keyof EventMap;

/**
 * Event parameters type
 */
export type EventParams<T extends EventName> = EventMap[T]['params'];

/**
 * Event result type
 */
export type EventResult<T extends EventName> = EventMap[T]['result']; 