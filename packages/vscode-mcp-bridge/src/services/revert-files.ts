import type { EventParams, EventResult } from '@vscode-mcp/vscode-mcp-ipc';
import * as vscode from 'vscode';

import { resolveFilePath } from '../utils/workspace.js';

const POLL_INTERVAL_MS = 250;
const POLL_TIMEOUT_MS = 15_000;

/**
 * Snapshot the current diagnostic counts for a set of URIs.
 */
function snapshotDiagnostics(uris: vscode.Uri[]): Map<string, number> {
    const snap = new Map<string, number>();
    for (const uri of uris) {
        const diags = vscode.languages.getDiagnostics(uri);
        snap.set(uri.toString(), diags.length);
    }
    return snap;
}

/**
 * Wait for diagnostics to change from a baseline snapshot.
 *
 * Polls `vscode.languages.getDiagnostics` at short intervals until
 * the diagnostic counts differ from the baseline or the timeout is hit.
 * No event subscription needed — immune to race conditions.
 */
function waitForDiagnosticsToChange(
    uris: vscode.Uri[],
    baseline: Map<string, number>,
): Promise<void> {
    return new Promise((resolve) => {
        const deadline = Date.now() + POLL_TIMEOUT_MS;

        const check = () => {
            const current = snapshotDiagnostics(uris);
            for (const [key, count] of current) {
                if (count !== baseline.get(key)) {
                    resolve();
                    return;
                }
            }
            if (Date.now() >= deadline) {
                resolve();
                return;
            }
            setTimeout(check, POLL_INTERVAL_MS);
        };

        // First check after a short delay to let the language server start
        setTimeout(check, POLL_INTERVAL_MS);
    });
}

/**
 * Revert a single file buffer from disk.
 * Returns whether the buffer actually changed.
 */
async function revertOne(filePath: string): Promise<{
    filePath: string;
    success: boolean;
    changed: boolean;
    message?: string;
}> {
    try {
        const uri = resolveFilePath(filePath);
        const diskBytes = await vscode.workspace.fs.readFile(uri);
        const diskText = new TextDecoder().decode(diskBytes);

        const document = await vscode.workspace.openTextDocument(uri);
        const bufferText = document.getText();

        if (bufferText === diskText) {
            // Buffer matches disk, but the language server may not have
            // reprocessed yet (file watcher beat our call). Force a
            // didChange by inserting then removing a character.
            const endPos = document.positionAt(bufferText.length);
            const bump = new vscode.WorkspaceEdit();
            bump.insert(uri, endPos, ' ');
            await vscode.workspace.applyEdit(bump);

            const reDoc = await vscode.workspace.openTextDocument(uri);
            const restore = new vscode.WorkspaceEdit();
            restore.replace(
                uri,
                new vscode.Range(reDoc.positionAt(0), reDoc.positionAt(reDoc.getText().length)),
                diskText,
            );
            await vscode.workspace.applyEdit(restore);
            await reDoc.save();

            return { filePath, success: true, changed: true, message: 'Forced refresh' };
        }

        const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(bufferText.length),
        );
        const edit = new vscode.WorkspaceEdit();
        edit.replace(uri, fullRange, diskText);
        const applied = await vscode.workspace.applyEdit(edit);

        if (!applied) {
            return { filePath, success: false, changed: false, message: 'WorkspaceEdit failed to apply' };
        }

        await document.save();
        return { filePath, success: true, changed: true, message: 'Reverted from disk' };
    } catch (error) {
        return { filePath, success: false, changed: false, message: `Failed to revert: ${String(error)}` };
    }
}

/**
 * Revert file buffers from disk without showing them in the editor.
 *
 * When files are modified externally (e.g. by CLI tools like Claude Code),
 * VS Code's in-memory buffers become stale. Language servers (rust-analyzer,
 * typescript, etc.) use these buffers, so diagnostics won't update until
 * the buffers are synced.
 *
 * When `waitForDiagnostics` is true, the method subscribes to
 * `onDidChangeDiagnostics` *before* reverting, then waits for diagnostics
 * to settle (debounced) before returning. This eliminates the need for
 * arbitrary sleep delays on the caller side.
 */
export const revertFiles = async (
    payload: EventParams<'revertFiles'>
): Promise<EventResult<'revertFiles'>> => {
    const targetUris = payload.files.map((f) => resolveFilePath(f));
    const shouldWait = payload.waitForDiagnostics ?? false;

    // Snapshot diagnostics BEFORE reverting
    const baseline = shouldWait ? snapshotDiagnostics(targetUris) : undefined;

    const results = await Promise.all(
        payload.files.map(async (filePath) => {
            const r = await revertOne(filePath);
            return { filePath: r.filePath, success: r.success, message: r.message };
        })
    );

    // Poll until diagnostics change from the baseline
    if (baseline) {
        await waitForDiagnosticsToChange(targetUris, baseline);
    }

    return { results };
};
