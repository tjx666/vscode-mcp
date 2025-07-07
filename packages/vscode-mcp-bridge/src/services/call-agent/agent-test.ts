import { getAvailableVSCodeAgents, getPreferredVSCodeAgent } from './agent-detection.js';
import { getAgentInfo } from './agent-dispatcher.js';
import { getCurrentIDE } from './ide-detection.js';

/**
 * Simple test function to validate agent call functionality
 */
export function testAgentSystem(): void {
  console.log('🔍 Testing Agent Call System...\n');

  // Test IDE detection
  console.log('1. IDE Detection:');
  const currentIDE = getCurrentIDE();
  console.log(`   Current IDE: ${currentIDE}`);

  // Test agent detection for VSCode
  if (currentIDE === 'vscode') {
    console.log('\n2. VSCode Agent Detection:');
    const availableAgents = getAvailableVSCodeAgents();
    const preferredAgent = getPreferredVSCodeAgent();
    
    console.log(`   Available agents: [${availableAgents.join(', ')}]`);
    console.log(`   Preferred agent: ${preferredAgent || 'none'}`);
  }

  // Test agent info
  console.log('\n3. Agent System Info:');
  const agentInfo = getAgentInfo();
  console.log(`   Current IDE: ${agentInfo.currentIDE}`);
  console.log(`   Has any agent: ${agentInfo.hasAnyAgent}`);
  console.log(`   Preferred agent: ${agentInfo.preferredAgent || 'none'}`);
  console.log(`   Available agents: [${agentInfo.availableAgents.join(', ')}]`);

  console.log('\n✅ Agent system test completed!');
}

/**
 * Test specific agent detection functions
 */
export async function testAgentDetection(): Promise<void> {
  const { 
    isClineInstalled, 
    isCopilotChatInstalled, 
    isContinueInstalled, 
    isRoocodeInstalled, 
    isKilocodeInstalled 
  } = await import('./agent-detection.js');

  console.log('🔍 Testing Agent Detection Functions...\n');

  console.log('Agent Installation Status:');
  console.log(`   Cline: ${isClineInstalled()}`);
  console.log(`   Copilot Chat: ${isCopilotChatInstalled()}`);
  console.log(`   Continue: ${isContinueInstalled()}`);
  console.log(`   Roocode: ${isRoocodeInstalled()}`);
  console.log(`   Kilocode: ${isKilocodeInstalled()}`);

  console.log('\n✅ Agent detection test completed!');
} 