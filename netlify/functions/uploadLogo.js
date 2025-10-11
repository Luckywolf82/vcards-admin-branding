// netlify/functions/uploadLogo.js
// Opplasting av logo-bilde til GitHub repo under: <basePath>/assets/<orgKey>/<filename>
// Returnerer en offentlig GitHub Pages-URL for bildet.

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method not allowed" };
    }

    const {
      repoOwner,
      repoName,
      basePath = process.env.BASE_PATH || "Vcards",
      orgKey,
      filename,
      contentBase64
    } = JSON.parse(event.body || "{}");

    // Sjekk input
    if (!orgKey || !filename || !contentBase64) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing orgKey, filename or contentBase64" }) };
    }

    const token = process.env.GITHUB_TOKEN;
    if (!token) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing GITHUB_TOKEN" }) };
    }

    const owner = repoOwner || process.env.GITHUB_OWNER;
    const repo  = repoName  || process.env.GITHUB_REPO;
    if(!owner || !repo) {
      return { statusCode: 500, body: JSON.stringify({ error: "Missing repoOwner/repoName or env GITHUB_OWNER/GITHUB_REPO" }) };
    }

    // Finn default branch (for SHA og branch-bruk)
    const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "nfcking-upload-logo"
      }
    }).then(r => r.json());
    const branch = repoInfo?.default_branch || "main";

    // Path: <basePath>/assets/<orgKey>/<filename>
    const safeBase = String(basePath).replace(/^\/+|\/+$/g, '');
    const safeOrg  = String(orgKey).replace(/[^A-Za-z0-9_-]/g, '');
    const safeFile = String(filename).replace(/[^A-Za-z0-9_.-]/g, '_');
    const path     = `${safeBase}/assets/${safeOrg}/${safeFile}`;

    // Finn SHA om fila finnes fra før
    async function getSha(p) {
      const u = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(p)}?ref=${branch}`;
      const r = await fetch(u, {
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json"
        }
      });
      if (r.status === 404) return null;
      const j = await r.json();
      return j.sha;
    }
    const sha = await getSha(path);

    // PUT content
    const putRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${token}`,
          Accept: "application/vnd.github+json"
        },
        body: JSON.stringify({
          message: `Upload logo: ${safeOrg}/${safeFile}`,
          content: contentBase64,  // allerede base64-kodet
          branch,
          sha: sha || undefined
        })
      }
    );

    if (!putRes.ok) {
      const t = await putRes.text();
      return { statusCode: putRes.status, body: JSON.stringify({ error: `GitHub error: ${t}` }) };
    }

    // Konstruer offentlig URL (GitHub Pages)
    // https://<owner>.github.io/<repo>/<basePath>/assets/<orgKey>/<filename>
    const pagesUrl = `https://${owner}.github.io/${repo}/${safeBase}/assets/${safeOrg}/${encodeURIComponent(safeFile)}`;

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true,
        path,
        url: pagesUrl
      })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
