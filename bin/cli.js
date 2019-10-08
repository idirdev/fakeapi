#!/usr/bin/env node
'use strict';

/**
 * @file bin/cli.js
 * @description CLI entry point for @idirdev/fakeapi.
 * @author idirdev
 * @example
 *   fakeapi --schema schema.json --port 3000 --count 10 --cors --delay 200
 */

const fs   = require('node:fs');
const path = require('node:path');
const { createServer } = require('../src/index.js');

const args = process.argv.slice(2);

/**
 * Returns the value following a named CLI flag, or null.
 * @param {string[]} argv
 * @param {string}   name
 * @returns {string|null}
 */
function getArg(argv, name) {
  const idx = argv.indexOf('--' + name);
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
  return null;
}

/**
 * Returns true if a boolean flag is present.
 * @param {string[]} argv
 * @param {string}   name
 * @returns {boolean}
 */
function hasFlag(argv, name) {
  return argv.includes('--' + name);
}

if (hasFlag(args, 'help') || hasFlag(args, 'h')) {
  console.log([
    'Usage: fakeapi [options]',
    '',
    'Options:',
    '  --schema <file>   Path to JSON schema file',
    '  --port   <n>      Port to listen on (default: 3000)',
    '  --count  <n>      Default record count per resource (default: 10)',
    '  --cors            Enable CORS headers',
    '  --delay  <ms>     Global response delay in ms (default: 0)',
    '  --help            Show this help message',
    '',
    'Schema format:',
    '  { "users": { "count": 10, "fields": { "id": "autoincrement", "name": "fullName" } } }',
  ].join('
'));
  process.exit(0);
}

const schemaFile = getArg(args, 'schema');
const port       = parseInt(getArg(args, 'port')  || '3000', 10);
const count      = parseInt(getArg(args, 'count') || '10',   10);
const cors       = hasFlag(args, 'cors');
const delay      = parseInt(getArg(args, 'delay') || '0',    10);

let schema = {};

if (schemaFile) {
  const schemaPath = path.resolve(process.cwd(), schemaFile);
  if (!fs.existsSync(schemaPath)) {
    console.error('Error: schema file not found:', schemaPath);
    process.exit(1);
  }
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (err) {
    console.error('Error parsing schema file:', err.message);
    process.exit(1);
  }
} else {
  schema = {
    users: {
      count,
      fields: { id: 'autoincrement', name: 'fullName', email: 'email', age: 'integer:18:65' },
    },
    posts: {
      count,
      fields: {
        id:     'autoincrement',
        title:  'sentence',
        body:   'paragraph',
        userId: 'integer:1:' + count,
      },
    },
  };
}

const server = createServer(schema, { cors, delay });
server.listen(port, function onListen() {
  console.log('fakeapi listening on http://localhost:' + port);
  if (cors)  console.log('  CORS: enabled');
  if (delay) console.log('  Global delay: ' + delay + ' ms');
  console.log('  Resources: ' + Object.keys(schema).join(', '));
});
