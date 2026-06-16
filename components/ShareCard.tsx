"use client";

import { CheckCircle2, ExternalLink, Send } from "lucide-react";
import type { TopFourPrediction } from "@/lib/scoring";
import { compactAddress } from "@/lib/format";
import { getFlagLabel, getTeamById } from "@/lib/teams";
import { useFarcaster } from "@/components/FarcasterProvider";

export function ShareCard({
  prediction,
  entryAmount,
  txHash,
  onCast,
  onLeaderboard
}: {
  prediction: TopFourPrediction;
  entryAmount: string;
  txHash?: `0x${string}`;
  onCast: () => Promise<void>;
  onLeaderboard: () => void;
}) {
  const farcaster = useFarcaster();
  const rows = [
    ["1st", prediction.champion],
    ["2nd", prediction.runnerUp],
    ["3rd", prediction.thirdPlace],
    ["4th", prediction.fourthPlace]
  ] as const;

  return (
    <section className="space-y-4">
      <div className="glass rounded-[28px] p-5 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[24px] bg-geny-cyan/12 text-geny-cyan">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="text-3xl font-black text-white">Prediction Submitted</h2>
        <p className="mt-2 text-sm text-white/60">You are now in the GenyPick pool.</p>
      </div>

      <div className="panel rounded-[22px] p-4">
        <div className="flex items-center gap-3">
          {farcaster.user?.pfpUrl && (
            <img src={farcaster.user.pfpUrl} alt="" className="h-11 w-11 rounded-2xl border border-white/10 object-cover" />
          )}
          <div>
            <p className="text-sm font-bold text-white">{farcaster.user?.displayName || farcaster.user?.username || "Connected player"}</p>
            <p className="text-xs text-white/45">{farcaster.user?.fid ? `FID ${farcaster.user.fid}` : "Browser wallet"}</p>
          </div>
        </div>
      </div>

      <div className="glass rounded-[24px] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Prediction</p>
        <div className="space-y-2">
          {rows.map(([label, id]) => {
            const team = getTeamById(id);
            return (
              <div key={label} className="flex justify-between gap-3 rounded-2xl bg-white/5 p-3 text-sm">
                <span className="font-black text-white/64">{label}</span>
                <span className="truncate font-bold text-white">{team ? `${getFlagLabel(team.code)} ${team.name}` : "Team"}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex items-center justify-between rounded-2xl bg-geny-violet/10 p-3 text-sm">
          <span className="font-semibold text-white/58">Entry amount</span>
          <span className="font-black text-white">{entryAmount} GENY</span>
        </div>
        {txHash && (
          <a
            href={`https://basescan.org/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-3 text-sm transition hover:bg-white/9"
          >
            <span className="font-semibold text-white/58">Transaction</span>
            <span className="flex items-center gap-2 font-black text-geny-cyan">
              {compactAddress(txHash)}
              <ExternalLink className="h-3.5 w-3.5" />
            </span>
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onCast}
          className="flex h-14 min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-geny-cyan to-geny-violet px-4 text-sm font-black text-white shadow-glow"
        >
          <Send className="h-4 w-4" />
          Cast My Prediction
        </button>
        <button
          type="button"
          onClick={onLeaderboard}
          className="h-14 min-h-14 rounded-2xl border border-white/10 bg-white/7 px-4 text-sm font-black text-white"
        >
          View Leaderboard
        </button>
      </div>
    </section>
  );
}
