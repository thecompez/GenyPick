"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { formatUnits } from "viem";
import { useAccount, usePublicClient, useReadContract, useWriteContract } from "wagmi";
import { base } from "wagmi/chains";
import { Lock, Pause, Play, ShieldCheck, WalletCards } from "lucide-react";
import {
  BASE_CHAIN_ID,
  genyPickAbi,
  getGenyPickAddress
} from "@/lib/contracts";
import { compactAddress } from "@/lib/format";
import { WORLD_CUP_2026_TEAMS } from "@/lib/teams";

const fields = [
  ["champion", "Champion"],
  ["runnerUp", "Runner-up"],
  ["thirdPlace", "Third place"],
  ["fourthPlace", "Fourth place"]
] as const;

function sameAddress(left?: string, right?: string) {
  return Boolean(left && right && left.toLowerCase() === right.toLowerCase());
}

function formatGeny(value?: bigint) {
  return value === undefined ? "0" : Number(formatUnits(value, 18)).toLocaleString();
}

export function AdminPanel() {
  const contractAddress = getGenyPickAddress();
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: base.id });
  const { writeContractAsync } = useWriteContract();
  const [adminSecret, setAdminSecret] = useState("");
  const [deadlineInput, setDeadlineInput] = useState("");
  const [merkleRootInput, setMerkleRootInput] = useState("");
  const [generatedRoot, setGeneratedRoot] = useState("");
  const [values, setValues] = useState({
    champion: 1,
    runnerUp: 18,
    thirdPlace: 7,
    fourthPlace: 41
  });
  const [status, setStatus] = useState<string>();

  const readEnabled = Boolean(contractAddress);
  const { data: owner } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "owner", query: { enabled: readEnabled } });
  const { data: deadline } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "deadline", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: submissionsLocked } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "submissionsLocked", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: paused } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "paused", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: finalized } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "finalized", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: totalPool } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "totalPool", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: rewardPool } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "rewardPool", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: treasuryPool } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "treasuryPool", query: { enabled: readEnabled, refetchInterval: 20_000 } });
  const { data: treasury } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "treasury", query: { enabled: readEnabled } });
  const { data: merkleRoot } = useReadContract({ address: contractAddress, abi: genyPickAbi, functionName: "merkleRoot", query: { enabled: readEnabled, refetchInterval: 20_000 } });

  const isOwner = sameAddress(address, owner);
  const ownerActionDisabled = !contractAddress || !isOwner || !publicClient;

  async function runOwnerAction(label: string, action: () => Promise<`0x${string}`>): Promise<boolean> {
    if (ownerActionDisabled || !publicClient) {
      setStatus("Connect the contract owner wallet to run this action.");
      return false;
    }
    try {
      setStatus(`${label}: waiting for wallet...`);
      const hash = await action();
      setStatus(`${label}: confirming on Base...`);
      await publicClient.waitForTransactionReceipt({ hash });
      setStatus(`${label}: confirmed.`);
      return true;
    } catch (error) {
      setStatus(error instanceof Error ? error.message : `${label} failed`);
      return false;
    }
  }

  async function updateDeadline() {
    const nextDeadline = Number(deadlineInput);
    if (!Number.isFinite(nextDeadline) || nextDeadline <= 0) {
      setStatus("Enter a Unix timestamp in seconds.");
      return;
    }
    await runOwnerAction("Update deadline", () =>
      writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: genyPickAbi,
        functionName: "setDeadline",
        args: [BigInt(nextDeadline)],
        chainId: BASE_CHAIN_ID
      })
    );
  }

  async function setFinalResult() {
    const confirmed = await runOwnerAction("Set final result on-chain", () =>
      writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: genyPickAbi,
        functionName: "setFinalResult",
        args: [values.champion, values.runnerUp, values.thirdPlace, values.fourthPlace],
        chainId: BASE_CHAIN_ID
      })
    );
    if (!confirmed) return;
    setStatus("Syncing final result to database...");
    const response = await fetch("/api/admin/final-result", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ...values, adminSecret, force: true })
    });
    const data = await response.json();
    setStatus(response.ok ? "Final result set on-chain and synced to DB." : data.error ?? "DB sync failed");
  }

  async function recalculateScores() {
    setStatus("Recalculating active-card scores...");
    const response = await fetch("/api/admin/recalculate-scores", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adminSecret })
    });
    const data = await response.json();
    setStatus(
      response.ok
        ? `Scores recalculated. Perfect winners: ${data.perfectWinnerCount ?? 0}. Reward per winner: ${data.rewardPerWinner ?? 0} GENY.`
        : data.error ?? "Admin request failed"
    );
  }

  async function generateRewards() {
    setStatus("Generating Merkle distribution...");
    const response = await fetch("/api/admin/rewards/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ adminSecret })
    });
    const data = await response.json();
    if (response.ok) {
      setGeneratedRoot(data.root ?? "");
      setMerkleRootInput(data.root ?? "");
      setStatus(
        data.noWinner
          ? "No exact Top 4 winners. No claimable rewards generated."
          : `Generated Merkle root for ${data.perfectWinnerCount ?? 0} perfect winners. Reward per winner: ${data.rewardPerWinner ?? 0} GENY. Export/store proofs before setting root.`
      );
    } else {
      setStatus(data.error ?? "Reward generation failed");
    }
  }

  async function setMerkleRoot() {
    if (!/^0x[a-fA-F0-9]{64}$/.test(merkleRootInput)) {
      setStatus("Enter a valid bytes32 Merkle root.");
      return;
    }
    await runOwnerAction("Set Merkle root", () =>
      writeContractAsync({
        address: contractAddress as `0x${string}`,
        abi: genyPickAbi,
        functionName: "setMerkleRoot",
        args: [merkleRootInput as `0x${string}`],
        chainId: BASE_CHAIN_ID
      })
    );
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-2xl font-black text-white">Admin</h2>
        <p className="mt-1 text-sm text-white/58">Owner wallet controls on-chain state. ADMIN_SECRET controls database operations.</p>
      </div>

      <div className="glass rounded-[24px] p-4">
        <div className="mb-4 flex items-center gap-2">
          <WalletCards className="h-4 w-4 text-geny-cyan" />
          <p className="text-sm font-black text-white">Operator status</p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Metric label="Contract" value={contractAddress ? compactAddress(contractAddress) : "Missing"} />
          <Metric label="Connected" value={address ? compactAddress(address) : "No wallet"} />
          <Metric label="Owner" value={owner ? compactAddress(owner) : "Unknown"} />
          <Metric label="Owner wallet" value={isOwner ? "Yes" : "No"} />
          <Metric label="Deadline" value={deadline ? new Date(Number(deadline) * 1000).toLocaleString() : "Unknown"} />
          <Metric label="Locked" value={submissionsLocked ? "Yes" : "No"} />
          <Metric label="Paused" value={paused ? "Yes" : "No"} />
          <Metric label="Finalized" value={finalized ? "Yes" : "No"} />
          <Metric label="Total pool" value={`${formatGeny(totalPool)} GENY`} />
          <Metric label="Reward pool" value={`${formatGeny(rewardPool)} GENY`} />
          <Metric label="Treasury pool" value={`${formatGeny(treasuryPool)} GENY`} />
          <Metric label="Split" value="75/25" />
          <Metric label="Treasury" value={treasury ? compactAddress(treasury) : "Unknown"} />
          <Metric label="Merkle root" value={merkleRoot && merkleRoot !== "0x0000000000000000000000000000000000000000000000000000000000000000" ? "Set" : "Not set"} />
        </div>
      </div>

      <div className="glass rounded-[24px] p-4">
        <label className="text-xs font-semibold uppercase tracking-[0.14em] text-white/45">Admin secret</label>
        <input
          value={adminSecret}
          onChange={(event) => setAdminSecret(event.target.value)}
          type="password"
          className="mt-2 h-12 w-full rounded-2xl border border-white/10 bg-white/7 px-4 text-sm font-bold text-white outline-none focus:border-geny-cyan/60"
        />
      </div>

      <div className="panel rounded-[22px] p-4">
        <p className="mb-3 text-sm font-bold text-white">Submission controls</p>
        <div className="flex gap-2">
          <input
            value={deadlineInput}
            onChange={(event) => setDeadlineInput(event.target.value.replace(/\D/g, ""))}
            placeholder="Unix deadline"
            className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/7 px-4 text-sm font-bold text-white outline-none"
          />
          <button type="button" onClick={updateDeadline} disabled={ownerActionDisabled || Boolean(submissionsLocked) || Boolean(finalized)} className="rounded-2xl bg-white/10 px-4 text-xs font-black text-white disabled:opacity-40">
            Update
          </button>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <OwnerButton icon={<Lock className="h-4 w-4" />} label="Lock" disabled={ownerActionDisabled || Boolean(submissionsLocked) || Boolean(finalized)} onClick={() => runOwnerAction("Lock submissions", () => writeContractAsync({ address: contractAddress as `0x${string}`, abi: genyPickAbi, functionName: "lockSubmissions", chainId: BASE_CHAIN_ID }))} />
          <OwnerButton icon={<Pause className="h-4 w-4" />} label="Pause" disabled={ownerActionDisabled || Boolean(paused)} onClick={() => runOwnerAction("Pause", () => writeContractAsync({ address: contractAddress as `0x${string}`, abi: genyPickAbi, functionName: "pause", chainId: BASE_CHAIN_ID }))} />
          <OwnerButton icon={<Play className="h-4 w-4" />} label="Unpause" disabled={ownerActionDisabled || !paused} onClick={() => runOwnerAction("Unpause", () => writeContractAsync({ address: contractAddress as `0x${string}`, abi: genyPickAbi, functionName: "unpause", chainId: BASE_CHAIN_ID }))} />
        </div>
      </div>

      <div className="panel rounded-[22px] p-4">
        <p className="mb-3 text-sm font-bold text-white">Official final result</p>
        <div className="space-y-3">
          {fields.map(([key, label]) => (
            <label key={key} className="block">
              <span className="mb-1 block text-xs font-semibold text-white/45">{label}</span>
              <select
                value={values[key]}
                onChange={(event) => setValues((current) => ({ ...current, [key]: Number(event.target.value) }))}
                className="h-12 w-full rounded-2xl border border-white/10 bg-ink-800 px-4 text-sm font-bold text-white outline-none"
              >
                {WORLD_CUP_2026_TEAMS.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      </div>

      {status && <p className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm font-semibold text-white/72">{status}</p>}

      <div className="grid grid-cols-2 gap-3">
        <OwnerButton icon={<ShieldCheck className="h-4 w-4" />} label="Set Result" disabled={ownerActionDisabled || Boolean(finalized)} onClick={setFinalResult} />
        <button type="button" onClick={recalculateScores} className="min-h-14 rounded-2xl border border-white/10 bg-white/7 px-4 text-sm font-black text-white">
          Recalculate
        </button>
        <OwnerButton label="Finalize Pool" disabled={ownerActionDisabled || Boolean(finalized)} onClick={() => runOwnerAction("Finalize pool", () => writeContractAsync({ address: contractAddress as `0x${string}`, abi: genyPickAbi, functionName: "finalizePool", chainId: BASE_CHAIN_ID }))} />
        <button type="button" onClick={generateRewards} className="min-h-14 rounded-2xl border border-white/10 bg-white/7 px-4 text-sm font-black text-white">
          Generate Rewards
        </button>
      </div>

      <div className="panel rounded-[22px] p-4">
        <p className="mb-2 text-sm font-bold text-white">Merkle root</p>
        <input
          value={merkleRootInput}
          onChange={(event) => setMerkleRootInput(event.target.value)}
          placeholder={generatedRoot || "0x..."}
          className="h-12 w-full rounded-2xl border border-white/10 bg-white/7 px-4 text-xs font-bold text-white outline-none"
        />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <OwnerButton label="Set Root" disabled={ownerActionDisabled || !finalized} onClick={setMerkleRoot} />
          <OwnerButton label="Withdraw Treasury" disabled={ownerActionDisabled || !finalized} onClick={() => runOwnerAction("Withdraw treasury", () => writeContractAsync({ address: contractAddress as `0x${string}`, abi: genyPickAbi, functionName: "withdrawTreasury", chainId: BASE_CHAIN_ID }))} />
        </div>
      </div>
    </section>
  );
}

function OwnerButton({ label, icon, disabled, onClick }: { label: string; icon?: ReactNode; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-geny-cyan px-4 text-sm font-black text-ink-950 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {icon}
      {label}
    </button>
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
