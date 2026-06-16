import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EntryAmountInput } from "@/components/EntryAmountInput";
import { ReviewSheet } from "@/components/ReviewSheet";
import { TeamSelector } from "@/components/TeamSelector";
import { WORLD_CUP_2026_TEAMS } from "@/lib/teams";
import { validateEntryAmount } from "@/lib/validation";

describe("prediction UI controls", () => {
  it("disables duplicate team choices in the selector", () => {
    render(
      <TeamSelector
        title="1st Place"
        teams={WORLD_CUP_2026_TEAMS}
        selectedIds={[1, 18]}
        selectedTeamId={1}
        onSelect={vi.fn()}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId("team-option-18")).toBeDisabled();
    expect(screen.getByTestId("team-option-1")).not.toBeDisabled();
  });

  it("shows fixed card price validation", () => {
    render(
      <EntryAmountInput
        balance="1000"
        validation={validateEntryAmount("100")}
      />
    );

    expect(screen.getByText("Card price is exactly 256 GENY")).toBeInTheDocument();
  });

  it("shows fixed card price copy", () => {
    render(
      <EntryAmountInput
        balance="1000"
        validation={validateEntryAmount("256")}
      />
    );

    expect(screen.getByText("256 GENY")).toBeInTheDocument();
    expect(screen.getByText(/Paying more is not supported/)).toBeInTheDocument();
  });

  it("shows approval flow states", () => {
    render(
      <ReviewSheet
        prediction={{ champion: 1, runnerUp: 18, thirdPlace: 7, fourthPlace: 41 }}
        entryAmount="256"
        phase="approving"
        balance="1000"
        attemptCount={0}
        maxAttempts={32}
        totalPaidByUser="0"
        submissionsLocked={false}
        paused={false}
        finalized={false}
        contractConfigured
        isCorrectNetwork
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getAllByText("Approving GENY").length).toBeGreaterThan(0);
  });

  it("shows submission success state", () => {
    render(
      <ReviewSheet
        prediction={{ champion: 1, runnerUp: 18, thirdPlace: 7, fourthPlace: 41 }}
        entryAmount="256"
        phase="submitted"
        balance="1000"
        attemptCount={0}
        maxAttempts={32}
        totalPaidByUser="0"
        submissionsLocked={false}
        paused={false}
        finalized={false}
        contractConfigured
        isCorrectNetwork
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText("Prediction submitted")).toBeInTheDocument();
  });
});
