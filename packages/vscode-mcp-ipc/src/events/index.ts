// Import all event modules
import type { CallAgentPayload, CallAgentResult } from './call-agent.js';
import type { ExecuteCommandPayload, ExecuteCommandResult } from './execute-command.js';
import type { GetCommandsPayload, GetCommandsResult } from './get-commands.js';
import type { GetDiagnosticsPayload, GetDiagnosticsResult } from './get-diagnostics.js';
import type { GetReferencesPayload, GetReferencesResult } from './get-references.js';
import type { GetSymbolLSPInfoPayload, GetSymbolLSPInfoResult } from './get-symbol-lsp-info.js';
import type { HealthCheckPayload, HealthCheckResult } from './health-check.js';
import type { HighlightCodePayload, HighlightCodeResult } from './highlight-code.js';
import type { ListWorkspacesPayload, ListWorkspacesResult } from './list-workspaces.js';
import type { OpenDiffPayload, OpenDiffResult } from './open-diff.js';
import type { OpenFilesPayload, OpenFilesResult } from './open-file.js';
import type { RenameSymbolPayload, RenameSymbolResult } from './rename-symbol.js';

// Re-export all event types and schemas
export * from './call-agent.js';
export * from './common.js';
export * from './execute-command.js';
export * from './get-commands.js';
export * from './get-diagnostics.js';
export * from './get-references.js';
export * from './get-symbol-lsp-info.js';
export * from './health-check.js';
export * from './highlight-code.js';
export * from './list-workspaces.js';
export * from './open-diff.js';
export * from './open-file.js';
export * from './rename-symbol.js';

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
  /** Call IDE agent with prompt */
  callAgent: {
    params: CallAgentPayload;
    result: CallAgentResult;
  };

  /** Health check */
  health: {
    params: HealthCheckPayload;
    result: HealthCheckResult;
  };

  /** Highlight code ranges */
  highlightCode: {
    params: HighlightCodePayload;
    result: HighlightCodeResult;
  };

  /** LSP Methods */
  getDiagnostics: {
    params: GetDiagnosticsPayload;
    result: GetDiagnosticsResult;
  };

  getSymbolLSPInfo: {
    params: GetSymbolLSPInfoPayload;
    result: GetSymbolLSPInfoResult;
  };

  getReferences: {
    params: GetReferencesPayload;
    result: GetReferencesResult;
  };

  /** Get VSCode commands */
  getCommands: {
    params: GetCommandsPayload;
    result: GetCommandsResult;
  };

  /** Execute VSCode command */
  executeCommand: {
    params: ExecuteCommandPayload;
    result: ExecuteCommandResult;
  };

  /** Open diff editor */
  openDiff: {
    params: OpenDiffPayload;
    result: OpenDiffResult;
  };

  /** Open files */
  openFiles: {
    params: OpenFilesPayload;
    result: OpenFilesResult;
  };

  /** Rename symbol */
  renameSymbol: {
    params: RenameSymbolPayload;
    result: RenameSymbolResult;
  };


  /** List available workspaces */
  listWorkspaces: {
    params: ListWorkspacesPayload;
    result: ListWorkspacesResult;
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