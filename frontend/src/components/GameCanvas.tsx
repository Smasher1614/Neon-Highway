'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';
import { RACING_GAME_ABI, CONTRACT_ADDRESS, BUILDER_CODE, ENCODED_BUILDER_STRING, GAME_FEE_ETH } from '../lib/contract';

// ──────────────────────────────────────────────────────────────
// Constants
// ──────────────────────────────────────────────────────────────
const CANVAS_W = 480;
const CANVAS_H = 640;
const ROAD_LEFT = 80;
const ROAD_RIGHT = 400;
const ROAD_W = ROAD_RIGHT - ROAD_LEFT;
const LANE_W = ROAD_W / 3;
const CAR_W = 36;
const CAR_H = 64;
const PLAYER_Y = CANVAS_H - 100;

type CameraView = 'top-down' | 'dashboard';

interface Obstacle {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: 'car' | 'truck' | 'oil';
  color: string;
  speed: number;
}

interface FloatText { id: number; text: string; x: number; y: number; alpha: number; color: string; }

// ──────────────────────────────────────────────────────────────
// Drawing helpers
// ──────────────────────────────────────────────────────────────
function drawCar(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string, isPlayer = false) {
  const r = 8;
  // Body
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();

  // Roof
  ctx.fillStyle = isPlayer ? '#1e3a5f' : '#1a1a2e';
  ctx.beginPath();
  ctx.roundRect(x + 6, y + 16, w - 12, h * 0.4, 4);
  ctx.fill();

  // Windshield glow
  ctx.fillStyle = isPlayer ? 'rgba(96,165,250,0.6)' : 'rgba(200,220,255,0.3)';
  ctx.fillRect(x + 8, y + 18, w - 16, 14);

  // Headlights / taillights
  if (isPlayer) {
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 4, y + 4, 8, 5);
    ctx.fillRect(x + w - 12, y + 4, 8, 5);
    ctx.shadowColor = '#fef08a';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ef4444';
    ctx.fillRect(x + 4, y + h - 8, 8, 5);
    ctx.fillRect(x + w - 12, y + h - 8, 8, 5);
  } else {
    ctx.fillStyle = '#f97316';
    ctx.fillRect(x + 4, y + h - 8, 8, 5);
    ctx.fillRect(x + w - 12, y + h - 8, 8, 5);
  }
}

function drawTruck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.roundRect(x, y, 44, 100, 6);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.fillRect(x + 6, y + 8, 32, 24);
  ctx.fillStyle = 'rgba(255,255,200,0.4)';
  ctx.fillRect(x + 8, y + 10, 28, 12);
  ctx.fillStyle = '#92400e';
  ctx.fillRect(x + 4, y + 40, 36, 56);
  // Taillights
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(x + 4, y + 92, 10, 6);
  ctx.fillRect(x + 30, y + 92, 10, 6);
}

function drawBarrier(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const grad = ctx.createLinearGradient(x, y, x, y + 24);
  grad.addColorStop(0, '#f97316');
  grad.addColorStop(0.5, '#dc2626');
  grad.addColorStop(1, '#f97316');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, 24, 4);
  ctx.fill();
  // Warning stripes
  ctx.fillStyle = '#000';
  for (let i = 0; i < 5; i++) {
    ctx.fillRect(x + i * (w / 5) + 4, y + 4, 6, 16);
  }
}

function drawOilSpill(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const grad = ctx.createRadialGradient(x + 28, y + 20, 2, x + 28, y + 20, 28);
  grad.addColorStop(0, 'rgba(139,92,246,0.6)');
  grad.addColorStop(0.5, 'rgba(30,20,60,0.7)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(x + 28, y + 20, 28, 18, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRoad(ctx: CanvasRenderingContext2D, scrollOffset: number) {
  // Background / grass
  ctx.fillStyle = '#0a1628';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // City buildings (parallax BG)
  ctx.fillStyle = '#111827';
  for (let i = 0; i < 6; i++) {
    const bx = i * 80;
    const bh = 80 + (i % 3) * 40;
    ctx.fillRect(bx, CANVAS_H - bh - 40, 60, bh);
    // Windows
    ctx.fillStyle = 'rgba(250,204,21,0.15)';
    for (let wy = 0; wy < bh - 10; wy += 12) {
      for (let wx = 0; wx < 5; wx++) {
        if (Math.random() > 0.4) ctx.fillRect(bx + 4 + wx * 10, CANVAS_H - bh - 40 + wy + 4, 6, 8);
      }
    }
    ctx.fillStyle = '#111827';
  }

  // Road surface
  const roadGrad = ctx.createLinearGradient(ROAD_LEFT, 0, ROAD_RIGHT, 0);
  roadGrad.addColorStop(0, '#1e293b');
  roadGrad.addColorStop(0.5, '#0f172a');
  roadGrad.addColorStop(1, '#1e293b');
  ctx.fillStyle = roadGrad;
  ctx.fillRect(ROAD_LEFT, 0, ROAD_W, CANVAS_H);

  // Road edges (neon)
  ctx.strokeStyle = '#3b82f6';
  ctx.lineWidth = 3;
  ctx.shadowColor = '#3b82f6';
  ctx.shadowBlur = 12;
  ctx.beginPath(); ctx.moveTo(ROAD_LEFT, 0); ctx.lineTo(ROAD_LEFT, CANVAS_H); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ROAD_RIGHT, 0); ctx.lineTo(ROAD_RIGHT, CANVAS_H); ctx.stroke();
  ctx.shadowBlur = 0;

  // Lane dashes
  ctx.setLineDash([40, 30]);
  ctx.strokeStyle = 'rgba(148,163,184,0.4)';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 0;
  for (let lane = 1; lane <= 2; lane++) {
    const lx = ROAD_LEFT + lane * LANE_W;
    ctx.beginPath();
    ctx.moveTo(lx, -80 + (scrollOffset % 70));
    ctx.lineTo(lx, CANVAS_H);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawDashboardOverlay(ctx: CanvasRenderingContext2D, speed: number, score: number) {
  // Dashboard tint (reduced to avoid blurring the view)
  const dashGrad = ctx.createLinearGradient(0, CANVAS_H * 0.8, 0, CANVAS_H);
  dashGrad.addColorStop(0, 'rgba(0,0,0,0)');
  dashGrad.addColorStop(1, 'rgba(5,10,20,0.8)');
  ctx.fillStyle = dashGrad;
  ctx.fillRect(0, CANVAS_H * 0.75, CANVAS_W, CANVAS_H * 0.25);

  // Steering wheel
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, CANVAS_H + 30, 70, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2 - 40, CANVAS_H + 28);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H - 38);
  ctx.moveTo(CANVAS_W / 2 + 40, CANVAS_H + 28);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H - 38);
  ctx.stroke();

  // Speedometer circle
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, CANVAS_H - 28, 44, 0, Math.PI * 2);
  ctx.stroke();
  const mph = Math.floor(60 + speed * 12);
  const speedAngle = (mph - 60) / 120;
  ctx.strokeStyle = `hsl(${120 - speedAngle * 120}, 80%, 50%)`;
  ctx.lineWidth = 6;
  ctx.shadowColor = ctx.strokeStyle;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(CANVAS_W / 2, CANVAS_H - 28, 44, -Math.PI * 0.8, -Math.PI * 0.8 + speedAngle * Math.PI * 1.6);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 20px var(--font-rajdhani, monospace)';
  ctx.textAlign = 'center';
  ctx.fillText(`${mph}`, CANVAS_W / 2, CANVAS_H - 22);
  ctx.fillStyle = '#64748b';
  ctx.font = '10px sans-serif';
  ctx.fillText('MPH', CANVAS_W / 2, CANVAS_H - 10);
  ctx.textAlign = 'left';

  // Mini score
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 14px monospace';
  ctx.fillText(`${score} PTS`, 20, CANVAS_H - 16);
}

// ──────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────
interface GameCanvasProps {
  username: string;
  onGameOver: (score: number) => void;
  bonusPoints: number;
}

export default function GameCanvas({ username, onGameOver, bonusPoints }: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef({
    playerX: ROAD_LEFT + ROAD_W / 2 - CAR_W / 2,
    speed: 3,
    score: 0,
    lives: 3,
    scrollOffset: 0,
    frameCount: 0,
    obstacles: [] as Obstacle[],
    floatTexts: [] as FloatText[],
    nextObstacleId: 0,
    nextFloatId: 0,
    isInvincible: false,
    invincibleFrames: 0,
    isDead: false,
    keys: { left: false, right: false },
    isPaused: false,
    lastLevel: 0,
  });

  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiSpeed, setUiSpeed] = useState(3);
  const [cameraView, setCameraView] = useState<CameraView>('top-down');
  const [transitioning, setTransitioning] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [crashFlash, setCrashFlash] = useState(false);

  const animFrameRef = useRef<number>(0);

  // ── Web3: Camera switch ──
  const { writeContract: writeCamSwitch, data: camHash, isPending: camPending } = useWriteContract();
  const { isLoading: camConfirming, isSuccess: camConfirmed } = useWaitForTransactionReceipt({ hash: camHash });

  useEffect(() => {
    if (camConfirmed) {
      setTransitioning(true);
      setTimeout(() => {
        setCameraView(v => v === 'top-down' ? 'dashboard' : 'top-down');
        setTransitioning(false);
      }, 600);
    }
  }, [camConfirmed]);

  useEffect(() => {
    gameStateRef.current.isPaused = camPending || camConfirming || transitioning;
  }, [camPending, camConfirming, transitioning]);

  const handleCameraSwitch = useCallback(() => {
    const nextView = cameraView === 'top-down' ? 'dashboard' : 'top-down';
    writeCamSwitch({
      address: CONTRACT_ADDRESS,
      abi: RACING_GAME_ABI,
      functionName: 'switchCamera',
      args: [nextView, BUILDER_CODE, ENCODED_BUILDER_STRING],
      value: parseEther(GAME_FEE_ETH),
    });
  }, [cameraView, writeCamSwitch]);

  // ── Key controls ──
  useEffect(() => {
    const gs = gameStateRef.current;
    const down = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gs.keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gs.keys.right = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') gs.keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') gs.keys.right = false;
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); };
  }, []);

  // ── Game loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const gs = gameStateRef.current;

    // Apply bonus points from check-in
    gs.score += bonusPoints;

    const spawnObstacle = () => {
      const lane = Math.floor(Math.random() * 3);
      // Add random horizontal jitter (-30 to +30) so cars aren't perfectly centered, removing safe spots
      const jitter = (Math.random() - 0.5) * 60;
      const lx = ROAD_LEFT + lane * LANE_W + LANE_W / 2 + jitter;
      const types: Obstacle['type'][] = ['car', 'car', 'car', 'truck', 'oil'];
      const type = types[Math.floor(Math.random() * types.length)];
      const colors = ['#ef4444', '#f97316', '#8b5cf6', '#ec4899', '#10b981'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      gs.obstacles.push({
        id: gs.nextObstacleId++,
        x: lx - (type === 'truck' ? 22 : CAR_W / 2),
        y: -130,
        w: type === 'truck' ? 44 : CAR_W,
        h: type === 'truck' ? 100 : type === 'oil' ? 40 : CAR_H,
        type,
        color,
        speed: type === 'car' ? gs.speed * 0.3 : gs.speed * 0.6,
      });
    };

    const addFloat = (text: string, x: number, y: number, color: string) => {
      gs.floatTexts.push({ id: gs.nextFloatId++, text, x, y, alpha: 1, color });
    };

    const triggerCrash = () => {
      if (gs.isInvincible) return;
      gs.lives--;
      gs.isInvincible = true;
      gs.invincibleFrames = 90;
      setCrashFlash(true);
      setTimeout(() => setCrashFlash(false), 600);
      setUiLives(gs.lives);
      if (gs.lives <= 0) {
        gs.isDead = true;
        setIsGameOver(true);
        onGameOver(gs.score);
      }
    };

    const loop = () => {
      if (gs.isDead) return;

      if (!gs.isPaused) {
        gs.frameCount++;
        gs.scrollOffset += gs.speed;

        // Speed scaling: level up every 300 pts
        const currentLevel = Math.floor(gs.score / 300);
        if (currentLevel > gs.lastLevel) {
          gs.lastLevel = currentLevel;
          gs.speed += 0.8; // increase speed noticeably
          addFloat('LEVEL UP! SPEED ++', CANVAS_W / 2 - 70, CANVAS_H / 2, '#3b82f6');
        }
        
        // Ensure initial speed is correct
        if (gs.score < 300 && gs.speed < 3) gs.speed = 3;

        // Score: +1 per frame survived
        if (gs.frameCount % 6 === 0) {
          gs.score++;
          if (gs.score % 50 === 0) setUiScore(gs.score);
        }
        if (gs.frameCount % 30 === 0) {
          setUiScore(gs.score);
          setUiSpeed(gs.speed);
        }

        // Spawn
        const spawnRate = Math.max(50, 120 - Math.floor(gs.speed * 8));
        if (gs.frameCount % spawnRate === 0) spawnObstacle();

        // Player movement
        const moveSpeed = 5 + (gs.speed - 3) * 0.5; // Player moves slightly faster at higher levels
        if (gs.keys.left && gs.playerX > ROAD_LEFT + 20) gs.playerX -= moveSpeed;
        if (gs.keys.right && gs.playerX < ROAD_RIGHT - CAR_W - 20) gs.playerX += moveSpeed;

        // Invincibility frames
        if (gs.isInvincible) {
          gs.invincibleFrames--;
          if (gs.invincibleFrames <= 0) gs.isInvincible = false;
        }
      }

      // ── DRAW ──
      drawRoad(ctx, gs.scrollOffset);

      // Draw obstacles
      for (let i = gs.obstacles.length - 1; i >= 0; i--) {
        const obs = gs.obstacles[i];
        if (!gs.isPaused) {
          obs.y += obs.speed + gs.speed * 0.8;
        }

        if (obs.type === 'car') drawCar(ctx, obs.x, obs.y, obs.w, obs.h, obs.color);
        else if (obs.type === 'truck') drawTruck(ctx, obs.x, obs.y);
        else if (obs.type === 'oil') drawOilSpill(ctx, obs.x, obs.y);

        if (!gs.isPaused) {
          // Collision (shrink hitbox a little for fairness)
          const shrinkX = 4;
          const shrinkY = 8;
          const px = gs.playerX + shrinkX;
          const py = PLAYER_Y + shrinkY;
          const pw = CAR_W - shrinkX * 2;
          const ph = CAR_H - shrinkY * 2;

          if (
            px < obs.x + obs.w - shrinkX &&
            px + pw > obs.x + shrinkX &&
            py < obs.y + obs.h - shrinkY &&
            py + ph > obs.y + shrinkY
          ) {
            if (obs.type === 'oil') {
              // Spin player
              const spin = Math.random() > 0.5 ? 40 : -40;
              gs.playerX = Math.max(ROAD_LEFT + 4, Math.min(ROAD_RIGHT - CAR_W - 4, gs.playerX + spin));
              addFloat('-Oil Spill!', gs.playerX, PLAYER_Y - 20, '#8b5cf6');
              gs.obstacles.splice(i, 1);
            } else {
              triggerCrash();
              addFloat('-1 LIFE!', gs.playerX, PLAYER_Y - 20, '#ef4444');
              gs.obstacles.splice(i, 1);
            }
            continue;
          }

          if (obs.y > CANVAS_H + 20) {
            gs.obstacles.splice(i, 1);
            const bonus = obs.type === 'truck' ? 30 : 10;
            gs.score += bonus;
          }
        }
      }

      // Player (blink if invincible)
      if (!gs.isInvincible || gs.invincibleFrames % 10 < 5) {
        drawCar(ctx, gs.playerX, PLAYER_Y, CAR_W, CAR_H, '#3b82f6', true);
      }

      // Float texts
      for (let i = gs.floatTexts.length - 1; i >= 0; i--) {
        const ft = gs.floatTexts[i];
        if (!gs.isPaused) {
          ft.y -= 1.5;
          ft.alpha -= 0.02;
        }
        if (ft.alpha <= 0) { gs.floatTexts.splice(i, 1); continue; }
        ctx.globalAlpha = ft.alpha;
        ctx.fillStyle = ft.color;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;
      }

      // Dashboard overlay
      if (cameraView === 'dashboard') {
        drawDashboardOverlay(ctx, gs.speed, gs.score);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [cameraView, onGameOver, bonusPoints]);

  // Mobile controls
  const mobileLeft = () => { gameStateRef.current.keys.left = true; };
  const mobileRight = () => { gameStateRef.current.keys.right = true; };
  const mobileRelease = () => { gameStateRef.current.keys.left = false; gameStateRef.current.keys.right = false; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>

      {/* HUD */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
        {/* Lives */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#475569', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Lives</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: '50%',
                background: i < uiLives ? '#ef4444' : '#1e293b',
                border: i < uiLives ? 'none' : '1px solid #334155',
                boxShadow: i < uiLives ? '0 0 8px rgba(239,68,68,0.8)' : 'none',
                transition: 'all 0.3s',
              }} />
            ))}
          </div>
        </div>

        {/* Score */}
        <div style={{ textAlign: 'center' }}>
          <div className="neon-blue" style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.05em' }}>{uiScore.toLocaleString()}</div>
          <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</div>
        </div>

        {/* Speed */}
        <div style={{ textAlign: 'right' }}>
          <div className="neon-cyan" style={{ fontSize: 17, fontWeight: 700 }}>{Math.floor(60 + uiSpeed * 12)} <span style={{ fontSize: 11, fontWeight: 400, color: '#475569' }}>mph</span></div>
          <div style={{ color: '#475569', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Speed</div>
        </div>
      </div>

      {/* Camera Switch */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', justifyContent: 'flex-end' }}>
        <button
          onClick={handleCameraSwitch}
          disabled={camPending || camConfirming || transitioning}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 16px', borderRadius: 10,
            background: 'rgba(88,28,135,0.35)',
            border: '1px solid rgba(139,92,246,0.4)',
            color: '#c4b5fd', fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s',
            opacity: (camPending || camConfirming || transitioning) ? 0.45 : 1,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(109,40,217,0.5)'; (e.currentTarget as HTMLButtonElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(88,28,135,0.35)'; (e.currentTarget as HTMLButtonElement).style.color = '#c4b5fd'; }}
        >
          📷 {camPending || camConfirming ? 'Confirming…' : `${cameraView === 'top-down' ? 'Dashboard' : 'Top-Down'} View — 0.00001 ETH`}
        </button>
      </div>

      {/* Canvas wrapper */}
      <div style={{ position: 'relative' }}>
        {/* Crash flash */}
        {crashFlash && (
          <div className="crash-flash" style={{
            position: 'absolute', inset: 0, zIndex: 20,
            background: 'rgba(239,68,68,0.4)', borderRadius: 12,
            pointerEvents: 'none',
          }} />
        )}

        {/* Transition overlay */}
        {transitioning && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 30,
            background: 'rgba(0,0,0,0.8)', borderRadius: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ color: 'white', fontSize: 17, fontWeight: 700 }}>Switching Camera…</div>
          </div>
        )}

        <div className={cameraView === 'dashboard' ? 'cam-dashboard' : 'cam-top-down'} style={{ opacity: transitioning ? 0.2 : 1 }}>
          <canvas
            ref={canvasRef}
            width={CANVAS_W}
            height={CANVAS_H}
            style={{ display: 'block', borderRadius: 12, border: '1px solid #1e293b', boxShadow: '0 20px 60px rgba(15,23,42,0.6)' }}
          />
        </div>
      </div>

      {/* Mobile controls */}
      <div style={{ width: '100%', maxWidth: 480, display: 'flex', gap: 12 }}>
        <button
          onPointerDown={mobileLeft} onPointerUp={mobileRelease} onPointerLeave={mobileRelease}
          style={{
            flex: 1, padding: '20px 0', borderRadius: 12,
            background: 'rgba(30,58,138,0.3)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#93c5fd', fontSize: 22, fontWeight: 700, cursor: 'pointer',
            userSelect: 'none', touchAction: 'none',
          }}
        >◀</button>
        <button
          onPointerDown={mobileRight} onPointerUp={mobileRelease} onPointerLeave={mobileRelease}
          style={{
            flex: 1, padding: '20px 0', borderRadius: 12,
            background: 'rgba(30,58,138,0.3)', border: '1px solid rgba(59,130,246,0.25)',
            color: '#93c5fd', fontSize: 22, fontWeight: 700, cursor: 'pointer',
            userSelect: 'none', touchAction: 'none',
          }}
        >▶</button>
      </div>

      <p style={{ color: '#334155', fontSize: 12, textAlign: 'center' }}>← / → or A / D to steer</p>
    </div>
  );
}
