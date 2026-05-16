'use client';

import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

export function NetworkGuard({ children }: { children: React.ReactNode }) {
  const { chain, isConnected } = useAccount();
  const { switchChain, isPending } = useSwitchChain();
  const isWrongNetwork = isConnected && chain?.id !== base.id;

  return (
    <>
      {isWrongNetwork && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(90deg, rgba(127,29,29,0.97) 0%, rgba(153,27,27,0.97) 50%, rgba(127,29,29,0.97) 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.45)',
          backdropFilter: 'blur(12px)',
          padding: '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, flexWrap: 'wrap',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>⚠️</span>
            <div>
              <div style={{ fontWeight: 700, color: 'white', fontSize: 14 }}>Wrong Network Detected</div>
              <div style={{ color: '#fca5a5', fontSize: 12 }}>Please switch to Base network to continue</div>
            </div>
          </div>
          <button
            onClick={() => switchChain({ chainId: base.id })}
            disabled={isPending}
            style={{
              padding: '8px 20px', borderRadius: 24,
              background: 'white', color: '#b91c1c',
              border: 'none', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              opacity: isPending ? 0.6 : 1,
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            🔗 {isPending ? 'Switching…' : 'Switch to Base'}
          </button>
        </div>
      )}
      <div style={{ opacity: isWrongNetwork ? 0.25 : 1, pointerEvents: isWrongNetwork ? 'none' : 'auto', userSelect: isWrongNetwork ? 'none' : 'auto' }}>
        {children}
      </div>
    </>
  );
}
