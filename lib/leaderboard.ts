import { getTeamName } from "@/lib/teams";

export type LeaderboardRow = {
  rank: number;
  walletAddress: string;
  fid?: number | null;
  username?: string | null;
  displayName?: string | null;
  pfpUrl?: string | null;
  prediction: {
    champion: number;
    runnerUp: number;
    thirdPlace: number;
    fourthPlace: number;
  };
  entryAmount: number;
  txHash?: string;
  attemptNumber?: number;
  score?: number | null;
  championExact?: boolean;
  exactMatch?: boolean | null;
  eligible?: boolean | null;
  estimatedReward?: number | null;
  submittedAt: string;
};

export type LeaderboardStats = {
  totalPool: number;
  rewardPool: number;
  participants: number;
  mostPickedChampion?: string;
  mostPickedTopFour: string[];
  finalized: boolean;
};

export type LeaderboardResponse = {
  rows: LeaderboardRow[];
  stats: LeaderboardStats;
};

export function sortLeaderboard(rows: LeaderboardRow[], finalized: boolean): LeaderboardRow[] {
  const sorted = [...rows].sort((a, b) => {
    if (finalized) {
      const exactDiff = Number(Boolean(b.exactMatch)) - Number(Boolean(a.exactMatch));
      if (exactDiff !== 0) return exactDiff;
      const scoreDiff = (b.score ?? 0) - (a.score ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
    }
    return new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
  });

  return sorted.map((row, index) => ({ ...row, rank: index + 1 }));
}

export function deriveLeaderboardStats(rows: LeaderboardRow[], finalized = false): LeaderboardStats {
  const totalPool = rows.reduce((sum, row) => sum + Number(row.entryAmount), 0);
  const championCounts = new Map<number, number>();
  const topFourCounts = new Map<number, number>();
  rows.forEach((row) => {
    const ids = [
      row.prediction.champion,
      row.prediction.runnerUp,
      row.prediction.thirdPlace,
      row.prediction.fourthPlace
    ];
    championCounts.set(ids[0], (championCounts.get(ids[0]) ?? 0) + 1);
    ids.forEach((id) => topFourCounts.set(id, (topFourCounts.get(id) ?? 0) + 1));
  });
  const mostPickedChampion = [...championCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const mostPickedTopFour = [...topFourCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([id]) => getTeamName(id));

  return {
    totalPool,
    rewardPool: (totalPool * 75) / 100,
    participants: rows.length,
    mostPickedChampion: mostPickedChampion ? getTeamName(mostPickedChampion) : undefined,
    mostPickedTopFour,
    finalized
  };
}

export const demoRows: LeaderboardRow[] = sortLeaderboard(
  [
    {
      rank: 1,
      walletAddress: "0x9d8f00000000000000000000000000000000A1ce",
      fid: 256,
      username: "genyfan",
      displayName: "Geny Fan",
      prediction: { champion: 1, runnerUp: 18, thirdPlace: 7, fourthPlace: 41 },
      entryAmount: 256,
      attemptNumber: 1,
      submittedAt: new Date(Date.now() - 5_400_000).toISOString()
    },
    {
      rank: 2,
      walletAddress: "0x8a7b00000000000000000000000000000000B0b0",
      fid: 480,
      username: "topfour",
      displayName: "Top Four",
      prediction: { champion: 18, runnerUp: 1, thirdPlace: 34, fourthPlace: 7 },
      entryAmount: 256,
      attemptNumber: 1,
      submittedAt: new Date(Date.now() - 3_900_000).toISOString()
    },
    {
      rank: 3,
      walletAddress: "0x7c6d00000000000000000000000000000000C0de",
      fid: 8453,
      username: "basebuilder",
      displayName: "Base Builder",
      prediction: { champion: 7, runnerUp: 41, thirdPlace: 18, fourthPlace: 34 },
      entryAmount: 256,
      attemptNumber: 1,
      submittedAt: new Date(Date.now() - 1_800_000).toISOString()
    }
  ],
  false
);
