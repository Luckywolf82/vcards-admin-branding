const { admin } = require("./_lib/auth");

// CORS helpers
function cors(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Allow-Methods":"OPTIONS,POST" }; }
function ok(data, code=200){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:true, ...data }) }; }
function bad(msg, code=400){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:false, error:msg }) }; }

exports.handler = async (evt)=>{
  if (evt.httpMethod === "OPTIONS") return ok({});
  if (evt.httpMethod !== "POST") return bad("Method not allowed", 405);

  const SECRET = process.env.ADMIN_SEED_SECRET || "";
  const ALLOWED_EMAIL = (process.env.ADMIN_SEED_EMAIL || "").toLowerCase();

  try{
    const body = JSON.parse(evt.body || "{}");
    const { secret, email } = body;

    if (!secret || secret !== SECRET) return bad("Forbidden (secret)", 403);
    const targetEmail = (email || ALLOWED_EMAIL || "").toLowerCase();
    if (!targetEmail) return bad("Missing email", 400);

    const user = await admin.auth().getUserByEmail(targetEmail);
    await admin.auth().setCustomUserClaims(user.uid, { role: "owner" });

    return ok({ uid: user.uid, email: user.email, role: "owner", note: "Owner set. Remove function and env vars." });
  }catch(err){
    return bad(err.message || "Internal error", 500);
  }
};
