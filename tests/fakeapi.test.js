'use strict';
const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { matchRoute, applyQuery, sendJson, parseBody } = require('../src/router');

describe('matchRoute', () => {
  it('root', () => { const r = matchRoute('/'); assert.equal(r.resource, null); });
  it('collection', () => { const r = matchRoute('/users'); assert.equal(r.resource, 'users'); assert.equal(r.id, null); });
  it('item', () => { const r = matchRoute('/users/123'); assert.equal(r.resource, 'users'); assert.equal(r.id, '123'); });
});

describe('applyQuery', () => {
  const items = [
    { id: 1, name: 'Alice', age: 30 },
    { id: 2, name: 'Bob', age: 25 },
    { id: 3, name: 'Charlie', age: 35 }
  ];

  it('returns all', () => {
    const r = applyQuery(items, new URLSearchParams());
    assert.equal(r.data.length, 3);
  });
  it('filters', () => {
    const r = applyQuery(items, new URLSearchParams('name=Alice'));
    assert.equal(r.data.length, 1);
    assert.equal(r.data[0].name, 'Alice');
  });
  it('sorts', () => {
    const r = applyQuery(items, new URLSearchParams('_sort=age&_order=desc'));
    assert.equal(r.data[0].name, 'Charlie');
  });
  it('paginates', () => {
    const r = applyQuery(items, new URLSearchParams('_page=1&_limit=2'));
    assert.equal(r.data.length, 2);
    assert.equal(r.total, 3);
  });
  it('search', () => {
    const r = applyQuery(items, new URLSearchParams('q=bob'));
    assert.equal(r.data.length, 1);
  });
});
