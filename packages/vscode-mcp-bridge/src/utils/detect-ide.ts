import * as vscode from 'vscode';

export type IDE = 'vscode' | 'cursor' | 'windsurf' | 'trae' | 'unknown';


/**
 * Get the current IDE type based on environment detection
 * Based on stagewise project implementation
 */
export function getCurrentIDE(): IDE {
  const appName = vscode.env.appName.toLowerCase();
  
  if (appName.includes('windsurf')) {
    return 'windsurf';
  } else if (appName.includes('cursor')) {
    return 'cursor';
  } else if (appName.includes('trae')) {
    return 'trae';
  } else if (appName.includes('visual studio code')) {
    return 'vscode';
  }
  
  return 'unknown';
}

/**
 * Detect IDE type asynchronously with additional command checking
 */
export async function detectIdeType(): Promise<IDE> {
  try {
    // First try direct environment detection
    const directDetection = getCurrentIDE();
    if (directDetection !== 'unknown') {
      return directDetection;
    }

    // Fallback to command-based detection
    const commands = await vscode.commands.getCommands();
    
    // Check for Cursor-specific commands
    if (commands.some(cmd => cmd.includes('composer'))) {
      return 'cursor';
    }

    // Check for Windsurf-specific commands
    if (commands.some(cmd => cmd.includes('windsurf'))) {
      return 'windsurf';
    }

    // Check for Trae-specific commands
    if (commands.some(cmd => cmd.includes('icube'))) {
      return 'trae';
    }

    // Default to vscode if we can't detect anything specific
    return 'vscode';
  } catch (error) {
    console.warn('Failed to detect IDE type:', error);
    return 'vscode';
  }
} 