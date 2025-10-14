const { admin, requireRole } = require("./_lib/auth");

function ok(data, code=200){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:true, ...data }) }; }
function bad(msg, code=400){ return { statusCode: code, headers: cors(), body: JSON.stringify({ ok:false, error:msg }) }; }
function cors(){ return { "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Headers":"Content-Type, Authorization", "Access-Control-Allow-Methods":"OPTIONS,POST" }; }

exports.handler = async (evt) => {
  if (evt.httpMethod === "OPTIONS") return ok({});
  if (evt.httpMethod !== "POST") return bad("Method not allowed", 405);

  try{
    await requireRole(evt, "admin");
    const body = JSON.parse(evt.body || "{}");
    const { uid, disabled } = body;
    if(!uid || typeof disabled !== "boolean") return bad("Missing uid/disabled:boolean", 400);

    await admin.auth().updateUser(uid, { disabled });
    return ok({ uid, disabled });
  }catch(err){
    const code = err.statusCode || 500;
    return bad(err.message || "Internal error", code);
  }
};
