const { admin, requireRole } = require("./_lib/auth");

function ok(data, code=200){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:true, ...data }) }; }
function bad(msg, code=400){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:false, error:msg }) }; }
function cors(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Allow-Methods":"OPTIONS,POST,OPTIONS" }; }

exports.handler = async (evt) => {
  if (evt.httpMethod === "OPTIONS") return ok({});
  if (evt.httpMethod !== "POST") return bad("Method not allowed", 405);

  try{
    const actor = await requireRole(evt, "admin");
    const actorRole = actor.role || "viewer";

    const body = JSON.parse(evt.body || "{}");
    const { uid } = body;
    if(!uid) return bad("Missing uid", 400);

    // Hent målbruker for rolle-sjekk
    const target = await admin.auth().getUser(uid);
    const targetRole = (target.customClaims && target.customClaims.role) || "viewer";

    // Blokker impersonate av owner hvis ikke owner
    if (targetRole === "owner" && actorRole !== "owner") {
      return bad("Only owner can impersonate an owner", 403);
    }

    // Lag custom token med metadata om hvem som impersonerer
    const customToken = await admin.auth().createCustomToken(uid, {
      impBy: actor.uid,
      impAt: Date.now()
    });

    return ok({ customToken });
  }catch(err){
    const code = err.statusCode || 500;
    return bad(err.message || "Internal error", code);
  }
};
