import type { OutputChannel } from 'vscode';
import vscode from 'vscode';

class Logger {
    channel: OutputChannel | undefined;

    constructor(private name = '', private language = 'log') {}

    private _initChannel() {
        const prefix = 'VSCode MCP Bridge';
        this.channel = vscode.window.createOutputChannel(
            `${prefix} ${this.name}`.trim(),
            this.language,
        );
    }

    private _output(message: string, level: string): void {
        const enableLog = vscode.workspace.getConfiguration().get('vscode-mcp-bridge.enableLog');
        if (!enableLog) return;

        if (this.channel === undefined) {
            this._initChannel();
        }

        this.channel!.append(`[${level}] ${message}\n`);
    }

    private _formatJson(obj: any): string {
        try {
            return JSON.stringify(obj, null, 2);
        } catch {
            return String(obj);
        }
    }

    info(message: string) {
        this._output(message, 'INFO');
    }

    error(message: string) {
        this._output(message, 'ERROR');
    }

    /**
     * Log service call with structured information
     */
    logServiceCall(method: string, payload: any, result: any) {
        const timestamp = new Date().toISOString();
        const message = [
            `[${method}] Service Call at ${timestamp}`,
            `Request: ${this._formatJson(payload)}`,
            `Response: ${this._formatJson(result)}`,
            '---'
        ].join('\n');
        
        this._output(message, 'INFO');
    }

    /**
     * Log service error with structured information
     */
    logServiceError(method: string, payload: any, error: any) {
        const timestamp = new Date().toISOString();
        const message = [
            `[${method}] Service Error at ${timestamp}`,
            `Request: ${this._formatJson(payload)}`,
            `Error: ${String(error)}`,
            '---'
        ].join('\n');
        
        this._output(message, 'ERROR');
    }

    dispose(): void {
        this.channel?.dispose();
    }
}

export const logger = new Logger();