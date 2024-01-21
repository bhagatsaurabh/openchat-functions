import { FieldValue, Timestamp } from "firebase-admin/firestore";

const diff = (arr1 = [], arr2 = []) => {
  const arr2Set = new Set(arr2);
  return arr1.filter((x) => !arr2Set.has(x));
};
const symDiff = (arr1, arr2) => diff(arr1, arr2).concat(diff(arr2, arr1));

const func = async (db, event) => {
  const oldData = event.data.before.data();
  const newData = event.data.after.data();
  if (!newData.modifiedBy) return;

  const memberSymDiff = symDiff(oldData.members, newData.members);
  const adminSymDiff = symDiff(oldData.admins, newData.admins);

  let sysMsgs = [];
  if (newData.name !== oldData.name) {
    sysMsgs.push({
      by: "system",
      timestamp: FieldValue.serverTimestamp(),
      expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
      text: `##${newData.modifiedBy} changed group name to ${newData.name}`,
      type: "text",
    });
  } else if (!newData.members.includes(newData.modifiedBy)) {
    sysMsgs.push({
      by: "system",
      timestamp: FieldValue.serverTimestamp(),
      expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
      text: `##${newData.modifiedBy} left the group`,
      type: "text",
    });
  } else if (memberSymDiff.length || adminSymDiff.length) {
    const addedMembers = newData.members.filter(
      (x) => !oldData.members.includes(x)
    );
    const removedMembers = oldData.members.filter(
      (x) => !newData.members.includes(x)
    );
    const addedAdmins = oldData.members.filter(
      (x) => !oldData.admins.includes(x) && newData.admins.includes(x)
    );
    const removedAdmins = oldData.members.filter(
      (x) => oldData.admins.includes(x) && !newData.admins.includes(x)
    );
    if (addedMembers.length) {
      sysMsgs.push({
        by: "system",
        timestamp: FieldValue.serverTimestamp(),
        expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
        text: `##${newData.modifiedBy} added {${addedMembers
          .map((id) => "##" + id)
          .join(" ")}} to the group`,
        type: "text",
      });
    }
    if (removedMembers.length) {
      sysMsgs.push({
        by: "system",
        timestamp: FieldValue.serverTimestamp(),
        expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
        text: `##${newData.modifiedBy} removed {${removedMembers
          .map((id) => "##" + id)
          .join(" ")}} from the group`,
        type: "text",
      });
    }
    if (addedAdmins.length) {
      sysMsgs.push({
        by: "system",
        timestamp: FieldValue.serverTimestamp(),
        expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
        text: `##${newData.modifiedBy} made {${addedAdmins
          .map((id) => "##" + id)
          .join(" ")}} ${addedAdmins.length === 1 ? "an admin" : "admins"}`,
        type: "text",
      });
    }
    if (removedAdmins.length) {
      sysMsgs.push({
        by: "system",
        timestamp: FieldValue.serverTimestamp(),
        expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
        text: `##${newData.modifiedBy} revoked adminship from {${removedAdmins
          .map((id) => "##" + id)
          .join(" ")}}`,
        type: "text",
      });
    }
  } else if (newData.avatarUrl !== oldData.avatarUrl) {
    sysMsgs.push({
      by: "system",
      timestamp: FieldValue.serverTimestamp(),
      expiry: Timestamp.fromDate(new Date(Date.now() + 864000000)),
      text: `##${newData.modifiedBy} changed the group icon`,
      type: "text",
    });
  }

  await Promise.all(
    sysMsgs.map((msg) =>
      db
        .collection("groups")
        .doc(event.params.groupId)
        .collection("messages")
        .add(msg)
    )
  );
};

export default func;
