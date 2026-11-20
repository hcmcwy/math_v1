import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  shape: 'rect' | 'circle' | 'star';
}

const COLORS = ['#F59E0B', '#10B981', '#E11D48', '#2563EB', '#FACC15', '#14B8A6'];

export const CelebrationEffects: React.FC<{
  burstKey: number;
  intensity?: 'normal' | 'victory';
}> = ({ burstKey, intensity = 'normal' }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (burstKey <= 0) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const count = intensity === 'victory' ? 88 : 38;
    const originX = canvas.width * 0.5;
    const originY = intensity === 'victory' ? canvas.height * 0.38 : canvas.height * 0.42;

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = (intensity === 'victory' ? 5 : 3.6) + Math.random() * 6.5;
      particlesRef.current.push({
        x: originX + (Math.random() - 0.5) * 80,
        y: originY + (Math.random() - 0.5) * 40,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - (intensity === 'victory' ? 4.5 : 3.2),
        size: 6 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.22,
        life: 0,
        maxLife: 52 + Math.random() * 34,
        shape: i % 3 === 0 ? 'star' : i % 2 === 0 ? 'circle' : 'rect',
      });
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawStar = (cx: number, cy: number, r: number) => {
      ctx.beginPath();
      for (let s = 0; s < 5; s++) {
        const a1 = (s * 4 * Math.PI) / 5 - Math.PI / 2;
        const a2 = a1 + (2 * Math.PI) / 5;
        if (s === 0) ctx.moveTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
        else ctx.lineTo(cx + r * Math.cos(a1), cy + r * Math.sin(a1));
        ctx.lineTo(cx + r * 0.45 * Math.cos(a2), cy + r * 0.45 * Math.sin(a2));
      }
      ctx.closePath();
      ctx.fill();
    };

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const next: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += 1;
        if (p.life >= p.maxLife) continue;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.22;
        p.vx *= 0.985;
        p.rotation += p.vRot;

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.65);
        } else if (p.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 0.42, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(0, 0, p.size * 0.65);
        }
        ctx.restore();
        next.push(p);
      }
      particlesRef.current = next;
      if (next.length > 0) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      // let ongoing burst clean up on unmount only
    };
  }, [burstKey, intensity]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-50 pointer-events-none"
      aria-hidden="true"
    />
  );
};
