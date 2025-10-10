// netlify/functions/createCard.js
// Forenklet versjon – bruker innebygd fetch i Netlify (Node 18+)

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
    } = JSON.parse(event.body || "{}");

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("Mangler GITHUB_TOKEN i Netlify Environment variables.");

    const owner = repoOwner || process.env.GITHUB_OWNER;
    const repo = repoName || process.env.GITHUB_REPO;
    if (!owner || !repo) throw new Error("repoOwner/repoName mangler (eller sett GITHUB_OWNER/GITHUB_REPO).");
    if (!orgKey || !slug) throw new Error("orgKey og slug er påkrevd.");
    if (!files.length) throw new Error("Ingen filer mottatt.");

    // Finn default branch
    const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "vcards-admin-netlify",
      },
    }).then(r => r.json());

    const branch = repoInfo.default_branch || "main";

    // Hjelper: hent SHA hvis fil finnes fra før
    async function getSha(path) {
      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`,
        {
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json",
          },
        }
      );
      if (res.status === 404) return null;
      const json = await res.json();
      return json.sha;
    }

    // Oppdater/push alle filer
    for (const f of files) {
      const safePath = f.path.startsWith(basePath + "/") ? f.path : `${basePath}/${f.path}`;
      const sha = await getSha(safePath);
      const body = {
        message: commitMessage,
        content: Buffer.from(f.content || "", "utf8").toString("base64"),
        branch,
        sha: sha || undefined,
      };

      const res = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(safePath)}`,
        {
          method: "PUT",
          headers: {
            Authorization: `token ${token}`,
            Accept: "application/vnd.github+json",
          },
          body: JSON.stringify(body),
        }
      );

      if (!res.ok) {
        const t = await res.text();
        throw new Error(`GitHub-feil ${res.status}: ${t}`);
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true, branch }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
