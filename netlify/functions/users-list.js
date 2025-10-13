// netlify/functions/users-list.js
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
    }),
  });
}

exports.handler = async () => {
  try {
    const auth = admin.auth();
    const users = [];
    let nextPageToken = undefined;

    do {
      const result = await auth.listUsers(1000, nextPageToken);
      result.users.forEach(u =>
        users.push({
          uid: u.uid,
          email: u.email,
          displayName: u.displayName || "",
          disabled: u.disabled,
          createdAt: u.metadata.creationTime,
        })
      );
      nextPageToken = result.pageToken;
    } while (nextPageToken);

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, data: users }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ ok: false, error: err.message }),
    };
  }
};
