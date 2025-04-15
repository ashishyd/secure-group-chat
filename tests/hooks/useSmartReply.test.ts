import { renderHook, act } from "@testing-library/react";
import { useSmartReply } from "@/hooks/useSmartReply";

global.fetch = jest.fn();

describe("useSmartReply", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns suggestions after a successful API call", async () => {
    const mockResponse = { suggestions: ["Hello", "How are you?"] };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const { result } = renderHook(() => useSmartReply());

    await act(async () => {
      await result.current.fetchSmartReplies("Hi");
    });

    expect(result.current.suggestions).toEqual(mockResponse.suggestions);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("handles API errors gracefully", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: "Internal Server Error",
    });

    const { result } = renderHook(() => useSmartReply());

    await act(async () => {
      await result.current.fetchSmartReplies("Hi");
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Error: Internal Server Error");
  });

  it("handles network errors gracefully", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    const { result } = renderHook(() => useSmartReply());

    await act(async () => {
      await result.current.fetchSmartReplies("Hi");
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("Network Error");
  });

  it("sets loading to true while fetching and false after completion", async () => {
    const mockResponse = { suggestions: ["Hello"] };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const { result } = renderHook(() => useSmartReply());

    act(() => {
      result.current.fetchSmartReplies("Hi");
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await result.current.fetchSmartReplies("Hi");
    });

    expect(result.current.loading).toBe(false);
  });

  it("clears previous suggestions and error before fetching new ones", async () => {
    const mockResponse = { suggestions: ["Hello"] };
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce(mockResponse),
    });

    const { result } = renderHook(() => useSmartReply());

    await act(async () => {
      await result.current.fetchSmartReplies("Hi");
    });

    expect(result.current.suggestions).toEqual(mockResponse.suggestions);
    expect(result.current.error).toBeNull();

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network Error"));

    await act(async () => {
      await result.current.fetchSmartReplies("Hello again");
    });

    expect(result.current.suggestions).toEqual([]);
    expect(result.current.error).toBe("Network Error");
  });
});
