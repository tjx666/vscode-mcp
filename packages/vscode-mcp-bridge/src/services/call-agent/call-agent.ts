import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';

import { dispatchAgentCall } from './agent-dispatcher.js';

/**
 * Main callAgent service implementation using the new dispatcher
 */
export const callAgent = async (
  payload: EventParams<'callAgent'>,
): Promise<EventResult<'callAgent'>> => {
  return await dispatchAgentCall(payload);
}; 