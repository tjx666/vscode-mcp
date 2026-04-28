import * as vscode from 'vscode';

import { logger } from '../logger';
import type { LauncherItem } from './config';
import { type LauncherIcon, iconVisibleContextKey } from './constants';

const iconMap = new Map<LauncherIcon, LauncherItem>();

/**
 * Bind launcher items to icon slots and toggle each slot's visibility context.
 * First-wins on duplicate icons (a given button can only trigger one command).
 *
 * @param items - validated launcher items from user config
 * @param icons - the full set of manifest-declared icons (used to clear stale
 *   visibility state for icons no longer bound)
 */
export function syncIcons(items: LauncherItem[], icons: readonly LauncherIcon[]): void {
    iconMap.clear();
    for (const item of items) {
        if (!iconMap.has(item.icon)) {
            iconMap.set(item.icon, item);
        } else {
            const existing = iconMap.get(item.icon);
            logger.error(
                `Duplicate terminalLauncher icon "${item.icon}": keeping "${existing?.label}", ignoring "${item.label}".`,
            );
        }
    }
    for (const icon of icons) {
        void vscode.commands.executeCommand(
            'setContext',
            iconVisibleContextKey(icon),
            iconMap.has(icon),
        );
    }
}

/** Look up the launcher item currently bound to an icon, if any. */
export function getIconItem(icon: LauncherIcon): LauncherItem | undefined {
    return iconMap.get(icon);
}
