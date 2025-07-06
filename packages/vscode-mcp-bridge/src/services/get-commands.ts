/**
 * Get VSCode commands service implementation
 */

import type { CommandInfo,GetCommandsPayload, GetCommandsResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

/**
 * Extract category from command ID
 * Examples:
 * - "editor.action.formatDocument" -> "editor"
 * - "workbench.action.files.save" -> "workbench"
 * - "git.commit" -> "git"
 * - "typescript.restartTsServer" -> "typescript"
 */
function extractCategory(commandId: string): string {
  const firstDotIndex = commandId.indexOf('.');
  if (firstDotIndex === -1) {
    return 'other';
  }
  return commandId.slice(0, Math.max(0, firstDotIndex));
}

/**
 * Categorize commands and count by category
 */
function categorizeCommands(commands: CommandInfo[]): Record<string, number> {
  const categories: Record<string, number> = {};
  
  for (const command of commands) {
    const category = command.category;
    categories[category] = (categories[category] || 0) + 1;
  }
  
  // Sort categories by count (descending)
  const sortedCategories = Object.entries(categories)
    .sort(([, a], [, b]) => b - a)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, number>);
  
  return sortedCategories;
}

/**
 * Get all available VSCode commands
 */
export async function getCommands(payload: GetCommandsPayload): Promise<GetCommandsResult> {
  try {
    // Get all commands from VSCode
    const allCommandIds = await vscode.commands.getCommands(payload.include_internal);
    
    // Convert to CommandInfo objects
    const allCommands: CommandInfo[] = allCommandIds.map(id => ({
      id,
      category: extractCategory(id)
    }));
    
    let filteredCommands = allCommands;
    
    // Apply keyword filter
    if (payload.filter) {
      const filterLower = payload.filter.toLowerCase();
      filteredCommands = filteredCommands.filter(cmd => 
        cmd.id.toLowerCase().includes(filterLower) ||
        cmd.category.toLowerCase().includes(filterLower)
      );
    }
    
    // Apply category filter
    if (payload.category) {
      const categoryLower = payload.category.toLowerCase();
      filteredCommands = filteredCommands.filter(cmd => 
        cmd.category.toLowerCase() === categoryLower
      );
    }
    
    // Apply limit
    if (payload.limit && payload.limit > 0) {
      filteredCommands = filteredCommands.slice(0, payload.limit);
    }
    
    // Generate categories statistics
    const categories = categorizeCommands(filteredCommands);
    
    return {
      commands: filteredCommands,
      total: filteredCommands.length,
      total_available: allCommands.length,
      categories,
      filtered: Boolean(payload.filter || payload.category || payload.limit)
    };
    
  } catch (error) {
    throw new Error(`Failed to get VSCode commands: ${error}`);
  }
} 