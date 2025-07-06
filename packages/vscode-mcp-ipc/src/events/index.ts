// Import all event modules
import type { ExecuteCommandPayload, ExecuteCommandResult } from './execute-command.js';
import type { GetCommandsPayload, GetCommandsResult } from './get-commands.js';
import type { GetDefinitionPayload, GetDefinitionResult } from './get-definition.js';
import type { GetDiagnosticsPayload, GetDiagnosticsResult } from './get-diagnostics.js';
import type { GetHoverPayload, GetHoverResult } from './get-hover.js';
import type { GetReferencesPayload, GetReferencesResult } from './get-references.js';
import type { GetSignatureHelpPayload, GetSignatureHelpResult } from './get-signature-help.js';
import type { HealthCheckPayload, HealthCheckResult } from './health-check.js';
import type { HighlightCodePayload, HighlightCodeResult } from './highlight-code.js';
import type { OpenDiffPayload, OpenDiffResult } from './open-diff.js';
import type { OpenFilesPayload, OpenFilesResult } from './open-file.js';
import type { RenameSymbolPayload, RenameSymbolResult } from './rename-symbol.js';
import type { RequestInputPayload, RequestInputResult } from './request-input.js';

// Re-export all event types and schemas
export * from './common.js';
export * from './execute-command.js';
export * from './get-commands.js';
export * from './get-definition.js';
export * from './get-diagnostics.js';
export * from './get-hover.js';
export * from './get-references.js';
export * from './get-signature-help.js';
export * from './health-check.js';
export * from './highlight-code.js';
export * from './open-diff.js';
export * from './open-file.js';
export * from './rename-symbol.js';
export * from './request-input.js';

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

  getSignatureHelp: {
    params: GetSignatureHelpPayload;
    result: GetSignatureHelpResult;
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

  /** Request user input */
  requestInput: {
    params: RequestInputPayload;
    result: RequestInputResult;
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