'use strict';

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', c => chunks.push(c));
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString();
      try { resolve(body ? JSON.parse(body) : {}); }
      catch { reject(new Error('Invalid JSON')); }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function matchRoute(pathname) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return { resource: null, id: null };
  return { resource: parts[0], id: parts[1] || null };
}

function applyQuery(collection, params) {
  let result = [...collection];
  const page = parseInt(params.get('_page')) || 0;
  const limit = parseInt(params.get('_limit')) || 0;
  const sort = params.get('_sort');
  const order = params.get('_order') || 'asc';
  const search = params.get('q');

  for (const [key, value] of params.entries()) {
    if (key.startsWith('_') || key === 'q') continue;
    result = result.filter(item => {
      const itemVal = String(item[key] || '');
      return itemVal.toLowerCase().includes(value.toLowerCase());
    });
  }

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(item =>
      Object.values(item).some(v => String(v).toLowerCase().includes(q))
    );
  }

  if (sort) {
    result.sort((a, b) => {
      const av = a[sort], bv = b[sort];
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return order === 'desc' ? -cmp : cmp;
    });
  }

  const total = result.length;
  if (page > 0 && limit > 0) {
    const start = (page - 1) * limit;
    result = result.slice(start, start + limit);
  } else if (limit > 0) {
    result = result.slice(0, limit);
  }

  return { data: result, total, page: page || 1, limit: limit || total };
}

module.exports = { parseBody, sendJson, matchRoute, applyQuery };
