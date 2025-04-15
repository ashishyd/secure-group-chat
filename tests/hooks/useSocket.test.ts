import { renderHook, act } from "@testing-library/react";
import { useSocket } from "./useSocket";
import { io } from "socket.io-client";

jest.mock("socket.io-client");

describe("useSocket", () => {
  it("returns a Socket.IO instance after initialization", () => {
    const mockSocket = { disconnect: jest.fn() };
    (io as jest.Mock).mockReturnValue(mockSocket);

    const { result } = renderHook(() => useSocket());

    expect(result.current).toBe(mockSocket);
  });

  it("disconnects the socket on unmount", () => {
    const mockSocket = { disconnect: jest.fn() };
    (io as jest.Mock).mockReturnValue(mockSocket);

    const { unmount } = renderHook(() => useSocket());
    unmount();

    expect(mockSocket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("returns null if no socket is initialized", () => {
    (io as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useSocket());

    expect(result.current).toBeNull();
  });

  it("does not reinitialize the socket on re-render", () => {
    const mockSocket = { disconnect: jest.fn() };
    (io as jest.Mock).mockReturnValue(mockSocket);

    const { result, rerender } = renderHook(() => useSocket());
    rerender();

    expect(result.current).toBe(mockSocket);
    expect(io).toHaveBeenCalledTimes(1);
  });
});
