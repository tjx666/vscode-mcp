import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Handle request input from user
 */
export const requestInput = async (
  payload: EventParams<'requestInput'>
): Promise<EventResult<'requestInput'>> => {
  try {
    const { prompt, placeholder, title, password = false, validateInput = false } = payload;

    const inputBoxOptions: vscode.InputBoxOptions = {
      prompt,
      placeHolder: placeholder,
      title,
      password,
      validateInput: validateInput ? (value: string) => {
        return value.trim() === '' ? 'Input cannot be empty' : undefined;
      } : undefined,
    };

    const userInput = await vscode.window.showInputBox(inputBoxOptions);

    return {
      userInput,
      cancelled: userInput === undefined,
    };
  } catch (error) {
    throw new Error(`Failed to request user input: ${error}`);
  }
}; 