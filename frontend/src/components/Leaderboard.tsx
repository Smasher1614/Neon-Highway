'use client';

import { BASE_EXPLORER } from '../lib/contract';

const DEMO_BOARD = [
  { player: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', username: 'NeonKing',   score: 18400 },
  { player: '0xAbCd1234EfEF5678AbCd1234EfEF56789F2E0000', username: 'BaseRacer',  score: 14200 },
  { player: '0x3e4412345678C7F1AbCd1234567890AbCd000001', username: 'DriftLord',  score: 11800 },
  { player: '0x8812AbCd56785A9B1234EfEF56789F2E0000ABCD', username: 'NightOps',   score:  9600 },
  { player: '0x1F2E3D4C5B6A7988D44AbCd1234EfEF00001111', username: 'TurboX',     score:  7100 },
];

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

const rankStyle: Record<number, string> = {
  0: 'rank-1',
  1: 'rank-2',
  2: 'rank-3',
};

const scoreColor: Record<number, string> = {
  0: '#facc15',
  1: '#cbd5e1',
  2: '#f97316',
};

export default function Leaderboard() {
  return (
    <div className="glass-card" style={{ border: '1px solid rgba(59,130,246,0.2)', width: '100%' }}>

      {/* Header */}
      <div style={{
        padding: '18px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(234,179,8,0.12)',
            border: '1px solid rgba(234,179,8,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18,
          }}>🏆</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 17, color: '#f8fafc', letterSpacing: '0.02em' }}>
              Global Leaderboard
            </div>
            <div style={{ fontSize: 12, color: '#475569', marginTop: 2 }}>Top racers on Base Mainnet</div>
          </div>
        </div>
        <div style={{
          fontSize: 10, fontFamily: 'monospace',
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.22)',
          color: '#60a5fa',
          padding: '3px 10px', borderRadius: 20,
        }}>Base Mainnet</div>
      </div>

      {/* Column headers */}
      <div className="lb-grid-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ fontSize: 11, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>#</div>
        <div style={{ fontSize: 11, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Racer</div>
        <div className="lb-addr-col" style={{ fontSize: 11, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Address</div>
        <div style={{ fontSize: 11, color: '#334155', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', textAlign: 'right' }}>Score</div>
      </div>

      {/* Rows */}
      {DEMO_BOARD.map((entry, i) => (
        <div key={i} className="lb-row lb-grid-row" style={{
          borderBottom: i < DEMO_BOARD.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          {/* Rank badge */}
          <div className={`rank-badge ${rankStyle[i] ?? 'rank-other'}`}>{i + 1}</div>

          {/* Username */}
          <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entry.username}
          </div>

          {/* Address */}
          <a
            className="lb-addr-col"
            href={`${BASE_EXPLORER}/address/${entry.player}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, fontFamily: 'monospace', color: '#475569', textDecoration: 'none', transition: 'color 0.15s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#60a5fa')}
            onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
          >
            {shortAddr(entry.player)}
          </a>

          {/* Score */}
          <div className="lb-score-col" style={{
            textAlign: 'right',
            fontWeight: 900, fontSize: 17,
            color: scoreColor[i] ?? '#64748b',
            fontVariantNumeric: 'tabular-nums',
            textShadow: i === 0 ? '0 0 10px rgba(234,179,8,0.6)' : 'none',
          }}>
            {entry.score.toLocaleString()}
          </div>
        </div>
      ))}

      {/* Footer note */}
      <div style={{
        padding: '10px 20px',
        borderTop: '1px solid rgba(59,130,246,0.08)',
        background: 'rgba(59,130,246,0.04)',
        fontSize: 11, color: '#334155', textAlign: 'center',
      }}>
        Deploy contract to show live on-chain scores
      </div>
    </div>
  );
}
