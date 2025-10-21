// netlify/functions/createCard.js
// Skyver vCard/HTML/data til GitHub Pages repo. Ingen Firebase kreves.

const { encodePath } = require('./_lib/github');

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
      slug,
      files = [],
      commitMessage = "Update vCards",
      strategy = "pr", // ikke brukt her, men beholdt for fremtid
    } = JSON.parse(event.body || "{}");

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("Mangler GITHUB_TOKEN i Netlify Environment variables.");

    const owner = repoOwner || process.env.GITHUB_OWNER;
    const repo  = repoName  || process.env.GITHUB_REPO;
    if (!owner || !repo) throw new Error("repoOwner/repoName mangler (eller sett GITHUB_OWNER/GITHUB_REPO).");
    if (!orgKey || !slug) throw new Error("orgKey og slug er pÃ¥krevd.");
    if (!files.length) throw new Error("Ingen filer mottatt.");

    // Hent default branch
    const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "nfcking-create-card",
      },
    }).then(r => r.json());
    const branch = repoInfo?.default_branch || "main";

    // Hjelper: finn SHA hvis fil finnes
    async function getSha(path) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`,
        { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } }
      );
      if (res.status === 404) return null;
      const j = await res.json();
      return j.sha;
    }

    // Skriv alle filer
    for (const f of files) {
      const safeBase = String(basePath).replace(/^\/+|\/+$/g, '');
      const fullPath = f.path.startsWith(safeBase + "/") ? f.path : `${safeBase}/${f.path}`;
      const sha = await getSha(fullPath);

      const body = {
        message: commitMessage,
        content: Buffer.from(f.content || "", "utf8").toString("base64"),
        branch,
        sha: sha || undefined,
      };

      const put = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(fullPath)}`,
        {
          method: "PUT",
          headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
          body: JSON.stringify(body),
        }
      );

      if (!put.ok) {
        const t = await put.text();
        throw new Error(`GitHub-feil ${put.status}: ${t}`);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, branch }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

