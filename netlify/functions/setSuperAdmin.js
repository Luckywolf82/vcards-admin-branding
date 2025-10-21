// netlify/functions/setSuperAdmin.js
import admin from "firebase-admin";

let inited=false;
function init(){
  if(inited) return;
  const projectId=process.env.FIREBASE_PROJECT_ID;
  const clientEmail=process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey=(process.env.FIREBASE_PRIVATE_KEY||"").replace(/\\n/g,"\n");
  if(!projectId||!clientEmail||!privateKey) throw new Error("Firebase Admin credentials are missing");
  if(!admin.apps.length){ admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) }); }
  inited=true;
}

export async function handler(event){
  try{
    if(event.httpMethod!=="POST") return { statusCode:405, body:"Method Not Allowed" };
    const { uid, role="superadmin", secret } = JSON.parse(event.body||"{}");
    if(!secret || secret!==process.env.SUPERADMIN_SECRET) return { statusCode:403, body:JSON.stringify({ok:false,error:"Unauthorized"}) };
    if(!uid) return { statusCode:400, body:JSON.stringify({ok:false,error:"Missing uid"}) };
    init();
    await admin.auth().setCustomUserClaims(uid,{ role });
    return { statusCode:200, headers:{ "Content-Type":"application/json" }, body:JSON.stringify({ ok:true, uid, role }) };
  }catch(err){
    console.error("[setSuperAdmin]",err);
    return { statusCode:500, body:JSON.stringify({ ok:false, error: err.message }) };
  }
}
