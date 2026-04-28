import type * as vscode from 'vscode';

/**
 * Type alias for launcher icon ids. Values are derived at runtime from
 * `package.json` `contributes.commands`, so this stays a plain string brand
 * rather than a closed string-literal union.
 */
export type LauncherIcon = string;

/** vscode `getConfiguration` section for the terminal launcher. */
export const LAUNCHER_CONFIG_SECTION = 'vscode-mcp-bridge.terminalLauncher';
/** Key under {@link LAUNCHER_CONFIG_SECTION} holding the user-defined items array. */
export const LAUNCHER_ITEMS_KEY = 'items';

/** Prefix used to identify launcher icon command ids in the manifest. */
export const ICON_COMMAND_PREFIX = `${LAUNCHER_CONFIG_SECTION}.icon.`;

/** Build the full vscode command id for a given icon. */
export function iconCommandId(icon: LauncherIcon): string {
    return `${ICON_COMMAND_PREFIX}${icon}`;
}

/** Build the `setContext` key controlling visibility of a given icon button. */
export function iconVisibleContextKey(icon: LauncherIcon): string {
    return `vscodeMcpBridge.launcher.icon.${icon}.visible`;
}

interface PackageJsonCommand {
    command?: unknown;
}

interface PackageJsonContributes {
    commands?: unknown;
}

interface ExtensionManifest {
    contributes?: PackageJsonContributes;
}

/**
 * Discover launcher icon ids from the extension manifest. The set of icons is
 * driven by `contributes.commands` entries whose id starts with
 * {@link ICON_COMMAND_PREFIX}, keeping the manifest as the single source of
 * truth (no parallel hard-coded list in TS).
 */
export function discoverLauncherIcons(extension: vscode.Extension<unknown>): LauncherIcon[] {
    const manifest = extension.packageJSON as ExtensionManifest | undefined;
    const commands = manifest?.contributes?.commands;
    if (!Array.isArray(commands)) return [];
    const icons: LauncherIcon[] = [];
    for (const entry of commands as PackageJsonCommand[]) {
        const id = entry?.command;
        if (typeof id !== 'string' || !id.startsWith(ICON_COMMAND_PREFIX)) continue;
        const icon = id.slice(ICON_COMMAND_PREFIX.length);
        if (icon.length > 0) icons.push(icon);
    }
    return icons;
}
