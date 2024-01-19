import { jest, beforeAll, afterAll, describe, expect } from "@jest/globals";
import test from "firebase-functions-test";

const { cleanup, wrap } = test();

const mockListUsersStub = jest.fn();
const mockDeleteUsersStub = jest.fn();
const today = new Date();
const nonExpiredDate = today.toISOString().slice(0, 10);

let expiredDate = new Date();
expiredDate.setDate(today.getDate() - 31);
expiredDate = expiredDate.toISOString().slice(0, 10);

mockListUsersStub
  .mockReturnValueOnce({
    users: [
      { uid: "1", providerData: [], metadata: { creationTime: expiredDate } },
      {
        uid: "2",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      {
        uid: "3",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      { uid: "4", providerData: [], metadata: { creationTime: expiredDate } },
      {
        uid: "5",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      { uid: "6", providerData: [], metadata: { creationTime: expiredDate } },
      {
        uid: "7",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      { uid: "8", providerData: [], metadata: { creationTime: expiredDate } },
    ],
    pageToken: 1,
  })
  .mockReturnValueOnce({
    users: [
      { uid: "9", providerData: [], metadata: { creationTime: expiredDate } },
      {
        uid: "10",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      {
        uid: "11",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      {
        uid: "12",
        providerData: [],
        metadata: { creationTime: expiredDate },
      },
      {
        uid: "13",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      {
        uid: "14",
        providerData: [],
        metadata: { creationTime: expiredDate },
      },
      {
        uid: "15",
        providerData: [],
        metadata: { creationTime: nonExpiredDate },
      },
      {
        uid: "16",
        providerData: [],
        metadata: { creationTime: expiredDate },
      },
    ],
    pageToken: null,
  });

jest.mock("firebase-admin", () => ({
  initializeApp: jest.fn(),
  auth: jest.fn(() => ({
    listUsers: mockListUsersStub,
    deleteUsers: mockDeleteUsersStub,
  })),
  firestore: jest.fn(),
  storage: jest.fn(() => ({ bucket: jest.fn() })),
}));

describe("openchat-functions", () => {
  let functions;
  beforeAll(async () => {
    functions = await import("../index");
  });

  afterAll(() => {
    cleanup();
  });

  describe("accountcleanup", () => {
    it("should delete all anonymous users older than 30 days", async () => {
      const wrapped = wrap(functions.accountcleanup);
      await wrapped();

      console.log(mockDeleteUsersStub.mock.calls);
      expect(mockDeleteUsersStub.mock.calls).toEqual([
        [["1", "4", "6", "8"]],
        [["9", "12", "14", "16"]],
      ]);
    });
  });
});
