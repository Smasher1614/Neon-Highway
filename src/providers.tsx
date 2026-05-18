'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  connectorsForWallets,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import {
  metaMaskWallet,
  injectedWallet,
} from '@rainbow-me/rainbowkit/wallets';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import '@rainbow-me/rainbowkit/styles.css';
import { Attribution } from 'ox/erc8021';


const connectors = connectorsForWallets(
  [
    {
      groupName: 'Recommended',
      wallets: [metaMaskWallet, injectedWallet],
    },
  ],
  {
    appName: 'Neon Highway — Base Racing',
    projectId: 'N/A', // Not used for injected wallets, but property is required in some versions of RainbowKit types
  }
);

// ── Official Base Builder Code attribution (ERC-8021 / ox) ──
// Replace 'BUILDER_CODE_PLACEHOLDER' with your real builder code before going live.
const DATA_SUFFIX = Attribution.toDataSuffix({ codes: ['BUILDER_CODE_PLACEHOLDER'] });

const config = createConfig({
  connectors,
  chains: [base],
  transports: {
    [base.id]: http(),
  },
  ssr: false,
  dataSuffix: DATA_SUFFIX,
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#3b82f6',
            accentColorForeground: 'white',
            borderRadius: 'large',
          })}
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
