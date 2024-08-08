const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors({origin: true}));
app.use(express.json());

// Firebase config endpoint
app.get("/api/firebase-config", (req, res) => {
  const config = {
    apiKey: functions.config().appconfig.api_key,
    authDomain: functions.config().appconfig.auth_domain,
    projectId: functions.config().appconfig.project_id,
    storageBucket: functions.config().appconfig.storage_bucket,
    messagingSenderId: functions.config().appconfig.messaging_sender_id,
    appId: functions.config().appconfig.app_id
  };
  res.json(config);
});

// Example endpoint
app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello from Firebase Functions!" });
});

// Export the function with a specific region
exports.api = functions.region("europe-west1").https.onRequest(app);