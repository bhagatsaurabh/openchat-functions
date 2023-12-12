const chai = require("chai");
const assert = chai.assert;
const {describe, after, it} = require("mocha");
const sinon = require("sinon");
const admin = require("firebase-admin");
const test = require("firebase-functions-test")();

describe("firebase-auth-delete-users", () => {
  const listUsersStub = sinon.stub();
  const deleteUsersStub = sinon.stub();
  const today = new Date();
  const nonExpiredDate = today.toISOString().slice(0, 10);

  let expiredDate = new Date();
  expiredDate.setDate(today.getDate() - 31);
  expiredDate = expiredDate.toISOString().slice(0, 10);

  listUsersStub.onCall(0).returns({
    users: [
      {uid: "1", providerData: [], metadata: {creationTime: expiredDate}},
      {uid: "2", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "3", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "4", providerData: [], metadata: {creationTime: expiredDate}},
      {uid: "5", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "6", providerData: [], metadata: {creationTime: expiredDate}},
      {uid: "7", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "8", providerData: [], metadata: {creationTime: expiredDate}},
    ],
    pageToken: 1,
  });
  listUsersStub.onCall(1).returns({
    users: [
      {uid: "9", providerData: [], metadata: {creationTime: expiredDate}},
      {uid: "10", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "11", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "12", providerData: [], metadata: {creationTime: expiredDate}},
      {uid: "13", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "14", providerData: [], metadata: {creationTime: expiredDate}},
      {uid: "15", providerData: [], metadata: {creationTime: nonExpiredDate}},
      {uid: "16", providerData: [], metadata: {creationTime: expiredDate}},
    ],
    pageToken: null,
  });

  sinon.stub(admin, "initializeApp");
  sinon.stub(admin, "auth").get(() => () => ({
    listUsers: listUsersStub,
    deleteUsers: deleteUsersStub,
  }));

  const functions = require("../index");

  after(() => {
    test.cleanup();
  });

  describe("accountcleanup", () => {
    it("should delete all anonymous users older than 30 days", async () => {
      const wrapped = test.wrap(functions.accountcleanup);
      await wrapped();

      assert.deepStrictEqual(deleteUsersStub.getCall(0).args[0], ["1", "4", "6", "8"]);
      assert.deepStrictEqual(deleteUsersStub.getCall(1).args[0], ["9", "12", "14", "16"]);
    });
  });
});
