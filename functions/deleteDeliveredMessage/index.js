import { HttpsError } from "firebase-functions/v2/https";

const func = async (db, request) => {
  const { groupId, messageId } = request.data;

  const groupSnap = await db.collection("groups").doc(groupId).get();
  let group;
  if (!groupSnap.exists()) {
    throw new HttpsError("not-found", "Group not found");
  }
  group = groupSnap.data();

  if (!group.members.includes(request.auth.uid)) {
    throw new HttpsError("permission-denied", "Not a member of the group");
  }

  const msgSnap = await db
    .collection("groups")
    .doc(groupId)
    .collection("messages")
    .doc(messageId)
    .get();
  let msg;
  if (!msgSnap.exists()) {
    throw new HttpsError("not-found", "Message not found");
  }
  msg = msgSnap.data();

  let numMembers = group.members.length;
  group.members.forEach((memberId) => {
    let syncTimestamp = group.sync[memberId];
    if (syncTimestamp) {
      syncTimestamp = syncTimestamp.toDate();
    }
    if (syncTimestamp >= msg.timestamp) numMembers -= 1;
  });

  if (numMembers <= 0) {
    await db
      .collection("groups")
      .doc(groupId)
      .collection("messages")
      .doc(messageId)
      .delete();
  } else {
    throw new HttpsError(
      "failed-precondition",
      "Message not yet delivered to every member"
    );
  }
};

export default func;
