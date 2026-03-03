export interface DynamicToolDefinition {
    name: string;
    description: string;
    /** Standard JSON Schema object — no Zod dependency required for other extensions */
    inputSchema: Record<string, unknown>;
    outputSchema?: Record<string, unknown>;
    handler: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface VscodeMcpBridgeAPI {
    registerTool(tool: DynamicToolDefinition): void;
    unregisterTool(name: string): void;
}
