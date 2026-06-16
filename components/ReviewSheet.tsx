"use client";

import { AlertTriangle, CheckCircle2, Loader2, Send, ShieldAlert } from "lucide-react";
import { CARD_PRICE_GENY } from "@/lib/contracts";
import type { TopFourPrediction } from "@/lib/scoring";
import { getFlagLabel, getTeamById } from "@/lib/teams";

type TransactionPhase =
  | "idle"
  | "waiting-wallet"
  | "approving"
  | "approval-confirmed"
  | "submitting"
  | "confirming"
  | "submitted"
  | "failed";

const phaseLabels: Record<TransactionPhase, string> = {
  idle: "Ready",
  "waiting-wallet": "Waiting for wallet",
  approving: "Approving GENY",
  "approval-confirmed": "Approval confirmed",
  submitting: "Submitting prediction",
  confirming: "Confirming on Base",
  submitted: "Prediction submitted",
  failed: "Transaction failed"
};

export function ReviewSheet({
  prediction,
  entryAmount,
  phase,
  txError,
  balance,
  rawBalance,
  attemptCount,
  maxAttempts,
  totalPaidByUser,
  rawTotalPaidByUser,
  submissionsLocked,
  paused,
  finalized,
  contractConfigured,
  isCorrectNetwork,
  onSubmit
}: {
  prediction: TopFourPrediction;
  entryAmount: string;
  phase: TransactionPhase;
  txError?: string;
  balance: string;
  rawBalance?: string;
  attemptCount: number;
  maxAttempts: number;
  totalPaidByUser: string;
  rawTotalPaidByUser?: string;
  submissionsLocked: boolean;
  paused: boolean;
  finalized: boolean;
  contractConfigured: boolean;
  isCorrectNetwork: boolean;
  onSubmit: () => Promise<void>;
}) {
  const rows = [
    ["1st", prediction.champion],
    ["2nd", prediction.runnerUp],
    ["3rd", prediction.thirdPlace],
    ["4th", prediction.fourthPlace]
  ] as const;
  const busy = ["waiting-wallet", "approving", "submitting", "confirming"].includes(phase);

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">Review prediction</h2>
        <p className="mt-1 text-sm text-white/58">This will become your latest active card. Previous active cards are invalidated.</p>
      </div>

      <div className="glass rounded-[24px] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Your Prediction</p>
        <div className="space-y-2">
          {rows.map(([label, teamId]) => {
            const team = getTeamById(teamId);
            return (
              <div key={label} className="flex items-center justify-between gap-3 rounded-2xl bg-white/5 p-3">
                <span className="text-sm font-black text-white/70">{label}</span>
                <span className="min-w-0 truncate text-sm font-bold text-white">
                  {team ? `${getFlagLabel(team.code)} ${team.name}` : "Missing team"}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 min-w-0 max-w-full">
        <div className="panel rounded-[22px] p-4 min-w-0 max-w-full">
          <p className="text-xs font-semibold text-white/45 truncate">Entry</p>
          <p className="mt-1 text-xl font-black text-white truncate">{entryAmount} GENY</p>
        </div>
        <div className="panel rounded-[22px] p-4 min-w-0 max-w-full">
          <p className="text-xs font-semibold text-white/45 truncate">Network</p>
          <p className="mt-1 text-xl font-black text-white truncate">Base</p>
        </div>
        <div className="panel rounded-[22px] p-4 min-w-0 max-w-full" title={rawBalance || balance}>
          <p className="text-xs font-semibold text-white/45 truncate">Balance</p>
          <p className="mt-1 text-xl font-black text-white truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {balance}
          </p>
        </div>
        <div className="panel rounded-[22px] p-4 min-w-0 max-w-full">
          <p className="text-xs font-semibold text-white/45 truncate">Minimum</p>
          <p className="mt-1 text-xl font-black text-white truncate">{CARD_PRICE_GENY} GENY</p>
        </div>
        <div className="panel rounded-[22px] p-4 min-w-0 max-w-full">
          <p className="text-xs font-semibold text-white/45 truncate">Attempt</p>
          <p className="mt-1 text-xl font-black text-white truncate">
            {Math.min(attemptCount + 1, maxAttempts)}/{maxAttempts}
          </p>
        </div>
        <div className="panel rounded-[22px] p-4 min-w-0 max-w-full" title={rawTotalPaidByUser || totalPaidByUser}>
          <p className="text-xs font-semibold text-white/45 truncate">Total paid</p>
          <p className="mt-1 text-xl font-black text-white truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
            {totalPaidByUser}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-300/22 bg-amber-300/8 p-3">
        <div className="flex gap-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
          <p className="text-xs leading-5 text-amber-50/78">
            Revisions cost a new GENY payment. Only the latest active card is scored; previous payments stay in the pool.
          </p>
        </div>
      </div>

      <div className="panel rounded-[22px] p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-bold text-white">{phaseLabels[phase]}</p>
          {busy ? <Loader2 className="h-4 w-4 animate-spin text-geny-cyan" /> : <CheckCircle2 className="h-4 w-4 text-white/35" />}
        </div>
        <div className="space-y-2 text-xs text-white/55">
          <Step active={phase === "waiting-wallet"} done={!["idle", "waiting-wallet"].includes(phase)} label="Waiting for wallet" />
          <Step active={phase === "approving"} done={["approval-confirmed", "submitting", "confirming", "submitted"].includes(phase)} label="Approving GENY" />
          <Step active={phase === "submitting"} done={["confirming", "submitted"].includes(phase)} label="Submitting prediction" />
          <Step active={phase === "confirming"} done={phase === "submitted"} label="Confirming on Base" />
        </div>
      </div>

      {txError && (
        <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm font-semibold text-red-100">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{txError}</span>
          </div>
        </div>
      )}

      {!contractConfigured && (
        <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
          Contract address is not configured. Set NEXT_PUBLIC_GENYPICK_CONTRACT_ADDRESS after deployment.
        </p>
      )}
      {attemptCount >= maxAttempts && (
        <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
          This wallet has reached the maximum number of attempts.
        </p>
      )}
      {submissionsLocked && (
        <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
          Submissions are locked.
        </p>
      )}
      {paused && (
        <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
          The pool is paused.
        </p>
      )}
      {finalized && (
        <p className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-xs leading-5 text-red-100">
          The pool is finalized.
        </p>
      )}
      {!isCorrectNetwork && (
        <p className="rounded-2xl border border-geny-cyan/20 bg-geny-cyan/10 p-3 text-xs leading-5 text-cyan-100">
          The app will request a switch to Base before submission.
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !contractConfigured || attemptCount >= maxAttempts || submissionsLocked || paused || finalized}
          className="flex h-14 min-h-14 items-center justify-center rounded-2xl border border-white/10 bg-white/7 px-4 text-sm font-black text-white transition hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Approve GENY
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={busy || !contractConfigured || attemptCount >= maxAttempts || submissionsLocked || paused || finalized}
          className="flex h-14 min-h-14 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-geny-cyan to-geny-violet px-4 text-sm font-black text-white shadow-glow transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
          {attemptCount > 0 ? "Burn and buy new card" : "Buy card for 256 GENY"}
        </button>
      </div>
    </section>
  );
}

function Step({ label, active, done }: { label: string; active: boolean; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${done ? "bg-geny-lime" : active ? "bg-geny-cyan" : "bg-white/18"}`} />
      <span className={active ? "font-semibold text-white" : done ? "text-white/70" : ""}>{label}</span>
    </div>
  );
}
