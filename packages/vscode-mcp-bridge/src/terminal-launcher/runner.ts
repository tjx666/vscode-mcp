import * as vscode from 'vscode';

import type { LauncherItem } from './config';
import type { LauncherIcon } from './constants';

/**
 * Create a new vscode terminal for a launcher item, set its tab icon to the
 * bundled SVG for `icon`, and run the item's command if one is configured.
 */
export function launchTerminal(
    icon: LauncherIcon,
    item: LauncherItem,
    extensionUri: vscode.Uri,
): void {
    const terminal = vscode.window.createTerminal({
        name: item.label,
        iconPath: vscode.Uri.joinPath(extensionUri, 'resources', 'launcher-icons', `${icon}.svg`),
        color: item.color ? new vscode.ThemeColor(item.color) : undefined,
    });
    terminal.show();
    if (item.command) {
        terminal.sendText(item.command);
    }
}
