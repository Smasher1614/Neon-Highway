'use client';

import React, { useState, useEffect } from 'react';
import { useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseEther } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { RACING_GAME_ABI, CONTRACT_ADDRESS, GAME_FEE_ETH, DATA_SUFFIX } from '../lib/contract';
import GameCanvas from '../components/GameCanvas';
import Leaderboard from '../components/Leaderboard';
import { NetworkGuard } from '../components/NetworkGuard';

type Screen = 'lobby' | 'starting' | 'playing' | 'gameover';

// ── Spinner svg ──
const Spinner = () => (
  <svg className="spin" width="18" height="18" fill="none" viewBox="0 0 24 24">
    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path style={{ opacity: 0.8 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

// ── Fee badge ──
function FeeBadge({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '9px 14px', borderRadius: 8,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa' }}>0.00001 ETH</span>
    </div>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [username, setUsername] = useState('');
  const [finalScore, setFinalScore] = useState(0);
  const [checkInBonus, setCheckInBonus] = useState(0);
  const [checkInDone, setCheckInDoneLocal] = useState(false);

  // ── Start Game tx ──
  const { writeContract: writeStart, data: startHash, isPending: startPending, error: startError } = useWriteContract();
  const { isLoading: startConfirming, isSuccess: startConfirmed } = useWaitForTransactionReceipt({ hash: startHash });
  useEffect(() => { if (startConfirmed) setScreen('playing'); }, [startConfirmed]);

  // ── Submit Score tx ──
  const { writeContract: writeScore, data: scoreHash, isPending: scorePending } = useWriteContract();
  const { isLoading: scoreConfirming, isSuccess: scoreSubmitted } = useWaitForTransactionReceipt({ hash: scoreHash });

  // ── Daily Check-In tx ──
  const { writeContract: writeCheckIn, data: checkInHash, isPending: checkInPending } = useWriteContract();
  const { isLoading: checkInConfirming, isSuccess: checkInSuccess } = useWaitForTransactionReceipt({ hash: checkInHash });
  useEffect(() => {
    if (checkInSuccess) { setCheckInBonus(b => b + 10); setCheckInDoneLocal(true); }
  }, [checkInSuccess]);

  const handleStartGame = () => {
    if (!username.trim()) return;
    setScreen('starting');
    writeStart({
      address: CONTRACT_ADDRESS,
      abi: RACING_GAME_ABI,
      functionName: 'startGame',
      value: parseEther(GAME_FEE_ETH),
      dataSuffix: DATA_SUFFIX,
    });
  };

  const handleSubmitScore = () => {
    writeScore({
      address: CONTRACT_ADDRESS,
      abi: RACING_GAME_ABI,
      functionName: 'submitScore',
      args: [BigInt(finalScore), username],
      value: parseEther(GAME_FEE_ETH),
      dataSuffix: DATA_SUFFIX,
    });
  };

  const handleCheckIn = () => {
    writeCheckIn({
      address: CONTRACT_ADDRESS,
      abi: RACING_GAME_ABI,
      functionName: 'dailyCheckIn',
      value: parseEther(GAME_FEE_ETH),
      dataSuffix: DATA_SUFFIX,
    });
  };

  const handleGameOver = (score: number) => { setFinalScore(score); setScreen('gameover'); };
  const handleBack = () => { setFinalScore(0); setCheckInBonus(0); setScreen('lobby'); };

  const startBusy = startPending || startConfirming || screen === 'starting';

  return (
    <NetworkGuard>
      <div className="hero-bg" style={{ minHeight: '100vh' }}>

        {/* ── Header ── */}
        <header style={{
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(7,11,20,0.85)',
          backdropFilter: 'blur(20px)',
        }}>
          <div className="site-header-inner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                background: 'rgba(59,130,246,0.15)',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15,
              }}>⚡</div>
              <span className="site-logo-text">
                <span className="neon-blue">NEON</span>
                <span style={{ color: 'white' }}> HIGHWAY</span>
              </span>
              <span className="base-badge" style={{
                fontSize: 10, color: '#3b82f6',
                background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace', flexShrink: 0,
              }}>Base L2</span>
            </div>
            <ConnectButton showBalance={false} chainStatus="icon" accountStatus="avatar" />
          </div>
        </header>

        <main className="main-content" style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 20px' }}>

          {/* ════════ LOBBY ════════ */}
          {(screen === 'lobby' || screen === 'starting') && (
            <div className="lobby-grid">

              {/* Left card */}
              <div className="glass-card">

                {/* Banner */}
                <div style={{
                  height: 200, position: 'relative', overflow: 'hidden',
                  background: 'linear-gradient(135deg, rgba(15,23,42,0.95) 0%, rgba(30,27,75,0.9) 50%, rgba(15,23,42,0.95) 100%)',
                  borderBottom: '1px solid rgba(59,130,246,0.15)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '24px 24px',
                }}>
                  {/* Neon road illustration */}
                  <svg style={{ position: 'absolute', top: 0, right: 0, height: '100%', width: '55%', opacity: 0.55 }} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice">
                    {/* Sky gradient bg */}
                    <defs>
                      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f172a"/>
                        <stop offset="100%" stopColor="#1e293b"/>
                      </linearGradient>
                      <linearGradient id="roadGrad" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1e293b"/>
                        <stop offset="50%" stopColor="#0f172a"/>
                        <stop offset="100%" stopColor="#1e293b"/>
                      </linearGradient>
                    </defs>
                    <rect width="200" height="200" fill="url(#skyGrad)"/>
                    {/* Buildings */}
                    <rect x="0" y="80" width="30" height="120" fill="#0f1f35" opacity="0.8"/>
                    <rect x="160" y="60" width="40" height="140" fill="#0f1f35" opacity="0.8"/>
                    {/* Windows */}
                    <rect x="4" y="86" width="6" height="5" fill="#fbbf24" opacity="0.3"/>
                    <rect x="14" y="86" width="6" height="5" fill="#fbbf24" opacity="0.5"/>
                    <rect x="4" y="96" width="6" height="5" fill="#fbbf24" opacity="0.2"/>
                    <rect x="164" y="70" width="6" height="5" fill="#60a5fa" opacity="0.4"/>
                    <rect x="174" y="70" width="6" height="5" fill="#60a5fa" opacity="0.3"/>
                    <rect x="184" y="70" width="6" height="5" fill="#fbbf24" opacity="0.5"/>
                    {/* Road */}
                    <rect x="55" y="0" width="90" height="200" fill="url(#roadGrad)"/>
                    {/* Road edge neon lines */}
                    <rect x="52" y="0" width="3" height="200" fill="#3b82f6" opacity="0.8"/>
                    <rect x="145" y="0" width="3" height="200" fill="#3b82f6" opacity="0.8"/>
                    {/* Lane dashes */}
                    <rect x="99" y="10" width="3" height="30" fill="white" opacity="0.2"/>
                    <rect x="99" y="60" width="3" height="30" fill="white" opacity="0.2"/>
                    <rect x="99" y="110" width="3" height="30" fill="white" opacity="0.2"/>
                    <rect x="99" y="160" width="3" height="30" fill="white" opacity="0.2"/>
                    {/* Player car (blue) */}
                    <rect x="68" y="130" width="26" height="48" rx="5" fill="#3b82f6"/>
                    <rect x="73" y="138" width="16" height="14" rx="3" fill="#1e3a5f"/>
                    <rect x="70" y="133" width="8" height="5" fill="#fef08a" opacity="0.9"/>
                    <rect x="88" y="133" width="8" height="5" fill="#fef08a" opacity="0.9"/>
                    {/* Enemy car (red) */}
                    <rect x="108" y="50" width="26" height="48" rx="5" fill="#ef4444"/>
                    <rect x="113" y="58" width="16" height="14" rx="3" fill="#1a1a2e"/>
                    <rect x="110" y="90" width="8" height="5" fill="#f97316" opacity="0.8"/>
                    <rect x="128" y="90" width="8" height="5" fill="#f97316" opacity="0.8"/>
                    {/* Speed blur lines */}
                    <rect x="65" y="100" width="35" height="2" fill="#3b82f6" opacity="0.15"/>
                    <rect x="65" y="106" width="28" height="1" fill="#3b82f6" opacity="0.1"/>
                  </svg>
                  <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, color: '#10b981',
                        background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)',
                        padding: '2px 8px', borderRadius: 20,
                      }}>🟢 LIVE</span>
                        <span style={{ fontSize: 10, color: '#475569' }}>Base Mainnet · Chain ID 8453</span>
                    </div>
                    <div className="neon-blue" style={{ fontSize: 32, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.01em' }}>START RACING</div>
                    <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Top-down car racing on Base L2 blockchain</div>
                  </div>
                </div>

                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {!isConnected ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 0', gap: 16 }}>
                      <div style={{ fontSize: 36 }}>👤</div>
                      <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center' }}>Connect your wallet to race on Base</p>
                      <ConnectButton />
                    </div>
                  ) : (
                    <>
                      {/* Username */}
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                          Racer Name
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 15, color: '#475569' }}>👤</span>
                          <input
                            className="input-field"
                            type="text"
                            value={username}
                            onChange={e => setUsername(e.target.value.slice(0, 20))}
                            placeholder="SpeedRacer99"
                            maxLength={20}
                          />
                        </div>
                      </div>

                      {/* Start button */}
                      <button
                        className="btn-primary"
                        onClick={handleStartGame}
                        disabled={!username.trim() || startBusy}
                      >
                         {startBusy ? <><Spinner />{startPending ? 'Confirm in wallet…' : 'Starting…'}</> : <> ▶ &nbsp;Start Game — 0.00001 ETH</>}
                      </button>

                      {/* Daily check-in */}
                      <div style={{
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 10, padding: '14px 16px',
                        background: 'rgba(255,255,255,0.02)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 20 }}>📅</span>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 14, color: 'white' }}>Daily Check-In</div>
                            <div style={{ fontSize: 11, color: '#475569' }}>+10 bonus points · 24h cooldown</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {checkInBonus > 0 && <span className="neon-green" style={{ fontSize: 12, fontWeight: 700 }}>+{checkInBonus} pts!</span>}
                          <button
                            onClick={handleCheckIn}
                            disabled={checkInDone || checkInPending || checkInConfirming}
                            style={{
                              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                              background: checkInDone ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.15)',
                              border: '1px solid rgba(16,185,129,0.3)',
                              color: checkInDone ? '#10b981' : '#34d399',
                              cursor: checkInDone ? 'not-allowed' : 'pointer',
                              opacity: checkInDone ? 0.6 : 1,
                              display: 'flex', alignItems: 'center', gap: 6,
                            }}
                          >
                            {checkInPending || checkInConfirming ? <><Spinner />Confirming…</> : checkInDone ? '✅ Done' : '0.00001 ETH'}
                          </button>
                        </div>
                      </div>

                      {/* Fee grid */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        {['Start Game', 'Switch Camera', 'Submit Score', 'Daily Check-In'].map(label => (
                          <FeeBadge key={label} label={label} />
                        ))}
                      </div>

                      {startError && (
                        <div style={{ color: '#ef4444', fontSize: 12, padding: '8px 12px', background: 'rgba(239,68,68,0.08)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)' }}>
                          {(startError as any).shortMessage || startError.message}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Right: Leaderboard */}
              <Leaderboard />
            </div>
          )}

          {/* ════════ PLAYING ════════ */}
          {screen === 'playing' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
              <GameCanvas username={username} onGameOver={handleGameOver} bonusPoints={checkInBonus} />
            </div>
          )}

          {/* ════════ GAME OVER ════════ */}
          {screen === 'gameover' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, maxWidth: 480, margin: '0 auto' }}>
              <div className="glass-card" style={{ width: '100%' }}>
                <div style={{ padding: '36px 28px 28px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ fontSize: 56, marginBottom: 12 }}>💥</div>
                  <div className="neon-red" style={{ fontSize: 42, fontWeight: 900, letterSpacing: '0.04em' }}>CRASHED!</div>
                  <div style={{ color: '#64748b', fontSize: 13, marginTop: 6 }}>Your race ended</div>
                </div>
                <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <div className="neon-blue" style={{ fontSize: 52, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>
                      {finalScore.toLocaleString()}
                    </div>
                    <div style={{ color: '#475569', fontSize: 13 }}>Final Score</div>
                  </div>
                  <button
                    className="btn-green"
                    onClick={handleSubmitScore}
                    disabled={scorePending || scoreConfirming || scoreSubmitted}
                  >
                    {scoreSubmitted ? '✅ Score Submitted!'
                      : scorePending || scoreConfirming ? <><Spinner />Confirming…</>
                      : '🏆 Submit to Leaderboard — 0.00001 ETH'}
                  </button>
                  <button className="btn-secondary" onClick={handleBack}>← Back to Lobby</button>
                </div>
              </div>
              <div style={{ width: '100%' }}><Leaderboard /></div>
            </div>
          )}
        </main>
      </div>
    </NetworkGuard>
  );
}
