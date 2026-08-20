import assert from 'node:assert/strict';

import { createApp } from '../server/app.js';

async function runServerTest(name, fn) {
  try {
    await fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

function listen(app) {
  return new Promise(resolve => {
    const server = app.listen(0, '127.0.0.1', () => {
      resolve(server);
    });
  });
}

async function request(path) {
  const server = await listen(createApp());
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}${path}`);

    return {
      status: response.status,
      body: await response.json()
    };
  } finally {
    server.close();
  }
}

await runServerTest('server exposes API health route', async () => {
  const response = await request('/api/health');

  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
  assert.equal(response.body.service, 'pfm-api');
  assert.equal(response.body.database, 'not-configured');
});

await runServerTest('server returns JSON 404 for missing API routes', async () => {
  const response = await request('/api/missing');

  assert.equal(response.status, 404);
  assert.equal(response.body.error, 'Not found');
});
