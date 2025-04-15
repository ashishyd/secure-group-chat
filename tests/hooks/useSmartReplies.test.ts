import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useSmartReplies } from "@/hooks/useSmartReplies";

it("clears smart replies when clearSmartReplies is called", () => {
  const { result } = renderHook(() => useSmartReplies());

  act(() => {
    result.current.clearSmartReplies();
  });

  expect(result.current.smartReplies).toEqual([]);
});

it("does not update smartReplies if API response does not contain suggestions", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValueOnce({}),
  });

  const { result } = renderHook(() => useSmartReplies());

  await act(async () => {
    await result.current.fetchSmartReplies("Hi");
  });

  expect(result.current.smartReplies).toEqual([]);
});

it("does not update smartReplies if API response suggestions is not an array", async () => {
  (fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: jest.fn().mockResolvedValueOnce({ suggestions: "Not an array" }),
  });

  const { result } = renderHook(() => useSmartReplies());

  await act(async () => {
    await result.current.fetchSmartReplies("Hi");
  });

  expect(result.current.smartReplies).toEqual([]);
});

it("does not throw an error if clearSmartReplies is called before any fetch", () => {
  const { result } = renderHook(() => useSmartReplies());

  act(() => {
    result.current.clearSmartReplies();
  });

  expect(result.current.smartReplies).toEqual([]);
});
