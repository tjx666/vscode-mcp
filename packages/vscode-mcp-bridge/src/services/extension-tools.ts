import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';

import type { DynamicToolDefinition } from '../extension-api';
import { logger } from '../logger';

export function createListExtensionTools(dynamicTools: Map<string, DynamicToolDefinition>) {
    return async (_payload: EventParams<'listExtensionTools'>): Promise<EventResult<'listExtensionTools'>> => {
        const tools = Array.from(dynamicTools.values()).map(({ name, description, inputSchema, outputSchema }) => ({
            name,
            description,
            inputSchema,
            ...(outputSchema && { outputSchema }),
        }));
        logger.info(`listExtensionTools → returning ${tools.length} tool(s)${tools.length > 0 ? `: ${  tools.map(t => t.name).join(', ')}` : ''}`);
        return { tools };
    };
}

export function createCallExtensionTool(dynamicTools: Map<string, DynamicToolDefinition>) {
    return async (payload: EventParams<'callExtensionTool'>): Promise<EventResult<'callExtensionTool'>> => {
        const tool = dynamicTools.get(payload.name);
        if (!tool) {
            logger.error(`callExtensionTool: unknown tool "${payload.name}"`);
            throw new Error(`Unknown extension tool: "${payload.name}"`);
        }
        const result = await tool.handler(payload.input);
        return { result };
    };
}
