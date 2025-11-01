"use client";

import { getDefaultConfig, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import { polygon, polygonMumbai, hardhat } from "wagmi/chains";
import { http } from "viem";

// Flag environment untuk mengaktifkan node lokal Hardhat
const useLocalHardhat =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_USE_LOCAL_HARDHAT === "true";

// Komentar (ID): Jika tidak memakai node lokal, jangan sertakan Hardhat
// untuk mencegah request berulang ke 127.0.0.1:8545 dari wagmi/viem
const config = getDefaultConfig({
  appName: "Vaulté",
  projectId: "3b2e592aaef7497d1a7c1b19629a2d21", // Ganti dengan project ID WalletConnect
  chains: useLocalHardhat ? [hardhat, polygonMumbai, polygon] : [polygonMumbai, polygon],
  // Transport: hanya aktifkan endpoint 127.0.0.1 jika useLocalHardhat=true
  transports: useLocalHardhat
    ? {
        [hardhat.id]: http("http://127.0.0.1:8545"),
        [polygonMumbai.id]: http(),
        [polygon.id]: http(),
      }
    : {
        [polygonMumbai.id]: http(),
        [polygon.id]: http(),
      },
  ssr: true,
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>{children}</RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
