import { renderHook, act } from "@testing-library/react";
import { useBroadcast } from "@/hooks/useBroadcast";

describe("useBroadcast", () => {
  it("posts messages to the broadcast channel", () => {
    const mockPostMessage = jest.fn();
    const mockBroadcastChannel = jest.fn(() => ({
      postMessage: mockPostMessage,
      close: jest.fn(),
    }));
    (global as any).BroadcastChannel = mockBroadcastChannel;

    const { result } = renderHook(() =>
      useBroadcast("test-channel", jest.fn()),
    );

    act(() => {
      result.current({ key: "value" });
    });

    expect(mockPostMessage).toHaveBeenCalledWith({ key: "value" });
  });

  it("receives messages from the broadcast channel", () => {
    const mockOnMessage = jest.fn();
    const mockBroadcastChannel = jest.fn(() => ({
      postMessage: jest.fn(),
      close: jest.fn(),
      onmessage: null,
    }));
    (global as any).BroadcastChannel = mockBroadcastChannel;

    renderHook(() => useBroadcast("test-channel", mockOnMessage));

    const onMessageHandler =
      mockBroadcastChannel.mock.results[0].value.onmessage;
    act(() => {
      onMessageHandler({ data: { key: "value" } });
    });

    expect(mockOnMessage).toHaveBeenCalledWith({ key: "value" });
  });

  it("closes the broadcast channel on unmount", () => {
    const mockClose = jest.fn();
    const mockBroadcastChannel = jest.fn(() => ({
      postMessage: jest.fn(),
      close: mockClose,
    }));
    (global as any).BroadcastChannel = mockBroadcastChannel;

    const { unmount } = renderHook(() =>
      useBroadcast("test-channel", jest.fn()),
    );

    unmount();

    expect(mockClose).toHaveBeenCalled();
  });

  it("creates a new broadcast channel when channelName changes", () => {
    const mockClose = jest.fn();
    const mockBroadcastChannel = jest.fn(() => ({
      postMessage: jest.fn(),
      close: mockClose,
    }));
    (global as any).BroadcastChannel = mockBroadcastChannel;

    const { rerender } = renderHook(
      ({ channelName }) => useBroadcast(channelName, jest.fn()),
      { initialProps: { channelName: "channel-1" } },
    );

    rerender({ channelName: "channel-2" });

    expect(mockClose).toHaveBeenCalled();
    expect(mockBroadcastChannel).toHaveBeenCalledWith("channel-2");
  });
});
