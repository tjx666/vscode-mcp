import * as vscode from 'vscode';
import { z } from 'zod';

import { logger } from '../logger';
import {
    LAUNCHER_CONFIG_SECTION,
    LAUNCHER_ITEMS_KEY,
    type LauncherIcon,
} from './constants';

const BaseLauncherItemShape = {
    label: z.string().min(1),
    command: z.string().default(''),
    color: z.string().optional(),
};

/**
 * Build a zod schema for a single launcher item, restricting `icon` to the
 * runtime-discovered set of manifest-declared icons. Done as a factory because
 * the icon list is only known after the extension activates.
 */
export function createLauncherItemSchema(icons: readonly LauncherIcon[]): z.ZodType<LauncherItem> {
    const iconSchema =
        icons.length > 0
            ? z.enum([icons[0], ...icons.slice(1)] as [string, ...string[]])
            : z.never();
    return z
        .object({
            ...BaseLauncherItemShape,
            icon: iconSchema,
        })
        .strict() as z.ZodType<LauncherItem>;
}

/** A validated terminal launcher entry resolved from user config. */
export interface LauncherItem {
    /** Display name shown on the terminal tab and as the button tooltip. */
    label: string;
    /** Manifest-declared icon id this entry binds to. */
    icon: LauncherIcon;
    /** Shell command sent to the terminal after creation; empty string opens a plain shell. */
    command: string;
    /** Optional theme color id applied to the terminal tab icon. */
    color?: string;
}

/**
 * Read and validate `vscode-mcp-bridge.terminalLauncher.items` against the set
 * of available icons. Per-entry validation: a single bad item is logged and
 * skipped, and the rest are kept.
 */
export function readLauncherItems(icons: readonly LauncherIcon[]): LauncherItem[] {
    const raw = vscode.workspace
        .getConfiguration(LAUNCHER_CONFIG_SECTION)
        .get<unknown>(LAUNCHER_ITEMS_KEY, []);
    if (!Array.isArray(raw)) {
        logger.error(
            `Invalid terminalLauncher.items config: expected array, got ${typeof raw}`,
        );
        return [];
    }
    const schema = createLauncherItemSchema(icons);
    const items: LauncherItem[] = [];
    for (const [index, entry] of raw.entries()) {
        const parsed = schema.safeParse(entry);
        if (parsed.success) {
            items.push(parsed.data);
        } else {
            logger.error(
                `Invalid terminalLauncher.items[${index}] config: ${parsed.error.message}`,
            );
        }
    }
    return items;
}

/** Subscribe to changes of the launcher items config key. */
export function onLauncherItemsChange(listener: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(`${LAUNCHER_CONFIG_SECTION}.${LAUNCHER_ITEMS_KEY}`)) {
            listener();
        }
    });
}
