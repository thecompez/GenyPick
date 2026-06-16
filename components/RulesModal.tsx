"use client";

import { BookOpen, ShieldCheck } from "lucide-react";

const scoring = [
  ["Champion exact", "256"],
  ["Runner-up exact", "128"],
  ["Third exact", "64"],
  ["Fourth exact", "32"],
  ["Correct Top 4 team, wrong position", "16"]
];

export function RulesModal({ deadline }: { deadline?: number }) {
  const formattedCloseDate = deadline
    ? new Date(deadline * 1000).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC"
      }) + " UTC"
    : "Jan 1, 2027 UTC";

  const rules = [
    "Pick the final Top 4 teams.",
    "Each submission or revision buys a card for exactly 256 GENY.",
    `You may revise before submissions are locked or the deadline passes (closes ${formattedCloseDate}), up to 32 total attempts.`,
    "Only your latest active card counts. Previous cards are invalidated and previous payments are not refunded.",
    "75% of the total pool becomes the reward pool. 25% goes to treasury/ecosystem.",
    "Scores are calculated after the manually verified official result.",
    "Only exact Top 4 winners share the reward pool equally. Partial scores are analytics only."
  ];

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">Rules</h2>
        <p className="mt-1 text-sm text-white/58">Published scoring and reward distribution.</p>
      </div>

      <div className="glass rounded-[24px] p-4">
        <BookOpen className="mb-4 h-5 w-5 text-geny-cyan" />
        <div className="space-y-3">
          {rules.map((rule, index) => (
            <div key={index} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/8 text-xs font-black text-white">
                {index + 1}
              </span>
              <p className="pt-1 text-sm leading-5 text-white/76">{rule}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="panel rounded-[22px] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Scoring table</p>
        <div className="space-y-2">
          {scoring.map(([label, points]) => (
            <div key={label} className="flex items-center justify-between rounded-2xl bg-white/5 p-3">
              <span className="text-sm font-semibold text-white/74">{label}</span>
              <span className="text-sm font-black text-geny-cyan">{points}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="panel rounded-[22px] p-4">
        <ShieldCheck className="mb-3 h-5 w-5 text-geny-lime" />
        <p className="text-sm font-bold text-white">Rewards</p>
        <p className="mt-2 text-sm leading-6 text-white/62">
          Only active cards that exactly match champion, runner-up, third place, and fourth place receive rewards. If no exact winner exists, no user reward is claimable yet.
        </p>
      </div>

      <p className="rounded-2xl border border-white/8 bg-white/5 p-3 text-xs leading-5 text-white/55">
        GenyPick is a community prediction game powered by GENY. Participation does not guarantee profit. Rewards are distributed from the community pool according to the published rules, eligibility, availability, and applicable local regulations.
      </p>
    </section>
  );
}
