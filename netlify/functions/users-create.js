const { admin, requireRole } = require("./_lib/auth");

function ok(data, code=200){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:true, ...data }) }; }
function bad(msg, code=400){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:false, error:msg }) }; }
function cors(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Allow-Methods":"OPTIONS,POST" }; }

exports.handler = async (evt) => {
  if (evt.httpMethod === "OPTIONS") return ok({});
  if (evt.httpMethod !== "POST") return bad("Method not allowed", 405);

  try{
    const actor = await requireRole(evt, "admin"); // admin eller owner
    const body = JSON.parse(evt.body || "{}");
    const { email, password, displayName="", role="viewer", disabled=false } = body;

    if(!email || !password) return bad("Missing email/password", 400);

    const user = await admin.auth().createUser({ email, password, displayName, disabled });
    // Sett role (admin kan sette opp til editor; owner kan sette alt)
    const actorRole = actor.role || "viewer";
    const elevated = ["admin","owner"];
    if (role){
      if (elevated.includes(role) && actorRole !== "owner"){
        return bad("Only owner can assign 'admin' or 'owner'", 403);
      }
      await admin.auth().setCustomUserClaims(user.uid, { role });
    }

    return ok({ uid: user.uid, email: user.email, role });
  }catch(err){
    const code = err.statusCode || 500;
    return bad(err.message || "Internal error", code);
  }
};
