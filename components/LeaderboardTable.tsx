"use client";

import { Award, Crown, Trophy, UsersRound, type LucideIcon } from "lucide-react";
import type { LeaderboardResponse, LeaderboardRow } from "@/lib/leaderboard";
import { compactAddress, formatDateTime } from "@/lib/format";
import { scoreBadge } from "@/lib/scoring";
import { getFlagLabel, getTeamById, getTeamName } from "@/lib/teams";
import { cn } from "@/lib/utils";

export function LeaderboardTable({
  response,
  finalized
}: {
  response: LeaderboardResponse;
  finalized: boolean;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">Leaderboard</h2>
        <p className="mt-1 text-sm text-white/58">
          {finalized ? "Final scoring and exact-winner rewards" : "Latest active cards before final results"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon={Trophy} label="Total pool" value={`${response.stats.totalPool.toLocaleString()} GENY`} />
        <SummaryCard icon={Award} label="Reward estimate" value={`${response.stats.rewardPool.toLocaleString()} GENY`} />
        <SummaryCard icon={UsersRound} label="Participants" value={response.stats.participants.toLocaleString()} />
        <SummaryCard icon={Crown} label="Most picked champion" value={response.stats.mostPickedChampion ?? "Pending"} />
      </div>

      {response.stats.mostPickedTopFour.length > 0 && (
        <div className="panel rounded-[22px] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Most picked Top 4 teams</p>
          <div className="flex flex-wrap gap-2">
            {response.stats.mostPickedTopFour.map((team) => (
              <span key={team} className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-bold text-white/75">
                {team}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {response.rows.length === 0 ? (
          <div className="panel rounded-[22px] p-6 text-center">
            <p className="font-bold text-white">No predictions yet</p>
            <p className="mt-1 text-sm text-white/50">The first submitted entry will appear here.</p>
          </div>
        ) : (
          response.rows.map((row) => <LeaderboardRowCard key={`${row.walletAddress}-${row.txHash ?? row.rank}`} row={row} finalized={finalized} />)
        )}
      </div>
    </section>
  );
}

function SummaryCard({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="panel rounded-[22px] p-4">
      <Icon className="mb-3 h-4 w-4 text-geny-cyan" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">{label}</p>
      <p className="mt-1 break-words text-lg font-black text-white">{value}</p>
    </div>
  );
}

function LeaderboardRowCard({ row, finalized }: { row: LeaderboardRow; finalized: boolean }) {
  const badge = scoreBadge(row.score ?? undefined);
  const userLabel = row.displayName || row.username || compactAddress(row.walletAddress);
  const predictionIds = [
    row.prediction.champion,
    row.prediction.runnerUp,
    row.prediction.thirdPlace,
    row.prediction.fourthPlace
  ];

  return (
    <article className="glass rounded-[24px] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-sm font-black text-white">
            #{row.rank}
          </div>
          {row.pfpUrl && <img src={row.pfpUrl} alt="" className="h-10 w-10 rounded-2xl border border-white/10 object-cover" />}
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">{userLabel}</p>
            <p className="truncate text-xs text-white/42">{row.username ? `@${row.username}` : compactAddress(row.walletAddress)}</p>
          </div>
        </div>
        {finalized ? (
          <span
            className={cn(
              "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black",
              badge.tone === "perfect" && "bg-geny-gold text-ink-950",
              badge.tone === "strong" && "bg-geny-cyan text-ink-950",
              badge.tone === "eligible" && "bg-geny-lime text-ink-950",
              badge.tone === "low" && "bg-white/10 text-white/62",
              badge.tone === "pending" && "bg-white/10 text-white/62"
            )}
          >
            {badge.label}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-black text-white/62">
            {formatDateTime(row.submittedAt)}
          </span>
        )}
      </div>

      <div className="mb-3 grid grid-cols-4 gap-2">
        {predictionIds.map((id, index) => {
          const team = getTeamById(id);
          return (
            <div key={`${id}-${index}`} className="rounded-2xl bg-white/5 p-2 text-center">
              <p className="text-[10px] font-black text-white/42">{index + 1}</p>
              <p className="mt-1 text-base">{team ? getFlagLabel(team.code) : ""}</p>
              <p className="mt-1 truncate text-[10px] font-bold text-white/72">{getTeamName(id)}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <Metric label="Entry Amount" value={`${row.entryAmount.toLocaleString()} GENY`} />
        <Metric label="Attempt" value={`${row.attemptNumber ?? 1}`} />
        {finalized ? (
          <>
            <Metric label="Score" value={`${row.score ?? 0}`} />
            <Metric label="Exact Winner" value={row.exactMatch ? "Yes" : "No"} />
            <Metric label="Reward" value={`${(row.estimatedReward ?? 0).toLocaleString()} GENY`} />
          </>
        ) : (
          <Metric label="Wallet" value={compactAddress(row.walletAddress)} />
        )}
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-2">
      <p className="text-white/42">{label}</p>
      <p className="mt-1 truncate font-bold text-white">{value}</p>
    </div>
  );
}
