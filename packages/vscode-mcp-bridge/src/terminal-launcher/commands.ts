import * as vscode from 'vscode';

import { logger } from '../logger';
import { type LauncherIcon, iconCommandId } from './constants';
import { getIconItem } from './icon-registry';
import { launchTerminal } from './runner';

/**
 * Register one vscode command per discovered launcher icon. Each command looks
 * up its currently-bound item and creates a terminal for it; command ids must
 * already be declared in `package.json`.
 */
export function registerIconCommands(
    context: vscode.ExtensionContext,
    extensionUri: vscode.Uri,
    icons: readonly LauncherIcon[],
): void {
    for (const icon of icons) {
        const disposable = vscode.commands.registerCommand(iconCommandId(icon), () => {
            const item = getIconItem(icon);
            if (!item) {
                // Defensive: button visibility is gated by setContext, so this branch
                // should be unreachable. Log to surface any context/state desync.
                logger.error(
                    `Launcher icon "${icon}" command invoked but no item is bound; this indicates a context/state mismatch.`,
                );
                return;
            }
            launchTerminal(icon, item, extensionUri);
        });
        context.subscriptions.push(disposable);
    }
}
