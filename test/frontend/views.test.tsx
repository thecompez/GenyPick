import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { ShareCard } from "@/components/ShareCard";
import { RulesModal } from "@/components/RulesModal";
import { deriveLeaderboardStats, sortLeaderboard, type LeaderboardRow } from "@/lib/leaderboard";

vi.mock("@/components/FarcasterProvider", () => ({
  useFarcaster: () => ({
    user: { fid: 1, username: "alice", displayName: "Alice" },
    isMiniApp: true
  })
}));

const rows: LeaderboardRow[] = sortLeaderboard(
  [
    {
      rank: 1,
      walletAddress: "0x0000000000000000000000000000000000000001",
      username: "alice",
      displayName: "Alice",
      prediction: { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 },
      entryAmount: 256,
      score: 480,
      championExact: true,
      exactMatch: true,
      estimatedReward: 320,
      submittedAt: new Date().toISOString()
    }
  ],
  true
);

describe("app views", () => {
  it("renders success screen with prediction and actions", () => {
    render(
      <ShareCard
        prediction={{ champion: 1, runnerUp: 18, thirdPlace: 7, fourthPlace: 41 }}
        entryAmount="256"
        txHash="0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        onCast={vi.fn()}
        onLeaderboard={vi.fn()}
      />
    );

    expect(screen.getByText("Prediction Submitted")).toBeInTheDocument();
    expect(screen.getByText("Cast My Prediction")).toBeInTheDocument();
  });

  it("renders leaderboard before final result", () => {
    render(<LeaderboardTable response={{ rows, stats: deriveLeaderboardStats(rows, false) }} finalized={false} />);
    expect(screen.getByText("Latest active cards before final results")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders leaderboard after final result with score badges", () => {
    render(<LeaderboardTable response={{ rows, stats: deriveLeaderboardStats(rows, true) }} finalized />);
    expect(screen.getByText("Final scoring and exact-winner rewards")).toBeInTheDocument();
    expect(screen.getByText("480 Perfect")).toBeInTheDocument();
  });

  it("renders rules screen with disclaimer and scoring table", () => {
    render(<RulesModal />);
    expect(screen.getByText("Champion exact")).toBeInTheDocument();
    expect(screen.getByText(/Participation does not guarantee profit/)).toBeInTheDocument();
  });
});
