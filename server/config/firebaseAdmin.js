const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT
);

const app = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        ...serviceAccount,
        private_key: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
    });

const adminAuth = getAuth(app);

module.exports = adminAuth;