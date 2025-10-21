// netlify/functions/codex-health.js
const ALLOWED_ORIGIN = '*';
const DEFAULT_MODEL = 'gpt-4o-mini';

function json(statusCode, body, extraHeaders = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Vary': 'Origin',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
        'Access-Control-Allow-Methods': 'GET,OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'GET') {
    return json(405, { ok: false, error: 'Method Not Allowed', allow: 'GET,OPTIONS' }, {
      'Allow': 'GET,OPTIONS',
    });
  }

  const checks = ['env', 'model', 'online'];
  const start = Date.now();

  // 1) ENV
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    return json(200, { ok: false, step: 'env', error: 'OPENAI_API_KEY missing', checks });
  }

  // 2) Model
  const model = DEFAULT_MODEL;

  // 3) Online ping
  let latencyMs = null;
  let usage = null;
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 12_000);

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'Say ok' }],
        max_tokens: 4,
        temperature: 0,
      }),
    });

    clearTimeout(t);
    latencyMs = Date.now() - start;

    const text = await res.text();
    if (!res.ok) {
      let err = 'OpenAI error';
      try {
        const d = JSON.parse(text);
        err = d.error?.message || err;
      } catch (_) {}
      return json(200, {
        ok: false,
        step: 'online',
        model,
        status: res.status,
        error: err,
        checks,
      });
    }

    let data = {};
    try { data = JSON.parse(text); } catch (_) {}

    usage = data.usage || null;

    return json(200, {
      ok: true,
      step: 'online',
      model,
      latencyMs,
      usage,
      checks,
    });

  } catch (e) {
    latencyMs = Date.now() - start;
    const errMsg = (e && (e.name === 'AbortError' ? 'Timeout (12s)' : e.message)) || 'Unknown error';
    return json(200, {
      ok: false,
      step: 'online',
      model,
      error: errMsg,
      latencyMs,
      checks,
    });
  }
};
