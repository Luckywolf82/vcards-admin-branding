exports.handler = async () => {
  const owner  = process.env.GITHUB_OWNER;
  const repo   = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH;
  const token  = process.env.GITHUB_TOKEN;

  const out = { ok:false, owner, repo, branch, hasToken: !!token, checks: [] };
  const headers = { "Content-Type":"application/json" };
  const gh = (url) => fetch(url, { headers: { Authorization: `Bearer ${token}`, "User-Agent":"nfcking-diag" } });

  try {
    // 1) /user
    let r = await gh("https://api.github.com/user");
    out.checks.push({ step:"/user", status:r.status });
    if (r.status !== 200) {
      out.error = "Token ugyldig eller mangler repo-tilgang";
      return { statusCode: 200, headers, body: JSON.stringify(out,null,2) };
    }
    out.user = await r.json();

    // 2) /repos/:owner/:repo
    r = await gh(`https://api.github.com/repos/${owner}/${repo}`);
    out.checks.push({ step:"/repos/:owner/:repo", status:r.status });
    if (r.status === 404) {
      out.error = "Repo ikke funnet for dette tokenet (sjekk owner/repo eller PAT repo-tilgang).";
      return { statusCode: 200, headers, body: JSON.stringify(out,null,2) };
    }

    // 3) /branches/:branch
    r = await gh(`https://api.github.com/repos/${owner}/${repo}/branches/${branch}`);
    out.checks.push({ step:"/branches/:branch", status:r.status });
    if (r.status === 404) {
      out.error = "Branchen finnes ikke eller PAT kan ikke lese den.";
      return { statusCode: 200, headers, body: JSON.stringify(out,null,2) };
    }

    out.ok = true;
    out.message = "GitHub-oppsett ser bra ut.";
    return { statusCode: 200, headers, body: JSON.stringify(out,null,2) };
  } catch (e) {
    out.error = e.message || String(e);
    return { statusCode: 200, headers, body: JSON.stringify(out,null,2) };
  }
};
