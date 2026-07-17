/**
 * MBA-49 — AC-D01 dev-api Bearer auth middleware (subprocess isolation for env).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';

const devApiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function runAuthMiddleware({ requireToken, devToken, authorization }) {
  const script = `
    process.env.REQUIRE_API_TOKEN = ${JSON.stringify(requireToken ?? '')};
    process.env.DEV_API_TOKEN = ${JSON.stringify(devToken ?? '')};
    const { requireDevApiAuth } = await import('./src/middleware/auth.js');
    let statusCode = 200;
    let body = null;
    let nextCalled = false;
    const req = { headers: { authorization: ${JSON.stringify(authorization ?? '')} } };
    const res = {
      status(code) { statusCode = code; return this; },
      json(payload) { body = payload; return this; },
    };
    requireDevApiAuth(req, res, () => { nextCalled = true; });
    console.log(JSON.stringify({ statusCode, body, nextCalled }));
  `;

  const result = spawnSync('node', ['--input-type=module', '-e', script], {
    cwd: devApiRoot,
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || 'auth middleware subprocess failed');
  }

  return JSON.parse(result.stdout.trim());
}

test('requireDevApiAuth skips when REQUIRE_API_TOKEN is not true', () => {
  const outcome = runAuthMiddleware({
    requireToken: 'false',
    devToken: 'secret',
    authorization: '',
  });

  assert.equal(outcome.nextCalled, true);
  assert.equal(outcome.statusCode, 200);
});

test('requireDevApiAuth returns 401 when token missing and auth required', () => {
  const outcome = runAuthMiddleware({
    requireToken: 'true',
    devToken: 'dev-secret-token',
    authorization: '',
  });

  assert.equal(outcome.nextCalled, false);
  assert.equal(outcome.statusCode, 401);
  assert.deepEqual(outcome.body, { message: 'Unauthenticated.' });
});

test('requireDevApiAuth returns 401 for invalid bearer token', () => {
  const outcome = runAuthMiddleware({
    requireToken: 'true',
    devToken: 'dev-secret-token',
    authorization: 'Bearer wrong-token',
  });

  assert.equal(outcome.nextCalled, false);
  assert.equal(outcome.statusCode, 401);
});

test('requireDevApiAuth allows valid bearer token', () => {
  const outcome = runAuthMiddleware({
    requireToken: 'true',
    devToken: 'dev-secret-token',
    authorization: 'Bearer dev-secret-token',
  });

  assert.equal(outcome.nextCalled, true);
  assert.equal(outcome.statusCode, 200);
});
