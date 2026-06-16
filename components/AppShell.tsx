"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Info,
  ShieldCheck,
  Sparkles,
  Volume2,
  VolumeX
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import {
  useAccount,
  useConnect,
  usePublicClient,
  useReadContract,
  useSwitchChain,
  useWriteContract
} from "wagmi";
import { base } from "wagmi/chains";
import { AdminPanel } from "@/components/AdminPanel";
import { EntryAmountInput } from "@/components/EntryAmountInput";
import { LeaderboardTable } from "@/components/LeaderboardTable";
import { PoolStats } from "@/components/PoolStats";
import { PredictionCard } from "@/components/PredictionCard";
import { ReviewSheet } from "@/components/ReviewSheet";
import { RulesModal } from "@/components/RulesModal";
import { ShareCard } from "@/components/ShareCard";
import { TeamSelector } from "@/components/TeamSelector";
import { WalletStatus } from "@/components/WalletStatus";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import {
  ADMIN_WALLET,
  BASE_CHAIN_ID,
  CARD_PRICE_GENY,
  GENY_TOKEN_ADDRESS,
  MAX_ATTEMPTS,
  genyPickAbi,
  genyTokenAbi,
  getGenyPickAddress
} from "@/lib/contracts";
import { formatGeny, isSameAddress } from "@/lib/format";
import { useFarcaster } from "@/components/FarcasterProvider";
import type { LeaderboardResponse } from "@/lib/leaderboard";
import { deriveLeaderboardStats, demoRows } from "@/lib/leaderboard";
import { getAppUrl } from "@/lib/farcaster";
import type { TopFourPrediction } from "@/lib/scoring";
import { WORLD_CUP_2026_TEAMS } from "@/lib/teams";
import { validateDeadline, validateEntryAmount } from "@/lib/validation";

type Screen = "home" | "pick" | "entry" | "review" | "success" | "leaderboard" | "rules" | "admin";
type PickKey = keyof TopFourPrediction;
type TransactionPhase =
  | "idle"
  | "waiting-wallet"
  | "approving"
  | "approval-confirmed"
  | "submitting"
  | "confirming"
  | "submitted"
  | "failed";

const demoDataEnabled =
  process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_ENABLE_DEMO_DATA === "true";

const rankConfig: Array<{ key: PickKey; label: string; short: string; icon: string }> = [
  { key: "champion", label: "1st Place", short: "Champion", icon: "🏆" },
  { key: "runnerUp", label: "2nd Place", short: "Runner-up", icon: "🥈" },
  { key: "thirdPlace", label: "3rd Place", short: "Third place", icon: "🥉" },
  { key: "fourthPlace", label: "4th Place", short: "Fourth place", icon: "⭐" }
];

function parseDeadlineEnv() {
  const value = process.env.NEXT_PUBLIC_SUBMISSION_DEADLINE;
  if (!value) return undefined;
  const numeric = Number(value);
  if (Number.isFinite(numeric)) return numeric;
  const date = Date.parse(value);
  return Number.isFinite(date) ? Math.floor(date / 1000) : undefined;
}

export function AppShell() {
  const farcaster = useFarcaster();
  const contractAddress = getGenyPickAddress();
  const [screen, setScreen] = useState<Screen>("home");
  const [activePick, setActivePick] = useState<PickKey | null>(null);
  const [prediction, setPrediction] = useState<Partial<TopFourPrediction>>({});
  const entryAmount = String(CARD_PRICE_GENY);
  const [leaderboard, setLeaderboard] = useState<LeaderboardResponse>({
    rows: demoDataEnabled ? demoRows : [],
    stats: deriveLeaderboardStats(demoDataEnabled ? demoRows : [])
  });
  const [phase, setPhase] = useState<TransactionPhase>("idle");
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();
  const [txError, setTxError] = useState<string>();

  const { address, isConnected, chainId } = useAccount();
  const { connectors, connectAsync, isPending: connectPending } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();

  const entryAmountValidation = validateEntryAmount(entryAmount);
  const selectedIds = useMemo(() => Object.values(prediction).filter(Boolean) as number[], [prediction]);
  const completePrediction = useMemo(() => {
    if (
      prediction.champion &&
      prediction.runnerUp &&
      prediction.thirdPlace &&
      prediction.fourthPlace
    ) {
      return prediction as TopFourPrediction;
    }
    return undefined;
  }, [prediction]);

  const contractReadsEnabled = Boolean(contractAddress);

  const { data: totalPoolData, refetch: refetchTotalPool } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "totalPool",
    query: { enabled: contractReadsEnabled, refetchInterval: 30_000 }
  });

  const { data: rewardPoolData, refetch: refetchRewardPool } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "rewardPool",
    query: { enabled: contractReadsEnabled, refetchInterval: 30_000 }
  });

  const { data: deadlineData } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "deadline",
    query: { enabled: contractReadsEnabled }
  });

  const { data: finalizedData } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "finalized",
    query: { enabled: contractReadsEnabled, refetchInterval: 30_000 }
  });

  const { data: submissionsLockedData } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "submissionsLocked",
    query: { enabled: contractReadsEnabled, refetchInterval: 30_000 }
  });

  const { data: pausedData } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "paused",
    query: { enabled: contractReadsEnabled, refetchInterval: 30_000 }
  });

  const { data: balanceData, refetch: refetchBalance } = useReadContract({
    address: GENY_TOKEN_ADDRESS,
    abi: genyTokenAbi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address), refetchInterval: 20_000 }
  });

  const { data: allowanceData, refetch: refetchAllowance } = useReadContract({
    address: GENY_TOKEN_ADDRESS,
    abi: genyTokenAbi,
    functionName: "allowance",
    args: address && contractAddress ? [address, contractAddress] : undefined,
    query: { enabled: Boolean(address && contractAddress), refetchInterval: 20_000 }
  });

  const { data: attemptCountData, refetch: refetchAttemptCount } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "attemptCount",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contractAddress), refetchInterval: 20_000 }
  });

  const { data: totalPaidByUserData, refetch: refetchTotalPaidByUser } = useReadContract({
    address: contractAddress,
    abi: genyPickAbi,
    functionName: "totalPaidByUser",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && contractAddress), refetchInterval: 20_000 }
  });

  const deadline = Number(deadlineData ?? parseDeadlineEnv() ?? 0);
  const poolStats = useMemo(() => {
    const totalPool = totalPoolData !== undefined ? Number(formatUnits(totalPoolData, 18)) : leaderboard.stats.totalPool;
    const rewardPool =
      rewardPoolData !== undefined && rewardPoolData > 0n
        ? Number(formatUnits(rewardPoolData, 18))
        : (totalPool * 75) / 100;
    return {
      ...leaderboard.stats,
      totalPool,
      rewardPool,
      finalized: Boolean(finalizedData) || leaderboard.stats.finalized
    };
  }, [finalizedData, leaderboard.stats, rewardPoolData, totalPoolData]);

  const attemptCount = Number(attemptCountData ?? 0);
  const totalPaidByUser = formatGeny(totalPaidByUserData ?? 0n);

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("geny-music-muted") === "true";
    }
    return false;
  });

  const toggleMute = () => {
    setIsMuted((prev) => {
      const next = !prev;
      localStorage.setItem("geny-music-muted", String(next));
      return next;
    });
  };

  const isAdmin = isSameAddress(address, ADMIN_WALLET);
  const isClosed = deadline ? Date.now() >= deadline * 1000 : false;
  
  const rawBalance = balanceData !== undefined ? `${formatUnits(balanceData, 18)} GENY` : undefined;
  const rawTotalPaidByUser = totalPaidByUserData !== undefined ? `${formatUnits(totalPaidByUserData, 18)} GENY` : undefined;

  // Protect client admin screen from unauthorized wallets
  useEffect(() => {
    if (screen === "admin" && !isAdmin) {
      setScreen("home");
    }
  }, [screen, isAdmin]);

  useEffect(() => {
    async function loadLeaderboard() {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as LeaderboardResponse;
        setLeaderboard(data);
      } catch {
        // Local development can still render demo rows without a database.
      }
    }
    loadLeaderboard();
  }, []);

  async function connectWallet() {
    const preferred = farcaster.isMiniApp
      ? connectors.find((connector) => /farcaster|mini/i.test(`${connector.id} ${connector.name}`))
      : undefined;
    const connector = preferred ?? connectors[0];
    if (!connector) throw new Error("No wallet connector is available");
    await connectAsync({ connector, chainId: BASE_CHAIN_ID });
  }

  function updatePrediction(key: PickKey, teamId: number) {
    setPrediction((current) => ({ ...current, [key]: teamId }));
    setActivePick(null);
  }

  async function submitPrediction() {
    setTxError(undefined);
    if (!completePrediction) {
      setTxError("Select four unique teams before submitting");
      return;
    }
    if (!contractAddress) {
      setTxError("NEXT_PUBLIC_GENYPICK_CONTRACT_ADDRESS is not configured");
      return;
    }
    if (!publicClient) {
      setTxError("Base RPC client is not available");
      return;
    }
    if (!validateDeadline(deadline)) {
      setTxError("Submissions are closed");
      return;
    }
    if (submissionsLockedData) {
      setTxError("Submissions are locked");
      return;
    }
    if (pausedData) {
      setTxError("Pool is paused");
      return;
    }
    if (finalizedData) {
      setTxError("Pool is finalized");
      return;
    }
    if (attemptCount >= MAX_ATTEMPTS) {
      setTxError("This wallet has reached the 32 attempt limit");
      return;
    }
    if (!entryAmountValidation.ok) {
      setTxError(entryAmountValidation.error);
      return;
    }

    try {
      if (!isConnected || !address) {
        setPhase("waiting-wallet");
        await connectWallet();
      }

      if (chainId !== BASE_CHAIN_ID) {
        setPhase("waiting-wallet");
        await switchChainAsync({ chainId: BASE_CHAIN_ID });
      }

      const amountWei = parseUnits(entryAmount, 18);
      if ((balanceData ?? 0n) < amountWei) {
        setTxError("Connected wallet does not have enough GENY for this entry");
        setPhase("failed");
        return;
      }

      const allowance = allowanceData ?? 0n;
      if (allowance < amountWei) {
        setPhase("approving");
        const approvalHash = await writeContractAsync({
          address: GENY_TOKEN_ADDRESS,
          abi: genyTokenAbi,
          functionName: "approve",
          args: [contractAddress, amountWei],
          chainId: BASE_CHAIN_ID
        });
        await publicClient.waitForTransactionReceipt({ hash: approvalHash });
        await refetchAllowance();
        setPhase("approval-confirmed");
      }

      setPhase("submitting");
      const submitHash = await writeContractAsync({
        address: contractAddress,
        abi: genyPickAbi,
        functionName: "submitOrRevisePrediction",
        args: [
          completePrediction.champion,
          completePrediction.runnerUp,
          completePrediction.thirdPlace,
          completePrediction.fourthPlace,
          amountWei
        ],
        chainId: BASE_CHAIN_ID
      });
      setTxHash(submitHash);
      setPhase("confirming");
      await publicClient.waitForTransactionReceipt({ hash: submitHash });

      await fetch("/api/index/prediction", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          fid: farcaster.user?.fid,
          username: farcaster.user?.username,
          displayName: farcaster.user?.displayName,
          pfpUrl: farcaster.user?.pfpUrl,
          champion: completePrediction.champion,
          runnerUp: completePrediction.runnerUp,
          thirdPlace: completePrediction.thirdPlace,
          fourthPlace: completePrediction.fourthPlace,
          entryAmount: entryAmountValidation.amount,
          txHash: submitHash
        })
      });

      await Promise.all([
        refetchBalance(),
        refetchAllowance(),
        refetchAttemptCount(),
        refetchTotalPaidByUser(),
        refetchTotalPool(),
        refetchRewardPool()
      ]);

      setPhase("submitted");
      setScreen("success");
    } catch (error) {
      setPhase("failed");
      setTxError(error instanceof Error ? error.message : "Transaction failed");
    }
  }

  const canContinueFromPick = Boolean(completePrediction);
  const currentBalance = formatGeny(balanceData ?? 0n);
  const appUrl = getAppUrl();

  return (
    <main className="min-h-screen px-4 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-[calc(1rem+env(safe-area-inset-top))] sm:px-6">
      <BackgroundMusic isMuted={isMuted} />
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-[450px] flex-col">
        <header className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (screen === "home" ? undefined : setScreen("home"))}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
            aria-label="Go back"
          >
            {screen === "home" ? <Sparkles className="h-4 w-4 text-geny-cyan" /> : <ArrowLeft className="h-4 w-4" />}
          </button>
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-geny-cyan">GenyPick</p>
            <h1 className="text-base font-bold text-white">World Cup 2026</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleMute}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label={isMuted ? "Unmute music" : "Mute music"}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-white/60" /> : <Volume2 className="h-4 w-4 text-geny-cyan" />}
            </button>
            <button
              type="button"
              onClick={() => setScreen("leaderboard")}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
              aria-label="Open leaderboard"
            >
              <BarChart3 className="h-4 w-4" />
            </button>
          </div>
        </header>

        <WalletStatus
          balance={currentBalance}
          rawBalance={rawBalance}
          connectPending={connectPending}
          onConnect={connectWallet}
          openInFarcasterUrl={`https://warpcast.com/~/developers/mini-apps/preview?url=${encodeURIComponent(appUrl)}`}
        />

        <AnimatePresence mode="wait">
          {screen === "home" && (
            <motion.section
              key="home"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="flex flex-1 flex-col gap-4"
            >
              <section className="glass overflow-hidden rounded-[24px] p-5">
                <div className="mb-6 flex items-start justify-between gap-4">
                  <div>
                    <p className="mb-2 text-sm font-medium text-white/60">GenyPick — World Cup 2026</p>
                    <h2 className="text-4xl font-black leading-[0.96] text-white">
                      Predict the Top 4.
                    </h2>
                  </div>
                  <img
                    src="https://genyleap.com/assets/token/images/geny-logo.svg"
                    alt="GENY"
                    className="h-14 w-14 rounded-2xl border border-white/10 bg-white/5 p-2"
                  />
                </div>
                <p className="max-w-sm text-base leading-6 text-white/72">
                  Enter with GENY, lock your final four, and climb the community leaderboard.
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full border border-geny-cyan/30 bg-geny-cyan/10 px-3 py-1 text-xs font-semibold text-geny-cyan">
                Base mainnet
                  </span>
                  <span className="rounded-full border border-geny-violet/30 bg-geny-violet/10 px-3 py-1 text-xs font-semibold text-violet-200">
                    75% reward pool
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-semibold text-white/70">
                    256 GENY card
                  </span>
                </div>
              </section>

              <PoolStats stats={poolStats} deadline={deadline} />

              <section className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setScreen("leaderboard")}
                  className="panel rounded-[22px] p-4 text-left transition hover:border-geny-cyan/30 hover:bg-white/8"
                >
                  <BarChart3 className="mb-3 h-5 w-5 text-geny-cyan" />
                  <p className="text-sm font-bold text-white">Leaderboard</p>
                  <p className="mt-1 text-xs text-white/55">Pool ranking and picks</p>
                </button>
                <button
                  type="button"
                  onClick={() => setScreen("rules")}
                  className="panel rounded-[22px] p-4 text-left transition hover:border-geny-violet/30 hover:bg-white/8"
                >
                  <Info className="mb-3 h-5 w-5 text-geny-violet" />
                  <p className="text-sm font-bold text-white">Rules</p>
                  <p className="mt-1 text-xs text-white/55">Scoring and rewards</p>
                </button>
              </section>
            </motion.section>
          )}

          {screen === "pick" && (
            <motion.section
              key="pick"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
              className="flex flex-1 flex-col gap-3"
            >
              <div className="mb-1">
                <h2 className="text-2xl font-black text-white">Pick your exact Top 4</h2>
                <p className="mt-1 text-sm text-white/58">Each revision costs GENY. Only your latest active card counts.</p>
              </div>
              {rankConfig.map((item) => (
                <PredictionCard
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  short={item.short}
                  teamId={prediction[item.key]}
                  onClick={() => setActivePick(item.key)}
                />
              ))}
            </motion.section>
          )}

          {screen === "entry" && (
            <motion.section
              key="entry"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <EntryAmountInput
                balance={currentBalance}
                validation={entryAmountValidation}
              />
            </motion.section>
          )}

          {screen === "review" && completePrediction && (
            <motion.section
              key="review"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <ReviewSheet
                prediction={completePrediction}
                entryAmount={entryAmount}
                phase={phase}
                txError={txError}
                balance={currentBalance}
                rawBalance={rawBalance}
                attemptCount={attemptCount}
                maxAttempts={MAX_ATTEMPTS}
                totalPaidByUser={totalPaidByUser}
                rawTotalPaidByUser={rawTotalPaidByUser}
                submissionsLocked={Boolean(submissionsLockedData)}
                paused={Boolean(pausedData)}
                finalized={Boolean(finalizedData)}
                contractConfigured={Boolean(contractAddress)}
                isCorrectNetwork={chainId === BASE_CHAIN_ID}
                onSubmit={submitPrediction}
              />
            </motion.section>
          )}

          {screen === "success" && completePrediction && (
            <motion.section
              key="success"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <ShareCard
                prediction={completePrediction}
                entryAmount={entryAmount}
                txHash={txHash}
                onCast={() => farcaster.castPrediction(completePrediction, entryAmount)}
                onLeaderboard={() => setScreen("leaderboard")}
              />
            </motion.section>
          )}

          {screen === "leaderboard" && (
            <motion.section
              key="leaderboard"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <LeaderboardTable response={leaderboard} finalized={poolStats.finalized} />
            </motion.section>
          )}

          {screen === "rules" && (
            <motion.section
              key="rules"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <RulesModal deadline={deadline} />
            </motion.section>
          )}

          {screen === "admin" && (
            <motion.section
              key="admin"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -18 }}
            >
              <AdminPanel />
            </motion.section>
          )}
        </AnimatePresence>

        <footer className="mt-6 space-y-3 text-center text-[11px] leading-5 text-white/42">
          <p>
            GenyPick is a community prediction game powered by GENY. Participation does not guarantee profit. Rewards are distributed from the community pool according to the published rules, eligibility, availability, and applicable local regulations.
          </p>
          {isAdmin && (
            <button type="button" onClick={() => setScreen("admin")} className="text-white/35 underline-offset-4 hover:text-white/70 hover:underline">
              Admin
            </button>
          )}
        </footer>

        {activePick && (
          <TeamSelector
            title={rankConfig.find((rank) => rank.key === activePick)?.label ?? "Select team"}
            selectedTeamId={prediction[activePick]}
            selectedIds={selectedIds}
            teams={WORLD_CUP_2026_TEAMS}
            onSelect={(teamId) => updatePrediction(activePick, teamId)}
            onClose={() => setActivePick(null)}
          />
        )}

        {screen === "home" && (
          <StickyCta
            label={isClosed ? "Closed" : "Start Prediction"}
            icon={<ShieldCheck className="h-4 w-4" />}
            disabled={isClosed}
            onClick={() => setScreen("pick")}
          />
        )}
        {screen === "pick" && (
          <StickyCta
            label="Continue"
            disabled={!canContinueFromPick}
            onClick={() => setScreen("entry")}
          />
        )}
        {screen === "entry" && (
          <StickyCta
            label="Review Prediction"
            disabled={!entryAmountValidation.ok}
            onClick={() => setScreen("review")}
          />
        )}
      </div>
    </main>
  );
}

function StickyCta({
  label,
  icon,
  disabled,
  onClick
}: {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink-950/82 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-2xl">
      <div className="mx-auto max-w-[450px]">
        <button
          type="button"
          disabled={disabled}
          onClick={onClick}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-geny-cyan via-geny-blue to-geny-violet px-4 text-sm font-black text-white shadow-glow transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {icon}
          {label}
          <CheckCircle2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
