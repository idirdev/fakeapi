'use strict';

/**
 * @module fakeapi
 * @description Generate fake REST API data with realistic content.
 * Provides data generators and an auto-CRUD HTTP server from a schema definition.
 * @author idirdev
 */

const http   = require('node:http');
const url    = require('node:url');
const crypto = require('node:crypto');

// ─── Data ────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Alice','Bob','Carol','David','Eve','Frank','Grace','Heidi',
  'Ivan','Judy','Mallory','Oscar','Peggy','Sybil','Trent',
  'Victor','Walter','Wendy','Xavier','Yvonne',
];
const LAST_NAMES = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller',
  'Davis','Wilson','Taylor','Anderson','Thomas','Jackson',
  'White','Harris','Martin','Thompson',
];
const DOMAINS  = ['example.com','test.org','demo.net','sample.io','fakemail.dev'];
const TLD      = ['com','org','net','io','dev','co'];
const COMPANIES = [
  'Acme Corp','Globex','Initech','Umbrella','Cyberdyne',
  'Soylent','Dunder Mifflin','Hooli','Pied Piper','Vehement Capital',
];
const WORDS = [
  'the','quick','brown','fox','jumps','over','lazy','dog',
  'lorem','ipsum','dolor','sit','amet','consectetur',
  'adipiscing','elit','sed','do','eiusmod','tempor',
];

// ─── Generators ──────────────────────────────────────────────────────────────

/**
 * Returns a random integer in [min, max] (inclusive).
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function integer(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Returns a random float in [min, max] rounded to 2 decimal places.
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function float(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

/**
 * Returns a random boolean.
 * @returns {boolean}
 */
function boolean() {
  return Math.random() < 0.5;
}

/**
 * Returns a random element from an array.
 * @template T
 * @param {T[]} arr
 * @returns {T}
 */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Returns a random first name.
 * @returns {string}
 */
function firstName() {
  return pick(FIRST_NAMES);
}

/**
 * Returns a random last name.
 * @returns {string}
 */
function lastName() {
  return pick(LAST_NAMES);
}

/**
 * Returns a random full name (first + last).
 * @returns {string}
 */
function fullName() {
  return firstName() + ' ' + lastName();
}

/**
 * Returns a random email address.
 * @returns {string}
 */
function email() {
  const fn = firstName().toLowerCase();
  const ln = lastName().toLowerCase();
  return fn + '.' + ln + integer(1, 99) + '@' + pick(DOMAINS);
}

/**
 * Returns a random UUID v4.
 * @returns {string}
 */
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function replaceHex(c) {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Returns a random ISO 8601 date string between two date strings.
 * @param {string} [from='2000-01-01'] - Start date (ISO string).
 * @param {string} [to]                - End date (ISO string); defaults to now.
 * @returns {string}
 */
function date(from, to) {
  const start = from ? new Date(from).getTime() : new Date('2000-01-01').getTime();
  const end   = to   ? new Date(to).getTime()   : Date.now();
  return new Date(integer(start, end)).toISOString();
}

/**
 * Returns a random sentence of 5-12 words ending with a period.
 * @returns {string}
 */
function sentence() {
  const len   = integer(5, 12);
  const words = Array.from({ length: len }, function genWord() { return pick(WORDS); });
  words[0]    = words[0].charAt(0).toUpperCase() + words[0].slice(1);
  return words.join(' ') + '.';
}

/**
 * Returns a random paragraph of 3-6 sentences.
 * @returns {string}
 */
function paragraph() {
  return Array.from({ length: integer(3, 6) }, function genSentence() {
    return sentence();
  }).join(' ');
}

/**
 * Returns a random-looking URL string.
 * @returns {string}
 */
function fakeUrl() {
  return 'https://' + pick(WORDS) + '.' + pick(TLD) + '/' + pick(WORDS);
}

/**
 * Returns a random IPv4 address string.
 * @returns {string}
 */
function ip() {
  return [integer(1, 254), integer(0, 255), integer(0, 255), integer(1, 254)].join('.');
}

/**
 * Returns a random US-style phone number string.
 * @returns {string}
 */
function phone() {
  return '+1-' + integer(200, 999) + '-' + integer(100, 999) + '-' + integer(1000, 9999);
}

/**
 * Returns a random company name.
 * @returns {string}
 */
function company() {
  return pick(COMPANIES);
}

// ─── Field engine ─────────────────────────────────────────────────────────────

/**
 * Generates a value for a single field given its type descriptor.
 *
 * Supported types:
 *   autoincrement | fullName | firstName | lastName | email | boolean |
 *   uuid | sentence | paragraph | url | ip | phone | company |
 *   integer[:min:max] | float[:min:max] | date[:from:to]
 *
 * @param {string} fieldType - Type descriptor string.
 * @param {number} index     - Zero-based row index (used for autoincrement).
 * @returns {*} Generated value.
 */
function generateField(fieldType, index) {
  if (fieldType === 'autoincrement') return index + 1;
  if (fieldType === 'fullName')      return fullName();
  if (fieldType === 'firstName')     return firstName();
  if (fieldType === 'lastName')      return lastName();
  if (fieldType === 'email')         return email();
  if (fieldType === 'boolean')       return boolean();
  if (fieldType === 'uuid')          return uuid();
  if (fieldType === 'sentence')      return sentence();
  if (fieldType === 'paragraph')     return paragraph();
  if (fieldType === 'url')           return fakeUrl();
  if (fieldType === 'ip')            return ip();
  if (fieldType === 'phone')         return phone();
  if (fieldType === 'company')       return company();

  if (fieldType.startsWith('integer')) {
    const parts = fieldType.split(':');
    return integer(parseInt(parts[1] || '0', 10), parseInt(parts[2] || '100', 10));
  }
  if (fieldType.startsWith('float')) {
    const parts = fieldType.split(':');
    return float(parseFloat(parts[1] || '0'), parseFloat(parts[2] || '100'));
  }
  if (fieldType.startsWith('date')) {
    const parts = fieldType.split(':');
    return date(parts[1] || undefined, parts[2] || undefined);
  }
  return null;
}

/**
 * Generates a single record object from a field definition map.
 * @param {Object.<string,string>} fields - Map of field name to type descriptor.
 * @param {number}                 index  - Record index (0-based).
 * @returns {object}
 */
function generateRecord(fields, index) {
  const record = {};
  for (const [name, type] of Object.entries(fields)) {
    record[name] = generateField(type, index);
  }
  return record;
}

// ─── Server ───────────────────────────────────────────────────────────────────

/**
 * Creates an HTTP server with auto-CRUD endpoints for each schema resource.
 *
 * Endpoints generated per resource named "users":
 *   GET    /users           - list all (supports ?page=&limit= pagination)
 *   GET    /users/:id       - get one
 *   POST   /users           - create
 *   PUT    /users/:id       - replace
 *   DELETE /users/:id       - delete
 *
 * @param {Object.<string,ResourceDef>} schema - Resource definitions.
 * @param {object}  [opts]            - Options.
 * @param {boolean} [opts.cors=false] - Enable CORS headers.
 * @param {number}  [opts.delay=0]    - Global response delay in ms.
 * @returns {http.Server}
 *
 * @typedef {object} ResourceDef
 * @property {number}                 count  - Number of records to seed.
 * @property {Object.<string,string>} fields - Field name to type-descriptor map.
 *
 * @example
 * const { createServer } = require('@idirdev/fakeapi');
 * const server = createServer({
 *   users: { count: 5, fields: { id: 'autoincrement', name: 'fullName', email: 'email' } }
 * });
 * server.listen(3000);
 */
function createServer(schema, opts) {
  schema = schema || {};
  opts   = opts   || {};

  // Seed in-memory stores
  const stores = {};
  for (const [name, res] of Object.entries(schema)) {
    const count = res.count || 10;
    stores[name] = Array.from({ length: count }, function genRow(_, i) {
      return generateRecord(res.fields || {}, i);
    });
  }

  const server = http.createServer(function handleReq(req, res) {
    const parsed   = url.parse(req.url, true);
    const pathname = parsed.pathname || '/';
    const query    = parsed.query    || {};
    const parts    = pathname.split('/').filter(Boolean);

    /**
     * Sends a JSON response, with optional global delay.
     * @param {number} status
     * @param {*}      body
     */
    function respond(status, body) {
      function doSend() {
        if (opts.cors) {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
        }
        res.writeHead(status, { 'Content-Type': 'application/json' });
        res.end(body !== null && body !== undefined ? JSON.stringify(body) : '');
      }
      if (opts.delay > 0) setTimeout(doSend, opts.delay);
      else doSend();
    }

    // CORS preflight
    if (opts.cors && req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
      res.writeHead(204);
      res.end();
      return;
    }

    // Root: list resources
    if (parts.length === 0) {
      respond(200, { resources: Object.keys(stores) });
      return;
    }

    const resourceName = parts[0];
    const store = stores[resourceName];
    if (!store) {
      respond(404, { error: 'Resource not found: ' + resourceName });
      return;
    }

    const resDef  = schema[resourceName] || {};
    const fields  = resDef.fields || {};
    const idEntry = Object.entries(fields).find(function findId([, t]) { return t === 'autoincrement'; });
    const idKey   = idEntry ? idEntry[0] : 'id';
    const id      = parts[1] || null;

    // GET /resource
    if (req.method === 'GET' && !id) {
      let data  = store.slice();
      const total = data.length;
      const limit = parseInt(query.limit || '0', 10);
      const page  = parseInt(query.page  || '1', 10);
      if (limit > 0) {
        const offset = (page - 1) * limit;
        data = data.slice(offset, offset + limit);
        respond(200, { data, total, page, limit, pages: Math.ceil(total / limit) });
      } else {
        respond(200, data);
      }
      return;
    }

    // GET /resource/:id
    if (req.method === 'GET' && id) {
      const item = store.find(function findItem(r) { return String(r[idKey]) === id; });
      if (!item) { respond(404, { error: 'Not found' }); return; }
      respond(200, item);
      return;
    }

    // POST /resource
    if (req.method === 'POST' && !id) {
      let rawBody = '';
      req.on('data', function onData(c) { rawBody += c; });
      req.on('end',  function onEnd() {
        let data = {};
        try { data = JSON.parse(rawBody || '{}'); } catch (_) {}
        const nextId  = store.length > 0
          ? Math.max.apply(null, store.map(function mapId(r) { return r[idKey] || 0; })) + 1
          : 1;
        const newItem = Object.assign({}, data, { [idKey]: nextId });
        store.push(newItem);
        respond(201, newItem);
      });
      return;
    }

    // PUT /resource/:id
    if (req.method === 'PUT' && id) {
      const idx = store.findIndex(function findIdx(r) { return String(r[idKey]) === id; });
      let rawBody = '';
      req.on('data', function onData(c) { rawBody += c; });
      req.on('end',  function onEnd() {
        let data = {};
        try { data = JSON.parse(rawBody || '{}'); } catch (_) {}
        if (idx === -1) { respond(404, { error: 'Not found' }); return; }
        store[idx] = Object.assign({}, data, { [idKey]: store[idx][idKey] });
        respond(200, store[idx]);
      });
      return;
    }

    // DELETE /resource/:id
    if (req.method === 'DELETE' && id) {
      const idx = store.findIndex(function findIdx(r) { return String(r[idKey]) === id; });
      if (idx === -1) { respond(404, { error: 'Not found' }); return; }
      store.splice(idx, 1);
      respond(204, null);
      return;
    }

    respond(405, { error: 'Method Not Allowed' });
  });

  return server;
}

module.exports = {
  createServer,
  generators: {
    fullName, firstName, lastName, email,
    integer, float, boolean, date, uuid,
    sentence, paragraph, pick,
    url: fakeUrl, ip, phone, company,
  },
};
