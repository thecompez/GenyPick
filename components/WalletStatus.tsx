"use client";

import { ExternalLink, Plus, UserRound, Wallet } from "lucide-react";
import { useAccount } from "wagmi";
import { useFarcaster } from "@/components/FarcasterProvider";
import { compactAddress } from "@/lib/format";

export function WalletStatus({
  balance,
  rawBalance,
  connectPending,
  onConnect,
  openInFarcasterUrl
}: {
  balance: string;
  rawBalance?: string;
  connectPending: boolean;
  onConnect: () => Promise<void>;
  openInFarcasterUrl: string;
}) {
  const { address, isConnected } = useAccount();
  const farcaster = useFarcaster();
  const displayName = farcaster.user?.displayName || farcaster.user?.username || "Browser user";

  return (
    <section className="mb-4 grid grid-cols-[1fr_auto] gap-3 min-w-0 max-w-full">
      <div className="panel rounded-[22px] p-3 min-w-0 max-w-full overflow-hidden">
        <div className="flex items-center gap-3 min-w-0">
          {farcaster.user?.pfpUrl ? (
            <img
              src={farcaster.user.pfpUrl}
              alt={displayName}
              className="h-11 w-11 rounded-2xl border border-white/10 object-cover shrink-0"
            />
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/7">
              <UserRound className="h-5 w-5 text-white/65" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 min-w-0">
              <p className="truncate text-sm font-bold text-white max-w-full overflow-hidden text-ellipsis whitespace-nowrap">{displayName}</p>
              {farcaster.isMiniApp && (
                <span className="rounded-full bg-geny-cyan/12 px-2 py-0.5 text-[10px] font-bold text-geny-cyan shrink-0">
                  Mini App
                </span>
              )}
            </div>
            <p className="truncate text-xs text-white/50 max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {farcaster.user?.fid ? `FID ${farcaster.user.fid}` : "Normal browser fallback"}
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs min-w-0 max-w-full">
          <div className="rounded-2xl bg-white/5 p-2 min-w-0 max-w-full">
            <p className="text-white/45 truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">Connected wallet</p>
            <p className="mt-1 font-semibold text-white truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap" title={address}>
              {compactAddress(address)}
            </p>
          </div>
          <div className="rounded-2xl bg-white/5 p-2 min-w-0 max-w-full" title={rawBalance || balance}>
            <p className="text-white/45 truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">GENY balance</p>
            <p className="mt-1 font-semibold text-white truncate max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              {balance}
            </p>
          </div>
        </div>
      </div>

      <div className="flex w-[108px] flex-col gap-2">
        <button
          type="button"
          onClick={() => onConnect()}
          className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] border border-geny-cyan/20 bg-geny-cyan/10 p-2 text-center text-xs font-bold text-geny-cyan transition hover:bg-geny-cyan/15"
        >
          <Wallet className="h-4 w-4" />
          {connectPending ? "Opening" : isConnected ? "Wallet" : "Connect"}
        </button>
        {farcaster.isMiniApp ? (
          <button
            type="button"
            onClick={farcaster.addMiniApp}
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] border border-white/10 bg-white/6 p-2 text-center text-xs font-bold text-white/78 transition hover:bg-white/10"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        ) : (
          <a
            href={openInFarcasterUrl}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[22px] border border-white/10 bg-white/6 p-2 text-center text-xs font-bold text-white/78 transition hover:bg-white/10"
          >
            <ExternalLink className="h-4 w-4" />
            Farcaster
          </a>
        )}
      </div>
    </section>
  );
}
