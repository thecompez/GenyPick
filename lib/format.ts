import { formatUnits, type Address } from "viem";

export function compactAddress(address?: string | Address): string {
  if (!address) return "Not connected";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatGeny(value: bigint | number | string | undefined, decimals = 18): string {
  if (value === undefined || value === null) return "0 GENY";
  
  let num: number;
  if (typeof value === "bigint") {
    num = Number(formatUnits(value, decimals));
  } else if (typeof value === "string") {
    num = Number(value);
  } else {
    num = value;
  }

  if (Number.isNaN(num)) return "0 GENY";

  let formatted = "";
  if (num >= 1_000_000_000) {
    const bill = num / 1_000_000_000;
    formatted = bill.toLocaleString("en-US", { maximumFractionDigits: 2 }) + "B";
  } else if (num >= 1_000_000) {
    const mill = num / 1_000_000;
    formatted = mill.toLocaleString("en-US", { maximumFractionDigits: 2 }) + "M";
  } else {
    formatted = num.toLocaleString("en-US", { maximumFractionDigits: 2 });
  }

  formatted = trimFormattedNumber(formatted);
  return `${formatted} GENY`;
}

function trimFormattedNumber(val: string): string {
  const match = val.match(/^([\d,.]+)([MB]?)$/);
  if (!match) return val;
  const [, numStr, suffix] = match;
  
  let trimmed = numStr;
  if (trimmed.includes(".")) {
    trimmed = trimmed.replace(/0+$/, "");
    trimmed = trimmed.replace(/\.$/, "");
  }
  return trimmed + suffix;
}

export function isSameAddress(a?: string, b?: string): boolean {
  return Boolean(a && b && a.toLowerCase() === b.toLowerCase());
}

export function formatDateTime(value?: string | number | Date): string {
  if (!value) return "Pending";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Pending";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

export function formatTimeLeft(deadline?: number): string {
  if (!deadline) return "Set after deploy";
  const ms = deadline * 1000 - Date.now();
  if (ms <= 0) return "Closed";
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h`;
  const minutes = Math.floor((ms % 3_600_000) / 60_000);
  return `${hours}h ${minutes}m`;
}
