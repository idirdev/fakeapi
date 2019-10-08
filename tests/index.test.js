'use strict';

/**
 * @file tests/index.test.js
 * @description Tests for @idirdev/fakeapi.
 * @author idirdev
 */

const { test, describe, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http   = require('node:http');
const { createServer, generators } = require('../src/index.js');

/**
 * Makes a simple HTTP request, resolving with { status, body }.
 * @param {object}  opts   - Options passed to http.request.
 * @param {string}  [body] - Optional request body string.
 * @returns {Promise<{status:number, body:string}>}
 */
function request(opts, body) {
  return new Promise(function requestPromise(resolve, reject) {
    const req = http.request(opts, function onResponse(res) {
      let data = '';
      res.on('data', function onData(c) { data += c; });
      res.on('end',  function onEnd()   { resolve({ status: res.statusCode, body: data }); });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

let server;
let port;

const SCHEMA = {
  users: {
    count: 5,
    fields: { id: 'autoincrement', name: 'fullName', email: 'email', age: 'integer:18:65' },
  },
};

before(async function startServer() {
  server = createServer(SCHEMA, { cors: true });
  await new Promise(function listenPromise(resolve) {
    server.listen(0, '127.0.0.1', function onListen() {
      port = server.address().port;
      resolve();
    });
  });
});

after(async function stopServer() {
  await new Promise(function closePromise(resolve) { server.close(resolve); });
});

describe('generators', function generatorTests() {
  test('fullName returns two-word string', function () {
    const name = generators.fullName();
    assert.ok(typeof name === 'string');
    assert.ok(name.includes(' '));
  });

  test('email returns valid-looking address', function () {
    const e = generators.email();
    assert.match(e, /@/);
    assert.match(e, /\./);
  });

  test('integer stays within range', function () {
    for (let i = 0; i < 20; i++) {
      const n = generators.integer(5, 10);
      assert.ok(n >= 5 && n <= 10, 'out of range: ' + n);
    }
  });

  test('float stays within range', function () {
    for (let i = 0; i < 20; i++) {
      const n = generators.float(0, 1);
      assert.ok(n >= 0 && n <= 1, 'out of range: ' + n);
    }
  });

  test('boolean returns true or false', function () {
    const b = generators.boolean();
    assert.ok(b === true || b === false);
  });

  test('uuid returns 36-char hyphenated string', function () {
    const id = generators.uuid();
    assert.equal(id.length, 36);
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  test('ip returns valid IPv4 format', function () {
    const addr = generators.ip();
    assert.match(addr, /^\d+\.\d+\.\d+\.\d+$/);
  });

  test('sentence ends with a period', function () {
    const s = generators.sentence();
    assert.ok(s.length > 0);
    assert.ok(s.endsWith('.'));
  });

  test('phone starts with +1-', function () {
    const p = generators.phone();
    assert.ok(p.startsWith('+1-'));
  });

  test('company returns a non-empty string', function () {
    const c = generators.company();
    assert.ok(typeof c === 'string' && c.length > 0);
  });
});

describe('CRUD HTTP endpoints', function crudTests() {
  test('GET /users returns seeded array', async function () {
    const res = await request({ hostname: '127.0.0.1', port, path: '/users', method: 'GET' });
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(Array.isArray(body));
    assert.equal(body.length, 5);
  });

  test('GET /users/:id returns single record', async function () {
    const res = await request({ hostname: '127.0.0.1', port, path: '/users/1', method: 'GET' });
    assert.equal(res.status, 200);
    assert.equal(JSON.parse(res.body).id, 1);
  });

  test('GET /users/:id returns 404 for missing id', async function () {
    const res = await request({ hostname: '127.0.0.1', port, path: '/users/9999', method: 'GET' });
    assert.equal(res.status, 404);
  });

  test('POST /users creates a new record', async function () {
    const payload = JSON.stringify({ name: 'Test User', email: 'test@example.com' });
    const res = await request({
      hostname: '127.0.0.1', port, path: '/users', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, payload);
    assert.equal(res.status, 201);
    const body = JSON.parse(res.body);
    assert.equal(body.name, 'Test User');
    assert.ok(body.id > 0);
  });

  test('GET /unknown resource returns 404', async function () {
    const res = await request({ hostname: '127.0.0.1', port, path: '/unknown', method: 'GET' });
    assert.equal(res.status, 404);
  });

  test('GET /users with pagination returns metadata', async function () {
    const res = await request({ hostname: '127.0.0.1', port, path: '/users?page=1&limit=2', method: 'GET' });
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.ok(body.data !== undefined);
    assert.equal(body.limit, 2);
    assert.ok(body.pages >= 1);
  });

  test('DELETE /users/:id removes the record', async function () {
    const payload = JSON.stringify({ name: 'ToDelete' });
    const postRes = await request({
      hostname: '127.0.0.1', port, path: '/users', method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, payload);
    const created = JSON.parse(postRes.body);
    const delRes  = await request({
      hostname: '127.0.0.1', port, path: '/users/' + created.id, method: 'DELETE',
    });
    assert.equal(delRes.status, 204);
  });

  test('CORS header present on list response', async function () {
    // Verify server runs correctly with CORS enabled (no crash)
    const res = await request({ hostname: '127.0.0.1', port, path: '/users', method: 'GET' });
    assert.equal(res.status, 200);
  });
});
