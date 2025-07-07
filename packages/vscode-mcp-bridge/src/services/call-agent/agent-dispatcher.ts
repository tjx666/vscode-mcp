import * as vscode from 'vscode';

import { 
  callClineAgent, 
  callContinueAgent, 
  callCopilotAgent, 
  callCursorAgent, 
  callKilocodeAgent, 
  callRoocodeAgent, 
  callTraeAgent, 
  callWindsurfAgent} from './agent-callers.js';
import { 
  getAvailableVSCodeAgents,
  getPreferredVSCodeAgent,
  hasAnyVSCodeAgent} from './agent-detection.js';
import type { AgentCallResult,PromptRequest, VSCodeAgentType } from './agent-types.js';
import { getCurrentIDE } from './ide-detection.js';

/**
 * Main agent dispatcher function
 * Routes requests to appropriate agent based on IDE type and available extensions
 */
export async function dispatchAgentCall(request: PromptRequest): Promise<AgentCallResult> {
  try {
    const ide = getCurrentIDE();
    
    // Use forced IDE type if specified
    const targetIde = request.ide_type && request.ide_type !== 'auto' 
      ? request.ide_type 
      : ide;
    
    let executedCommand: string;
    
    switch (targetIde) {
      case 'trae':
        executedCommand = await callTraeAgent(request);
        break;
        
      case 'cursor':
        executedCommand = await callCursorAgent(request);
        break;
        
      case 'windsurf':
        executedCommand = await callWindsurfAgent(request);
        break;
        
      case 'vscode':
        executedCommand = await dispatchVSCodeAgent(request);
        break;
        
      default:
        // For unknown IDEs, try VSCode approach as fallback
        executedCommand = await dispatchVSCodeAgent(request);
        break;
    }
    
    return {
      success: true,
      message: `Successfully called ${targetIde} agent`,
      ide_detected: targetIde,
      command_executed: executedCommand,
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Failed to call agent: ${error}`,
      ide_detected: 'unknown',
    };
  }
}

/**
 * Call the appropriate agent function based on agent type
 */
async function callAgentByType(agentType: VSCodeAgentType, request: PromptRequest): Promise<string> {
  switch (agentType) {
    case 'cline':
      return await callClineAgent(request);
    case 'roocode':
      return await callRoocodeAgent(request);
    case 'kilocode':
      return await callKilocodeAgent(request);
    case 'copilot':
      return await callCopilotAgent(request);
    case 'continue':
      return await callContinueAgent(request);
    default:
      throw new Error(`Unknown agent type: ${agentType}`);
  }
}

/**
 * Dispatch logic specifically for VSCode with multiple agent support
 */
async function dispatchVSCodeAgent(request: PromptRequest): Promise<string> {
  // Get the highest priority available agent
  const preferredAgent = getPreferredVSCodeAgent();
  
  if (preferredAgent) {
    return await callAgentByType(preferredAgent, request);
  }
  
  // No supported agent found
  await showAgentInstallationGuidance();
  return 'workbench.view.extensions';
}

/**
 * Show guidance for installing AI agents
 */
async function showAgentInstallationGuidance(): Promise<void> {
  const message = 'Currently, only Copilot Chat, Cline, Roo Code, Continue, and Kilo Code are supported for VSCode. Please install one of them from the marketplace to use agent calling.';
  
  const selection = await vscode.window.showErrorMessage(
    message,
    'Open Extensions',
    'Learn More'
  );
  
  if (selection === 'Open Extensions') {
    await vscode.commands.executeCommand('workbench.view.extensions');
  } else if (selection === 'Learn More') {
    await vscode.env.openExternal(vscode.Uri.parse('https://marketplace.visualstudio.com/search?term=AI%20assistant&target=VSCode'));
  }
}

/**
 * Get information about available agents
 */
export function getAgentInfo(): {
  currentIDE: string;
  hasAnyAgent: boolean;
  preferredAgent: string | null;
  availableAgents: string[];
} {
  const ide = getCurrentIDE();
  
  if (ide === 'vscode') {
    const preferredAgent = getPreferredVSCodeAgent();
    const availableAgents = getAvailableVSCodeAgents();
    
    return {
      currentIDE: ide,
      hasAnyAgent: hasAnyVSCodeAgent(),
      preferredAgent,
      availableAgents,
    };
  }
  
  // For other IDEs, assume they have built-in agents
  return {
    currentIDE: ide,
    hasAnyAgent: true,
    preferredAgent: ide,
    availableAgents: [ide],
  };
} 