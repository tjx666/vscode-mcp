import { strictEqual } from 'node:assert';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { test } from 'node:test';

import type { BaseRequest, BaseResponse } from '../src/index.js';
import { EventDispatcher, getSocketPath } from '../src/index.js';

test('EventDispatcher waits for split JSON response chunks', async (t) => {
  const workspacePath = await mkdtemp(join(tmpdir(), 'vscode-mcp-dispatch-'));
  const socketPath = getSocketPath(workspacePath);

  if (process.platform !== 'win32') {
    await mkdir(dirname(socketPath), { recursive: true });
    await rm(socketPath, { force: true });
  }

  const server = createServer((socket) => {
    let requestBuffer = '';

    socket.on('data', (data) => {
      requestBuffer += data.toString();
      const newlineIndex = requestBuffer.indexOf('\n');
      if (newlineIndex === -1) {
        return;
      }

      const request: BaseRequest = JSON.parse(requestBuffer.slice(0, newlineIndex));
      const response: BaseResponse = {
        id: request.id,
        result: {
          extension_version: '1.0.0',
          status: 'ok',
          timestamp: '2026-06-14T00:00:00.000Z',
          workspace: 'x'.repeat(12_000),
        },
      };
      const payload = JSON.stringify(response);

      socket.write(payload.slice(0, 8192));
      setTimeout(() => {
        socket.write(payload.slice(8192));
      }, 0);
    });
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(socketPath, resolve);
  });

  t.after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });

    if (process.platform !== 'win32') {
      await rm(socketPath, { force: true });
    }
    await rm(workspacePath, { recursive: true, force: true });
  });

  const dispatcher = new EventDispatcher(workspacePath, 1000);
  const result = await dispatcher.dispatch('health', {});

  strictEqual(result.status, 'ok');
  strictEqual(result.workspace?.length, 12_000);
});
