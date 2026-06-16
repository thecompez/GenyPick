"use client";

import { farcasterMiniApp as miniAppConnector } from "@farcaster/miniapp-wagmi-connector";
import { injected } from "@wagmi/core";
import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { base, baseSepolia } from "wagmi/chains";

export const wagmiConfig = createConfig({
  chains: [base, baseSepolia],
  connectors: [miniAppConnector(), injected()],
  transports: {
    [base.id]: http(process.env.NEXT_PUBLIC_BASE_RPC_URL),
    [baseSepolia.id]: http(process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL)
  },
  ssr: true
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});
