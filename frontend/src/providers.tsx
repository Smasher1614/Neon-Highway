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

// QueryClient is safe at module scope (no browser APIs)
const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});

// Lazy singleton — created only once, only in the browser
let wagmiConfig: ReturnType<typeof createConfig> | null = null;
function getConfig() {
  if (wagmiConfig) return wagmiConfig;
  const connectors = connectorsForWallets(
    [{ groupName: 'Recommended', wallets: [metaMaskWallet, injectedWallet] }],
    { appName: 'Neon Highway — Base Racing', projectId: 'N/A' }
  );
  wagmiConfig = createConfig({
    connectors,
    chains: [base],
    transports: { [base.id]: http() },
    ssr: false,
  });
  return wagmiConfig;
}

export function Providers({ children }: { children: React.ReactNode }) {
  // useState lazy initializer runs only on the client, never during SSR
  const [config] = React.useState(() => getConfig());
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
