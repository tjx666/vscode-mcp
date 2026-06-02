import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { runTests } from '@vscode/test-electron';

(async function go() {
    const projectPath = resolve(__dirname, '../../');
    const extensionDevelopmentPath = projectPath;
    const extensionTestsPath = resolve(projectPath, './out/test');
    const testWorkspace = resolve(projectPath, './test-workspace');

    // VSCode creates a Unix socket under --user-data-dir. macOS limits socket
    // paths to ~103 chars, and the default `.vscode-test/user-data/` overflows
    // on GitHub Actions (path is already ~80 chars deep). Stash it under tmp.
    const userDataDir = mkdtempSync(join(tmpdir(), 'vsc-bridge-'));

    await runTests({
        version: 'insiders',
        extensionDevelopmentPath,
        extensionTestsPath,
        launchArgs: ['--disable-extensions', `--user-data-dir=${userDataDir}`, testWorkspace],
    });
})();
