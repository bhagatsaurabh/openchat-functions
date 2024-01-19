import { logger } from "firebase-functions/v1";
import { HttpsError } from "firebase-functions/v2/https";

const func = async (db, storage, request) => {
  const { groupId, messageId } = request.data;

  logger.log(groupId, messageId);

  const groupSnap = await db.collection("groups").doc(groupId).get();
  let group;
  if (!groupSnap.exists) {
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
  if (!msgSnap.exists) {
    throw new HttpsError("not-found", "Message not found");
  }
  msg = msgSnap.data();
  msg.timestamp = msg.timestamp.toDate();

  let numMembers = group.members.length - 1;
  group.members.splice(group.members.indexOf(request.auth.uid), 1);
  group.members.forEach((memberId) => {
    let syncTimestamp = group.sync[memberId];
    if (syncTimestamp) {
      syncTimestamp = syncTimestamp.toDate();
      if (syncTimestamp >= msg.timestamp) numMembers -= 1;
    }
  });

  if (numMembers <= 0) {
    await db
      .collection("groups")
      .doc(groupId)
      .collection("messages")
      .doc(messageId)
      .delete();

    if (msg.type === "file") {
      const file = storage.file(`groups/${groupId}/${msg.by}/${messageId}`);
      (await file.exists()) && (await file.delete());
    }
  } else {
    throw new HttpsError(
      "failed-precondition",
      "Message not yet delivered to every member"
    );
  }
};

export default func;
