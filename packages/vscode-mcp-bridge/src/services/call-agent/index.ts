/**
 * Call Agent Module
 * Unified AI agent calling functionality for VSCode, Cursor, Windsurf, and other IDEs
 */

// Main service function
export { callAgent } from './call-agent.js';

// Core dispatcher
export { dispatchAgentCall, getAgentInfo } from './agent-dispatcher.js';

// Utility functions for external use
export { 
  getAvailableVSCodeAgents,
  getPreferredVSCodeAgent,
  hasAnyVSCodeAgent,
  isClineInstalled, 
  isContinueInstalled, 
  isCopilotChatInstalled, 
  isKilocodeInstalled,
  isRoocodeInstalled} from './agent-detection.js';
export { detectIdeType,getCurrentIDE } from './ide-detection.js';

// Types
export type { 
  AgentCallFunction, 
  AgentCallResult, 
  AgentConfig,
  AgentDetectionFunction, 
  DiagnosticInjectionParams,
  IDE, 
  PromptRequest, 
  VSCodeAgentType 
} from './agent-types.js';

// Test utilities
export { testAgentDetection,testAgentSystem } from './agent-test.js'; 