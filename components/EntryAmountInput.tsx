"use client";

import { Flame, WalletCards } from "lucide-react";
import { CARD_PRICE_GENY } from "@/lib/contracts";
import type { validateEntryAmount } from "@/lib/validation";

export function EntryAmountInput({
  balance,
  validation
}: {
  balance: string;
  validation: ReturnType<typeof validateEntryAmount>;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">Buy prediction card</h2>
        <p className="mt-1 text-sm text-white/58">Every card costs exactly {CARD_PRICE_GENY} GENY. Each revision buys a new card.</p>
      </div>

      <div className="glass rounded-[24px] p-4">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Card price</p>
        <p className="mt-2 text-4xl font-black text-white">{CARD_PRICE_GENY} GENY</p>
        <p className="mt-2 text-sm leading-5 text-white/58">
          Paying more is not supported and gives no reward advantage.
        </p>
        {!validation.ok && <p className="mt-2 text-sm font-semibold text-red-300">{validation.error}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="panel rounded-[22px] p-4">
          <WalletCards className="mb-3 h-4 w-4 text-geny-cyan" />
          <p className="text-xs font-semibold text-white/45">Your GENY balance</p>
          <p className="mt-1 break-words text-xl font-black text-white">{balance}</p>
        </div>
        <div className="panel rounded-[22px] p-4">
          <Flame className="mb-3 h-4 w-4 text-geny-violet" />
          <p className="text-xs font-semibold text-white/45">Revision rule</p>
          <p className="mt-1 text-xl font-black text-white">New card</p>
        </div>
      </div>

      <p className="rounded-2xl border border-white/8 bg-white/5 p-3 text-xs leading-5 text-white/55">
        A revision invalidates the previous active card and buys a fresh one for {CARD_PRICE_GENY} GENY. Previous payments stay in the pool and are not refunded.
      </p>
    </section>
  );
}
