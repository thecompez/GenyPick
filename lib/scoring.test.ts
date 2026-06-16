import { describe, expect, it } from "vitest";
import {
  calculateEstimatedReward,
  calculateScore,
  isPerfectWinner
} from "@/lib/scoring";

describe("scoring", () => {
  it("scores an exact Top 4 as 480", () => {
    const score = calculateScore(
      { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 },
      { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 }
    );
    expect(score.total).toBe(480);
    expect(score.championExact).toBe(true);
    expect(score.exactTopFour).toBe(true);
  });

  it("scores wrong-position Top 4 teams according to the published example", () => {
    const score = calculateScore(
      { champion: 1, runnerUp: 18, thirdPlace: 7, fourthPlace: 41 },
      { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 }
    );
    expect(score.total).toBe(96);
    expect(score.positions.map((position) => position.points)).toEqual([16, 16, 64, 0]);
  });

  it("does not give wrong-position points on top of an exact match", () => {
    const score = calculateScore(
      { champion: 18, runnerUp: 2, thirdPlace: 3, fourthPlace: 4 },
      { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 }
    );
    expect(score.total).toBe(256);
    expect(score.positions.map((position) => position.points)).toEqual([256, 0, 0, 0]);
  });

  it("scores all four correct teams in wrong positions as 64", () => {
    const score = calculateScore(
      { champion: 1, runnerUp: 7, thirdPlace: 34, fourthPlace: 18 },
      { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 }
    );
    expect(score.total).toBe(64);
    expect(score.positions.map((position) => position.points)).toEqual([16, 16, 16, 16]);
  });

  it("rewards only exact Top 4 winners with an equal split", () => {
    const finalResult = { champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 };
    expect(isPerfectWinner({ champion: 18, runnerUp: 1, thirdPlace: 7, fourthPlace: 34 }, finalResult)).toBe(true);
    expect(isPerfectWinner({ champion: 18, runnerUp: 1, thirdPlace: 34, fourthPlace: 7 }, finalResult)).toBe(false);
    expect(calculateEstimatedReward(7500, 3)).toBe(2500);
    expect(calculateEstimatedReward(7500, 0)).toBe(0);
  });
});
