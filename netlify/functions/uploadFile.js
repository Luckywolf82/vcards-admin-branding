/**
 * Netlify Function: uploadFile
 * Purpose: Upload PDFs (or other simple files) to your GitHub Pages repo under:
 *   /<BASE_PATH>/<orgKey>/<slug>/files/<filename>
 * Returns the public Pages URL to the uploaded file.
 *
 * HTTP: POST /api/uploadFile
 * Body: { repoOwner, repoName, basePath, orgKey, slug, filename, contentBase64 }
 *
 * Env: GITHUB_TOKEN (repo:contents access)
 */
const MAX_BYTES = 20 * 1024 * 1024; // 20MB safety cap

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function badRequest(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders() },
  });
}

// Trim slashes from ends
function trimSlashes(s = "") {
  return (s || "").replace(/^\/+|\/+$/g, "");
}

async function githubGetContent(owner, repo, path, token) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const r = await fetch(url, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`GitHub GET failed (${r.status}): ${text}`);
  }
  return await r.json();
}

async function githubPutContent(owner, repo, path, contentBase64, message, token, sha) {
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
  const body = {
    message,
    content: contentBase64,
  };
  if (sha) body.sha = sha;

  const r = await fetch(url, {
    method: "PUT",
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  const txt = await r.text();
  let json;
  try { json = JSON.parse(txt); } catch { /* leave undefined */ }
  if (!r.ok) {
    throw new Error(`GitHub PUT failed (${r.status}): ${txt}`);
  }
  return json;
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }
  if (req.method !== "POST") {
    return badRequest("Use POST", 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return badRequest("Invalid JSON");
  }

  const {
    repoOwner,
    repoName,
    basePath,
    orgKey,
    slug,
    filename,
    contentBase64
  } = body || {};

  if (!repoOwner || !repoName) return badRequest("Missing repoOwner or repoName");
  if (!orgKey || !slug) return badRequest("Missing orgKey or slug");
  if (!filename) return badRequest("Missing filename");
  if (!contentBase64) return badRequest("Missing contentBase64");

  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    return badRequest("Server missing GITHUB_TOKEN", 500);
  }

  // Basic validations
  const cleanOrg  = String(orgKey).replace(/[^A-Za-z0-9_-]/g, "");
  const cleanSlug = String(slug).replace(/[^A-Za-z0-9_-]/g, "");
  const safeFile  = String(filename).replace(/[^A-Za-z0-9._-]/g, "_");

  const base = trimSlashes(basePath || "Vcards");
  const relPath = `${base ? base + "/" : ""}${cleanOrg}/${cleanSlug}/files/${safeFile}`;

  // Size check
  try {
    const rawBytes = Buffer.from(contentBase64, "base64");
    if (rawBytes.length > MAX_BYTES) {
      return badRequest(`File too large (${rawBytes.length} bytes). Max ${MAX_BYTES} bytes.`);
    }
  } catch {
    return badRequest("contentBase64 is not valid base64");
  }

  // If file exists, fetch SHA (required by GitHub to update)
  let sha = undefined;
  try {
    const existing = await githubGetContent(repoOwner, repoName, relPath, token);
    if (existing && existing.sha) sha = existing.sha;
  } catch (e) {
    // If non-404 error occurred on GET, bubble it up
    return badRequest(`Failed to check existing file: ${String(e.message || e)}`, 502);
  }

  // Upload or update file
  try {
    await githubPutContent(
      repoOwner,
      repoName,
      relPath,
      contentBase64,
      `Upload file: ${cleanOrg}/${cleanSlug}/files/${safeFile}`,
      token,
      sha
    );
  } catch (e) {
    return badRequest(`Upload failed: ${String(e.message || e)}`, 502);
  }

  // Construct public GitHub Pages URL
  const pagesUrl =
    `https://${repoOwner}.github.io/${repoName}${base ? `/${base}` : ""}/${cleanOrg}/${cleanSlug}/files/${safeFile}`;

  return new Response(JSON.stringify({ url: pagesUrl }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders() }
  });
};
