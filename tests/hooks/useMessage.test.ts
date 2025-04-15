import { renderHook, act } from "@testing-library/react";
import { useMessages } from "@/hooks/useMessages";
import { decryptMessage } from "@/lib/encrypt";

jest.mock("@/lib/encrypt", () => ({
  decryptMessage: jest.fn((msg) => `decrypted-${msg}`),
}));

global.fetch = jest.fn();

describe("useMessages", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("fetches and decrypts messages on mount", async () => {
    const mockMessages = [
      {
        id: "1",
        message: "encrypted-msg1",
        userId: "user1",
        userName: "User 1",
      },
      {
        id: "2",
        message: "encrypted-msg2",
        userId: "user2",
        userName: "User 2",
      },
    ];
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: mockMessages }),
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useMessages("group1", { id: "user1", name: "User 1" }),
    );

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith("/api/messages?groupId=group1");
    expect(decryptMessage).toHaveBeenCalledTimes(2);
    expect(result.current.messages).toEqual([
      {
        id: "1",
        message: "decrypted-encrypted-msg1",
        userId: "user1",
        userName: "User 1",
      },
      {
        id: "2",
        message: "decrypted-encrypted-msg2",
        userId: "user2",
        userName: "User 2",
      },
    ]);
    expect(result.current.userIdToName).toEqual({
      user1: "User 1",
      user2: "User 2",
    });
  });

  it("handles fetch failure gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useMessages("group1", { id: "user1", name: "User 1" }),
    );

    await waitForNextUpdate();

    expect(fetch).toHaveBeenCalledWith("/api/messages?groupId=group1");
    expect(result.current.messages).toEqual([]);
    expect(result.current.userIdToName).toEqual({});
  });

  it("adds a new message without duplicates", () => {
    const { result } = renderHook(() => useMessages("group1", null));

    act(() => {
      result.current.addMessage({ id: "1", message: "Hello", userId: "user1" });
    });

    act(() => {
      result.current.addMessage({ id: "1", message: "Hello", userId: "user1" });
    });

    expect(result.current.messages).toEqual([
      { id: "1", message: "Hello", userId: "user1" },
    ]);
  });

  it("updates an existing message", () => {
    const { result } = renderHook(() => useMessages("group1", null));

    act(() => {
      result.current.addMessage({ id: "1", message: "Hello", userId: "user1" });
    });

    act(() => {
      result.current.updateMessage("1", {
        id: "1",
        message: "Updated",
        userId: "user1",
      });
    });

    expect(result.current.messages).toEqual([
      { id: "1", message: "Updated", userId: "user1" },
    ]);
  });

  it("updates read receipts for a message", () => {
    const { result } = renderHook(() => useMessages("group1", null));

    act(() => {
      result.current.addMessage({
        id: "1",
        message: "Hello",
        userId: "user1",
        readBy: [],
      });
    });

    act(() => {
      result.current.updateReadReceipt("1", "user2");
    });

    expect(result.current.messages).toEqual([
      { id: "1", message: "Hello", userId: "user1", readBy: ["user2"] },
    ]);
  });

  it("updates user name mapping", () => {
    const { result } = renderHook(() => useMessages("group1", null));

    act(() => {
      result.current.updateUserName("user1", "New User 1");
    });

    expect(result.current.userIdToName).toEqual({
      user1: "New User 1",
    });
  });
});
