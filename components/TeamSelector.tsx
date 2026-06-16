"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { Team } from "@/lib/teams";
import { getFlagLabel } from "@/lib/teams";

export function TeamSelector({
  title,
  teams,
  selectedIds,
  selectedTeamId,
  onSelect,
  onClose
}: {
  title: string;
  teams: Team[];
  selectedIds: number[];
  selectedTeamId?: number;
  onSelect: (teamId: number) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return teams;
    return teams.filter((team) => team.name.toLowerCase().includes(normalized) || team.code.toLowerCase().includes(normalized));
  }, [query, teams]);

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/62 backdrop-blur-sm" role="dialog" aria-modal="true">
      <div className="max-h-[88vh] w-full overflow-hidden rounded-t-[28px] border border-white/10 bg-ink-900 shadow-2xl">
        <div className="mx-auto max-w-[450px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-geny-cyan">Team selector</p>
              <h3 className="mt-1 text-xl font-black text-white">{title}</h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white"
              aria-label="Close team selector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <label className="mb-3 flex h-12 items-center gap-3 rounded-2xl border border-white/10 bg-white/7 px-4">
            <Search className="h-4 w-4 text-white/45" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search teams"
              className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/35"
            />
          </label>
          <div className="no-scrollbar max-h-[58vh] space-y-2 overflow-y-auto pb-2" role="listbox">
            {filteredTeams.map((team) => {
              const disabled = selectedIds.includes(team.id) && team.id !== selectedTeamId;
              const selected = selectedTeamId === team.id;
              return (
                <button
                  key={team.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  disabled={disabled}
                  data-testid={`team-option-${team.id}`}
                  onClick={() => onSelect(team.id)}
                  className={cn(
                    "flex h-14 w-full items-center gap-3 rounded-2xl border px-3 text-left transition",
                    selected
                      ? "border-geny-cyan/55 bg-geny-cyan/12"
                      : "border-white/8 bg-white/5 hover:bg-white/9",
                    disabled && "cursor-not-allowed opacity-35"
                  )}
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/8 text-lg">
                    {getFlagLabel(team.code)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{team.name}</p>
                    <p className="text-xs text-white/42">{team.code}</p>
                  </div>
                  {selected && <span className="rounded-full bg-geny-cyan px-2 py-1 text-[10px] font-black text-ink-950">Selected</span>}
                  {disabled && <span className="text-[10px] font-bold uppercase tracking-wide text-white/42">Used</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
