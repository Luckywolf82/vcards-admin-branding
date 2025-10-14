const { admin, requireRole } = require("./_lib/auth");

function ok(data, code=200){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:true, ...data }) }; }
function bad(msg, code=400){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:false, error:msg }) }; }
function cors(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Allow-Methods":"OPTIONS,POST" }; }

exports.handler = async (evt) => {
  if (evt.httpMethod === "OPTIONS") return ok({});
  if (evt.httpMethod !== "POST") return bad("Method not allowed", 405);

  try{
    const actor = await requireRole(evt, "admin");
    const actorRole = actor.role || "viewer";

    const body = JSON.parse(evt.body || "{}");
    const { uid, role } = body;
    if(!uid || !role) return bad("Missing uid/role", 400);

    const elevated = ["admin","owner"];
    if (elevated.includes(role) && actorRole !== "owner"){
      return bad("Only owner can assign 'admin' or 'owner'", 403);
    }

    await admin.auth().setCustomUserClaims(uid, { role });
    return ok({ uid, role });
  }catch(err){
    const code = err.statusCode || 500;
    return bad(err.message || "Internal error", code);
  }
};
