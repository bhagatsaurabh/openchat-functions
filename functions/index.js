const {onSchedule} = require("firebase-functions/v2/scheduler");
const {logger} = require("firebase-functions");
const admin = require("firebase-admin");
const {setTimeout}= require("timers/promises");
const {setGlobalOptions} = require("firebase-functions/v2/options");

setGlobalOptions({maxInstances: 2});

admin.initializeApp();
const auth = admin.auth();
const msInADay = 1000 * 60 * 60 * 24;

const deleteExpiredAnonymousUsers = async (nextPageToken) => {
  const today = new Date();
  try {
    const page = await auth.listUsers(1000, nextPageToken);
    const expiredAnonymousUsers = page.users
        .filter((user) => user.providerData.length === 0)
        .filter((user) => Math.floor((today - new Date(user.metadata.creationTime)) / msInADay) >= 30)
        .map((user) => user.uid);

    await auth.deleteUsers(expiredAnonymousUsers);

    if (page.pageToken) {
      deleteExpiredAnonymousUsers(page.pageToken);
    }
  } catch (error) {
    console.log(error);
  }
  // Wait 1 second to avoid 1QPS quota limit on auth.deleteUsers()
  await setTimeout(1000);
};

exports.accountcleanup = onSchedule("every day 00:00", async () => {
  logger.info("Anonymous users cleanup started");

  await deleteExpiredAnonymousUsers();

  logger.info("Anonymous users cleanup finished");
});
