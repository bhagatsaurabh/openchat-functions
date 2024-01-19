import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall } from "firebase-functions/v2/https";
import { logger } from "firebase-functions";
import admin from "firebase-admin";
import { setGlobalOptions } from "firebase-functions/v2/options";
import deleteExpiredAnonymousUsers from "./deleteExpiredAnonymousUsers/index.js";
import deleteDeliveredMessage from "./deleteDeliveredMessage/index.js";

setGlobalOptions({ maxInstances: 2 });
admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();
const storage = admin.storage().bucket();

export const accountcleanup = onSchedule("every day 00:00", async () => {
  logger.info("Anonymous users cleanup started");

  await deleteExpiredAnonymousUsers(auth);

  logger.info("Anonymous users cleanup finished");
});

export const deleteMessage = onCall(
  /* { cors: [/firebase\.com$/, "flutter.com"] }, */
  async (request) => await deleteDeliveredMessage(db, storage, request)
);
