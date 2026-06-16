"use client";

import { Coins, Trophy, UsersRound } from "lucide-react";
import type { LeaderboardStats } from "@/lib/leaderboard";

export function PoolStats({ stats, deadline }: { stats: LeaderboardStats; deadline?: number }) {
  const isClosed = deadline ? Date.now() >= deadline * 1000 : false;
  const formattedCloseDate = deadline
    ? new Date(deadline * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
      }) + " UTC"
    : undefined;

  const items = [
    { label: "Total Pool", value: `${stats.totalPool.toLocaleString()} GENY`, icon: Coins },
    { label: "Reward Pool", value: `${stats.rewardPool.toLocaleString()} GENY`, icon: Trophy },
    { label: "Participants", value: stats.participants.toLocaleString(), icon: UsersRound },
    { label: "Card Price", value: "256 GENY", icon: Coins }
  ];

  return (
    <section className="grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.label} className="panel rounded-[22px] p-4">
          <item.icon className="mb-3 h-4 w-4 text-geny-cyan" />
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">{item.label}</p>
          <p className="mt-1 break-words text-lg font-black text-white">{item.value}</p>
        </div>
      ))}
      <div className="panel col-span-2 rounded-[22px] p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/42">Reward allocation</p>
            <p className="mt-1 text-lg font-black text-white">75% to winners</p>
          </div>
          {formattedCloseDate && (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-right">
              <p className="text-[10px] font-semibold text-white/60">
                {isClosed ? "Closed" : `Closes ${formattedCloseDate}`}
              </p>
              <p className={`text-xs font-black ${isClosed ? "text-red-400" : "text-geny-cyan"}`}>
                {isClosed ? "Closed" : "Prediction Active"}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
