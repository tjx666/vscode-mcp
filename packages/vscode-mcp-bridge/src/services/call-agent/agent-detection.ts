import * as vscode from 'vscode';

import type {VSCodeAgentType} from './agent-types.js';
import { VSCODE_AGENT_PRIORITY  } from './agent-types.js';

/**
 * Check if Cline extension is installed
 */
export function isClineInstalled(): boolean {
  return vscode.extensions.getExtension('saoudrizwan.claude-dev') !== undefined;
}

/**
 * Check if GitHub Copilot Chat extension is installed
 */
export function isCopilotChatInstalled(): boolean {
  return vscode.extensions.getExtension('GitHub.copilot-chat') !== undefined ||
         vscode.extensions.getExtension('GitHub.copilot') !== undefined;
}

/**
 * Check if Continue extension is installed
 */
export function isContinueInstalled(): boolean {
  return vscode.extensions.getExtension('Continue.continue') !== undefined;
}

/**
 * Check if Roocode extension is installed
 */
export function isRoocodeInstalled(): boolean {
  return vscode.extensions.getExtension('RooVeterinaryInc.roocode') !== undefined;
}

/**
 * Check if Kilocode extension is installed
 */
export function isKilocodeInstalled(): boolean {
  return vscode.extensions.getExtension('kilocode.kilocode') !== undefined;
}

/**
 * Check if a specific agent type is installed
 */
export function isAgentInstalled(agentType: VSCodeAgentType): boolean {
  switch (agentType) {
    case 'cline':
      return isClineInstalled();
    case 'copilot':
      return isCopilotChatInstalled();
    case 'continue':
      return isContinueInstalled();
    case 'roocode':
      return isRoocodeInstalled();
    case 'kilocode':
      return isKilocodeInstalled();
    default:
      return false;
  }
}

/**
 * Get all available VSCode AI agents in priority order
 */
export function getAvailableVSCodeAgents(): VSCodeAgentType[] {
  return VSCODE_AGENT_PRIORITY.filter(agentType => isAgentInstalled(agentType));
}

/**
 * Get the highest priority available agent for VSCode
 */
export function getPreferredVSCodeAgent(): VSCodeAgentType | null {
  const availableAgents = getAvailableVSCodeAgents();
  return availableAgents.length > 0 ? availableAgents[0] : null;
}

/**
 * Check if any AI agent is available for VSCode
 */
export function hasAnyVSCodeAgent(): boolean {
  return getAvailableVSCodeAgents().length > 0;
} 