import { setTimeout } from "timers/promises";

const msInADay = 1000 * 60 * 60 * 24;

const func = async (auth, nextPageToken) => {
  const today = new Date();
  try {
    const page = await auth.listUsers(1000, nextPageToken);
    const expiredAnonymousUsers = page.users
      .filter((user) => user.providerData.length === 0)
      .filter(
        (user) =>
          Math.floor(
            (today - new Date(user.metadata.creationTime)) / msInADay
          ) >= 30
      )
      .map((user) => user.uid);

    await auth.deleteUsers(expiredAnonymousUsers);

    if (page.pageToken) {
      func(auth, page.pageToken);
    }
  } catch (error) {
    console.log(error);
  }
  // Wait 1 second to avoid 1QPS quota limit on auth.deleteUsers()
  await setTimeout(1000);
};

export default func;
