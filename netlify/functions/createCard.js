// netlify/functions/createCard.js
// Minimal CreateCard: tar imot filer fra UI og pusher til GitHub via Contents API.

const fetch = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, body: 'Method not allowed' };
    }

    const {
      repoOwner,
      repoName,
      basePath = process.env.BASE_PATH || 'Vcards',
      orgKey,
      slug,
      files = [],
      commitMessage = 'Update vCards',
      // strategy ignorert i minimal-versjonen – vi pusher direkte til default branch
    } = JSON.parse(event.body || '{}');

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error('Mangler GITHUB_TOKEN i Netlify → Environment variables.');

    const owner = repoOwner || process.env.GITHUB_OWNER;
    const repo  = repoName  || process.env.GITHUB_REPO;
    if (!owner || !repo) throw new Error('repoOwner/repoName mangler (eller sett GITHUB_OWNER/GITHUB_REPO i Netlify).');
    if (!orgKey || !slug) throw new Error('orgKey og slug er påkrevd.');
    if (!files.length) throw new Error('Ingen filer mottatt.');

    const gh = async (path, opts = {}) => {
      const res = await fetch(`https://api.github.com${path}`, {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github+json',
          'User-Agent': 'vcards-admin-netlify'
        },
        ...opts
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`${res.status} ${res.statusText}: ${txt}`);
      }
      return res.json();
    };

    // Finn default branch
    const repoInfo = await gh(`/repos/${owner}/${repo}`);
    const branch   = repoInfo.default_branch || 'main';

    // Hjelper: hent eksisterende SHA (hvis filen finnes)
    const getSha = async (path) => {
      try {
        const j = await gh(`/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`);
        return j.sha;
      } catch {
        return null; // 404 = ny fil
      }
    };

    // Push hver fil
    for (const f of files) {
      // Sørg for at alle filer havner under basePath/
      const safePath = f.path.startsWith(basePath + '/') ? f.path : `${basePath}/${f.path}`;
      const sha = await getSha(safePath);

      const body = {
        message: commitMessage,
        content: Buffer.from(f.content || '', 'utf8').toString('base64'),
        branch,
        sha: sha || undefined
      };

      const putRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(safePath)}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github+json',
            'User-Agent': 'vcards-admin-netlify'
          },
          body: JSON.stringify(body)
        }
      );
      if (!putRes.ok) {
        const t = await putRes.text();
        throw new Error(`PUT ${safePath} feilet: ${putRes.status} ${putRes.statusText} – ${t}`);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, branch }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
