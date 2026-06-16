import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FarcasterProvider, useFarcaster } from "@/components/FarcasterProvider";

const sdkMock = vi.hoisted((): {
  isInMiniApp: ReturnType<typeof vi.fn>;
  context: Promise<unknown>;
  actions: {
    ready: ReturnType<typeof vi.fn>;
    addMiniApp: ReturnType<typeof vi.fn>;
    composeCast: ReturnType<typeof vi.fn>;
    openUrl: ReturnType<typeof vi.fn>;
  };
} => ({
  isInMiniApp: vi.fn(),
  context: Promise.resolve(null),
  actions: {
    ready: vi.fn(),
    addMiniApp: vi.fn(),
    composeCast: vi.fn(),
    openUrl: vi.fn()
  }
}));

vi.mock("@farcaster/miniapp-sdk", () => ({ sdk: sdkMock }));

function Probe() {
  const farcaster = useFarcaster();
  if (farcaster.isLoading) return <div>Loading</div>;
  return (
    <div>
      <span>{farcaster.isMiniApp ? "Mini App" : "Browser"}</span>
      <span>{farcaster.user?.username ?? "No user"}</span>
    </div>
  );
}

describe("FarcasterProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sdkMock.context = Promise.resolve(null);
  });

  it("loads Farcaster context and calls ready inside a Mini App", async () => {
    sdkMock.isInMiniApp.mockResolvedValue(true);
    sdkMock.context = Promise.resolve({
      user: { fid: 123, username: "alice", displayName: "Alice" },
      client: { added: true }
    });

    render(
      <FarcasterProvider>
        <Probe />
      </FarcasterProvider>
    );

    await waitFor(() => expect(screen.getByText("Mini App")).toBeInTheDocument());
    expect(screen.getByText("alice")).toBeInTheDocument();
    expect(sdkMock.actions.ready).toHaveBeenCalledTimes(1);
  });

  it("falls back gracefully in a normal browser", async () => {
    sdkMock.isInMiniApp.mockResolvedValue(false);

    render(
      <FarcasterProvider>
        <Probe />
      </FarcasterProvider>
    );

    await waitFor(() => expect(screen.getByText("Browser")).toBeInTheDocument());
    expect(screen.getByText("No user")).toBeInTheDocument();
    expect(sdkMock.actions.ready).not.toHaveBeenCalled();
  });
});
