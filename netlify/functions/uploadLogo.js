
exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

    const authz = event.headers.authorization || event.headers.Authorization || "";
    if (!authz.startsWith("Bearer ")) return { statusCode: 401, body: JSON.stringify({ error: "Missing Bearer token" }) };
    const idToken = authz.substring(7);

    const admin = initAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;

    const { repoOwner, repoName, basePath = process.env.BASE_PATH || "Vcards", orgKey, filename, contentBase64 } = JSON.parse(event.body || "{}");
    if (!orgKey || !filename || !contentBase64) { return { statusCode: 400, body: JSON.stringify({ error: "Missing orgKey, filename or contentBase64" }) }; }

    const db = admin.firestore();
    const memberRef = db.collection("orgs").doc(orgKey).collection("members").doc(uid);
    const snap = await memberRef.get();
    if (!snap.exists) return { statusCode: 403, body: JSON.stringify({ error: "Ingen tilgang til denne organisasjonen." }) };
    const role = snap.get("role");
    const allowed = ["owner","admin","editor"].includes(role);
    if (!allowed) return { statusCode: 403, body: JSON.stringify({ error: "Manglende rettigheter for å laste opp." }) };

    const token = process.env.GITHUB_TOKEN;
    if (!token) return { statusCode: 500, body: JSON.stringify({ error: "Missing GITHUB_TOKEN" }) };
    const owner = repoOwner || process.env.GITHUB_OWNER;
    const repo  = repoName  || process.env.GITHUB_REPO;
    if(!owner || !repo) return { statusCode: 500, body: JSON.stringify({ error: "Missing repoOwner/repoName or env GITHUB_OWNER/GITHUB_REPO" }) };

    const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json", "User-Agent": "nfcking-upload-logo" }
    }).then(r => r.json());
    const branch = repoInfo?.default_branch || "main";

    const safeBase = String(basePath).replace(/^\/+|\/+$/g, '');
    const safeOrg  = String(orgKey).replace(/[^A-Za-z0-9_-]/g, '');
    const safeFile = String(filename).replace(/[^A-Za-z0-9_.-]/g, '_');
    const path     = `${safeBase}/assets/${safeOrg}/${safeFile}`;

    async function getSha(p) {
      const u = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(p)}?ref=${branch}`;
      const r = await fetch(u, { headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" } });
      if (r.status === 404) return null;
      const j = await r.json(); return j.sha;
    }
    const sha = await getSha(path);

    const putRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`, {
      method: "PUT",
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      body: JSON.stringify({ message: `Upload logo: ${safeOrg}/${safeFile}`, content: contentBase64, branch, sha: sha || undefined })
    });
    if (!putRes.ok) {
      const t = await putRes.text();
      return { statusCode: putRes.status, body: JSON.stringify({ error: `GitHub error: ${t}` }) };
    }

    const pagesUrl = `https://${owner}.github.io/${repo}/${safeBase}/assets/${safeOrg}/${encodeURIComponent(safeFile)}`;
    return { statusCode: 200, body: JSON.stringify({ ok: true, path, url: pagesUrl }) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
