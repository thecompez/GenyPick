"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { buildShareText, getAppUrl, type FarcasterMiniAppState } from "@/lib/farcaster";
import type { TopFourPrediction } from "@/lib/scoring";
import { queryClient, wagmiConfig } from "@/lib/wagmi";

type FarcasterRuntime = FarcasterMiniAppState & {
  addMiniApp: () => Promise<void>;
  castPrediction: (prediction: TopFourPrediction, entryAmount: string) => Promise<void>;
  openUrl: (url: string) => Promise<void>;
  lastActionError?: string;
};

const FarcasterContext = createContext<FarcasterRuntime | null>(null);

export function useFarcaster(): FarcasterRuntime {
  const value = useContext(FarcasterContext);
  if (!value) {
    throw new Error("useFarcaster must be used inside FarcasterProvider");
  }
  return value;
}

export function FarcasterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FarcasterMiniAppState>({
    isLoading: true,
    isMiniApp: false
  });
  const [lastActionError, setLastActionError] = useState<string>();

  useEffect(() => {
    let mounted = true;
    async function initialize() {
      try {
        const { sdk } = await import("@farcaster/miniapp-sdk");
        const isMiniApp = await sdk.isInMiniApp();
        if (!mounted) return;
        if (isMiniApp) {
          const context = await sdk.context;
          setState({
            isLoading: false,
            isMiniApp: true,
            user: context?.user,
            client: context?.client
          });
          await sdk.actions.ready();
        } else {
          setState({ isLoading: false, isMiniApp: false });
        }
      } catch (error) {
        if (!mounted) return;
        setState({
          isLoading: false,
          isMiniApp: false,
          error: error instanceof Error ? error.message : "Farcaster SDK initialization failed"
        });
      }
    }
    initialize();
    return () => {
      mounted = false;
    };
  }, []);

  const addMiniApp = useCallback(async () => {
    setLastActionError(undefined);
    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      await sdk.actions.addMiniApp();
    } catch (error) {
      setLastActionError(error instanceof Error ? error.message : "Unable to add Mini App");
    }
  }, []);

  const castPrediction = useCallback(async (prediction: TopFourPrediction, entryAmount: string) => {
    setLastActionError(undefined);
    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      await sdk.actions.composeCast({
        text: buildShareText(prediction, entryAmount),
        embeds: [getAppUrl()]
      });
    } catch (error) {
      setLastActionError(error instanceof Error ? error.message : "Unable to open Farcaster composer");
    }
  }, []);

  const openUrl = useCallback(async (url: string) => {
    setLastActionError(undefined);
    try {
      const { sdk } = await import("@farcaster/miniapp-sdk");
      const inMiniApp = await sdk.isInMiniApp();
      if (inMiniApp) {
        await sdk.actions.openUrl(url);
      } else if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
    } catch (error) {
      setLastActionError(error instanceof Error ? error.message : "Unable to open link");
    }
  }, []);

  const value = useMemo(
    () => ({ ...state, addMiniApp, castPrediction, openUrl, lastActionError }),
    [addMiniApp, castPrediction, lastActionError, openUrl, state]
  );

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FarcasterContext.Provider value={value}>{children}</FarcasterContext.Provider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
