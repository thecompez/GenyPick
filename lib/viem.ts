import { createPublicClient, http } from "viem";
import { base, baseSepolia } from "viem/chains";

export const basePublicClient = createPublicClient({
  chain: base,
  transport: http(process.env.NEXT_PUBLIC_BASE_RPC_URL)
});

export const baseSepoliaPublicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
});
