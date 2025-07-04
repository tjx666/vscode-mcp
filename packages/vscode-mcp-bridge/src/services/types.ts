import type {
    BaseResponse,
    EventName,
    EventParams} from '@vscode-mcp/vscode-mcp-ipc';



// Re-export IPC types for convenience
export {
    BaseRequest,
    BaseResponse,
    EventName,
    EventParams,
    EventResult
} from '@vscode-mcp/vscode-mcp-ipc';

/**
 * Type-safe service handler function
 */
export type ServiceHandler<T extends EventName = EventName> = (
    id: string,
    params: EventParams<T>
) => Promise<BaseResponse>; 