export type TopFourPrediction = {
  champion: number;
  runnerUp: number;
  thirdPlace: number;
  fourthPlace: number;
};

export type ScoreBreakdown = {
  total: number;
  championExact: boolean;
  exactTopFour: boolean;
  positions: Array<{
    label: "Champion" | "Runner-up" | "Third place" | "Fourth place";
    teamId: number;
    points: number;
    reason: "exact" | "wrong-position" | "miss";
  }>;
};

const POSITION_POINTS = [256, 128, 64, 32] as const;
const POSITION_LABELS = ["Champion", "Runner-up", "Third place", "Fourth place"] as const;

export function predictionToArray(prediction: TopFourPrediction): number[] {
  return [
    prediction.champion,
    prediction.runnerUp,
    prediction.thirdPlace,
    prediction.fourthPlace
  ];
}

export function calculateScore(
  prediction: TopFourPrediction,
  finalResult: TopFourPrediction
): ScoreBreakdown {
  const picks = predictionToArray(prediction);
  const results = predictionToArray(finalResult);
  const positions: ScoreBreakdown["positions"] = picks.map((teamId, index) => {
    const exact = teamId === results[index];
    const inTopFour = results.includes(teamId);
    const reason: "exact" | "wrong-position" | "miss" = exact
      ? "exact"
      : inTopFour
        ? "wrong-position"
        : "miss";
    return {
      label: POSITION_LABELS[index],
      teamId,
      points: exact ? POSITION_POINTS[index] : inTopFour ? 16 : 0,
      reason
    };
  });

  return {
    total: positions.reduce((sum, item) => sum + item.points, 0),
    championExact: prediction.champion === finalResult.champion,
    exactTopFour: positions.every((position) => position.reason === "exact"),
    positions
  };
}

export function isPerfectWinner(prediction: TopFourPrediction, finalResult: TopFourPrediction): boolean {
  return calculateScore(prediction, finalResult).exactTopFour;
}

export function calculateEstimatedReward(
  rewardPoolGeny: number,
  perfectWinnerCount: number
): number {
  if (rewardPoolGeny <= 0 || perfectWinnerCount <= 0) {
    return 0;
  }
  return rewardPoolGeny / perfectWinnerCount;
}

export function scoreBadge(score?: number): { label: string; tone: "perfect" | "strong" | "eligible" | "low" | "pending" } {
  if (score === undefined || score === null) return { label: "Pending", tone: "pending" };
  if (score === 480) return { label: "480 Perfect", tone: "perfect" };
  if (score >= 256) return { label: "256+ Strong", tone: "strong" };
  if (score >= 128) return { label: "128+ Score", tone: "eligible" };
  return { label: "Below 128", tone: "low" };
}
