"use client";

import { ChevronRight } from "lucide-react";
import { getFlagLabel, getTeamById } from "@/lib/teams";

export function PredictionCard({
  icon,
  label,
  short,
  teamId,
  onClick
}: {
  icon: string;
  label: string;
  short: string;
  teamId?: number;
  onClick: () => void;
}) {
  const team = teamId ? getTeamById(teamId) : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="glass flex min-h-[86px] items-center gap-4 rounded-[24px] p-4 text-left transition hover:border-geny-cyan/25 hover:bg-white/12"
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/8 text-2xl">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/42">{label}</p>
        {team ? (
          <div className="mt-1 flex min-w-0 items-center gap-2">
            <span className="text-xl">{getFlagLabel(team.code)}</span>
            <p className="truncate text-lg font-black text-white">{team.name}</p>
          </div>
        ) : (
          <p className="mt-1 text-lg font-black text-white/72">Select {short}</p>
        )}
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-white/35" />
    </button>
  );
}
