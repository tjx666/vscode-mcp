/**
 * Agent Call Types - Unified type definitions for agent calling functionality
 * Based on the architecture from stagewise project
 */

export type IDE = 'vscode' | 'cursor' | 'windsurf' | 'trae' | 'unknown';

export interface PromptRequest {
  prompt: string;
  files?: string[];
  images?: string[];
  model?: string;
  mode?: string;
  ide_type?: 'auto' | 'cursor' | 'vscode' | 'windsurf' | 'trae';
}

export interface AgentCallResult {
  success: boolean;
  message: string;
  ide_detected: string;
  command_executed?: string;
}

export interface AgentCallFunction {
  (request: PromptRequest): Promise<string>;
}

export interface AgentDetectionFunction {
  (): boolean;
}

export interface DiagnosticInjectionParams {
  prompt: string;
  callback: () => Promise<any>;
}

/**
 * Agent configuration for different IDE types
 */
export interface AgentConfig {
  name: string;
  commandId: string;
  detectFunction?: AgentDetectionFunction;
  callFunction: AgentCallFunction;
  promptPrefix?: string;
  useDiagnosticInjection?: boolean;
}

/**
 * Constants for diagnostic collection
 */
export const DIAGNOSTIC_COLLECTION_NAME = 'mcp-agent-call';

/**
 * Agent priority order for VSCode
 */
export const VSCODE_AGENT_PRIORITY = [
  'cline',
  'copilot',
  'continue',
  'roocode',
  'kilocode',
] as const;

export type VSCodeAgentType = typeof VSCODE_AGENT_PRIORITY[number]; 