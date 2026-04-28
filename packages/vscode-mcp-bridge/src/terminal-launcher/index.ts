import type * as vscode from 'vscode';

import { logger } from '../logger';
import { registerIconCommands } from './commands';
import { onLauncherItemsChange, readLauncherItems } from './config';
import { discoverLauncherIcons } from './constants';
import { syncIcons } from './icon-registry';

/**
 * Wire up the terminal launcher: discover icon ids from the extension manifest,
 * register their commands, and bind user-configured items to icon buttons. The
 * binding refreshes automatically when the items config changes.
 */
export function activateTerminalLauncher(context: vscode.ExtensionContext): void {
    const icons = discoverLauncherIcons(context.extension);
    if (icons.length === 0) {
        logger.error(
            'No terminal launcher icon commands declared in package.json; skipping launcher activation.',
        );
        return;
    }
    registerIconCommands(context, context.extensionUri, icons);
    const refresh = (): void => syncIcons(readLauncherItems(icons), icons);
    refresh();
    context.subscriptions.push(onLauncherItemsChange(refresh));
}
