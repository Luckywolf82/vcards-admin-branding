const { initAdmin } = require('./_shared/firebaseAdmin');

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: "Method not allowed" };

    const authz = event.headers.authorization || event.headers.Authorization || "";
    if (!authz.startsWith("Bearer ")) return { statusCode: 401, body: JSON.stringify({ error: "Missing Bearer token" }) };
    const idToken = authz.substring(7);

    const admin = initAdmin();
    const decoded = await admin.auth().verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = decoded.email || "";

    const body = JSON.parse(event.body || "{}");
    const { repoOwner, repoName, basePath = process.env.BASE_PATH || "Vcards", orgKey, slug, files = [], strategy = "direct", commitMessage = "Update vCards" } = body;
    if (!orgKey || !slug) throw new Error("orgKey og slug er påkrevd.");
    if (!files.length) throw new Error("Ingen filer mottatt.");

    const db = admin.firestore();
    const memberRef = db.collection("orgs").doc(orgKey).collection("members").doc(uid);
    const snap = await memberRef.get();
    if (!snap.exists) return { statusCode: 403, body: JSON.stringify({ error: "Ingen tilgang til denne organisasjonen." }) };
    const role = snap.get("role");
    const allowed = ["owner","admin","editor"].includes(role);
    if (!allowed) return { statusCode: 403, body: JSON.stringify({ error: "Manglende rettigheter for å publisere." }) };

    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("Mangler GITHUB_TOKEN i Netlify Environment variables.");
    const owner = repoOwner || process.env.GITHUB_OWNER;
    const repo  = repoName || process.env.GITHUB_REPO;
    if (!owner || !repo) throw new Error("repoOwner/repoName mangler (eller sett GITHUB_OWNER/GITHUB_REPO).");

    const repoInfo = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json", "User-Agent": "nfcking-createCard" },
    }).then(r => r.json());
    const branch = repoInfo.default_branch || "main";

    async function getSha(path) {
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${branch}`, {
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
      });
      if (res.status === 404) return null;
      const json = await res.json(); return json.sha;
    }

    for (const f of files) {
      const safePath = f.path.startsWith(basePath + "/") ? f.path : `${basePath}/${f.path}`;
      const sha = await getSha(safePath);
      const body = {
        message: commitMessage + ` (by ${email||uid})`,
        content: Buffer.from(f.content || "", "utf8").toString("base64"),
        branch,
        sha: sha || undefined,
      };
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(safePath)}`, {
        method: "PUT",
        headers: { Authorization: `token ${token}`, Accept: "application/vnd.github+json" },
        body: JSON.stringify(body),
      });
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
