import { strictEqual } from 'node:assert';

import vscode from 'vscode';

describe('#test sample', () => {
    before(() => {
        vscode.window.showInformationMessage('Test begin!');
    });

    it('one plus one equals two', () => {
        strictEqual(2, 1 + 1);
    });

    after(() => {
        vscode.window.showInformationMessage('Test end!');
    });
});
