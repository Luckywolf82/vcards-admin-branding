const { encodePath } = require('./_lib/github');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }
    const token = process.env.GITHUB_TOKEN;
    if (!token) return { statusCode: 500, body: "Missing GITHUB_TOKEN" };

    const body = JSON.parse(event.body || "{}");
    const { owner, repo, path, message = "Delete via admin", branch = "HEAD" } = body;
    if (!owner || !repo || !path) {
      return { statusCode: 400, body: "owner, repo, path required" };
    }

    // 1) Hent sha for fila
    const getRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}?ref=${branch}`,
      {
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json" },
      }
    );
    if (!getRes.ok) {
      const t = await getRes.text();
      return { statusCode: getRes.status, body: `Lookup failed: ${t}` };
    }
    const getJson = await getRes.json();
    const sha = getJson.sha;

    // 2) Slett fila
    const delRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodePath(path)}`,
      {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}`, "Accept": "application/vnd.github+json" },
        body: JSON.stringify({ message, sha, branch }),
      }
    );

    if (!delRes.ok) {
      const t = await delRes.text();
      return { statusCode: delRes.status, body: `Delete failed: ${t}` };
    }
    const out = await delRes.json();
    return { statusCode: 200, body: JSON.stringify(out) };
  } catch (e) {
    return { statusCode: 500, body: String(e.message || e) };
  }
};
