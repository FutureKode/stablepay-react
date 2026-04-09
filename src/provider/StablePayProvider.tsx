import React, { useMemo } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
} from "@solana/wallet-adapter-wallets";
import type { StablePayProviderProps } from "../types";
import StablePayContext from "../context/StablePayContext";

import "@solana/wallet-adapter-react-ui/styles.css";

export const DEFAULT_RPC =
  "https://mainnet.helius-rpc.com/?api-key=a90079ee-e2b5-438e-9b1a-2ae7ba8c1417";

export function StablePayProvider({
  children,
  endpoint,
  to,
}: StablePayProviderProps) {
  const resolvedEndpoint = endpoint ?? DEFAULT_RPC;

  const wallets = useMemo(
    () => [new PhantomWalletAdapter(), new SolflareWalletAdapter()],
    [],
  );

  return (
    <StablePayContext.Provider value={{ defaultTo: to }}>
      <ConnectionProvider endpoint={resolvedEndpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </StablePayContext.Provider>
  );
}
