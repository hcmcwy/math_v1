import React, { useId, useState } from 'react';
import {
  COINS_SPRITE_URL,
  CURRENCY_MAP,
  CurrencyId,
  NOTES_SPRITE_URL,
} from '../data/hkCurrency';

interface HKMoneyVisualProps {
  id: CurrencyId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  className?: string;
}

// Generates a smooth 12-scallop wave path (authentic HK $2 and 20c coin shape)
function buildScallop12Path(cx: number, cy: number, rOuter: number): string {
  const lobes = 12;
  const rInner = rOuter * 0.905;
  const steps = lobes * 12;
  const parts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const theta = (i / steps) * Math.PI * 2 - Math.PI / 2;
    const wave = (Math.cos(lobes * theta) + 1) * 0.5;
    const r = rInner + (rOuter - rInner) * wave;
    const x = cx + r * Math.cos(theta);
    const y = cy + r * Math.sin(theta);
    parts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`);
  }
  parts.push('Z');
  return parts.join(' ');
}

const COIN_SIZE_PX: Record<NonNullable<HKMoneyVisualProps['size']>, number> = {
  xs: 44,
  sm: 58,
  md: 78,
  lg: 112,
  xl: 176,
};

const NOTE_WIDTH_PX: Record<NonNullable<HKMoneyVisualProps['size']>, number> = {
  xs: 82,
  sm: 112,
  md: 146,
  lg: 214,
  xl: 320,
};

export const HKMoneyVisual: React.FC<HKMoneyVisualProps> = ({
  id,
  size = 'md',
  showLabel = false,
  className = '',
}) => {
  const clipUid = useId().replace(/:/g, '');
  const [imgFailed, setImgFailed] = useState(false);
  const item = CURRENCY_MAP[id];

  if (item.kind === 'coin' && item.coinSprite) {
    const { cx, cy, r, shape } = item.coinSprite;
    const basePx = COIN_SIZE_PX[size];
    // Preserve realistic physical size differences while keeping touch/view proportions clear
    const displayPx = Math.round(basePx * (0.78 + 0.22 * item.scaleRatio));
    const pad = 1.5;
    const vx = cx - r - pad;
    const vy = cy - r - pad;
    const vw = (r + pad) * 2;
    const vh = (r + pad) * 2;
    const clipRadius = r - 0.6;
    const scallopPath = shape === 'scallop12' ? buildScallop12Path(cx, cy, clipRadius) : '';

    return (
      <div className={`inline-flex flex-col items-center select-none ${className}`}>
        <div
          style={{ width: displayPx, height: displayPx }}
          className="relative flex items-center justify-center drop-shadow-[0_4px_6px_rgba(15,23,42,0.28)]"
        >
          {!imgFailed ? (
            <svg
              viewBox={`${vx} ${vy} ${vw} ${vh}`}
              width={displayPx}
              height={displayPx}
              role="img"
              aria-label={item.chineseName}
              className="block overflow-visible"
            >
              <defs>
                <clipPath id={`coin-clip-${clipUid}`}>
                  {shape === 'scallop12' ? (
                    <path d={scallopPath} />
                  ) : (
                    <circle cx={cx} cy={cy} r={clipRadius} />
                  )}
                </clipPath>
                <radialGradient id={`coin-sheen-${clipUid}`} cx="30%" cy="25%" r="70%">
                  <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.32" />
                  <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.0" />
                  <stop offset="100%" stopColor="#000000" stopOpacity="0.16" />
                </radialGradient>
              </defs>

              <image
                href={COINS_SPRITE_URL}
                x={0}
                y={0}
                width={399}
                height={170}
                preserveAspectRatio="none"
                clipPath={`url(#coin-clip-${clipUid})`}
                onError={() => setImgFailed(true)}
              />

              {/* Subtle metallic sheen & crisp rim */}
              {shape === 'scallop12' ? (
                <path
                  d={scallopPath}
                  fill={`url(#coin-sheen-${clipUid})`}
                  stroke={item.accentHex}
                  strokeWidth={0.9}
                  strokeOpacity={0.55}
                />
              ) : (
                <circle
                  cx={cx}
                  cy={cy}
                  r={clipRadius}
                  fill={`url(#coin-sheen-${clipUid})`}
                  stroke={item.accentHex}
                  strokeWidth={0.9}
                  strokeOpacity={0.55}
                />
              )}
            </svg>
          ) : (
            // Resilient vector fallback (Zero-Broken-Image Policy)
            <svg
              viewBox="0 0 100 100"
              width={displayPx}
              height={displayPx}
              role="img"
              aria-label={item.chineseName}
            >
              {shape === 'scallop12' ? (
                <path
                  d={buildScallop12Path(50, 50, 46)}
                  fill={item.secondaryHex}
                  stroke={item.accentHex}
                  strokeWidth="4"
                />
              ) : (
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill={item.secondaryHex}
                  stroke={item.accentHex}
                  strokeWidth="4"
                />
              )}
              {item.id === '10d' && (
                <circle cx="50" cy="50" r="30" fill="#EAB308" stroke="#A16207" strokeWidth="2" />
              )}
              <text
                x="50"
                y="57"
                textAnchor="middle"
                fill="#1E293B"
                fontSize="26"
                fontWeight="800"
              >
                {item.shortLabel}
              </text>
            </svg>
          )}
        </div>
        {showLabel && (
          <span className="mt-1 text-xs font-bold tracking-tight text-current font-mono-num">
            {item.shortLabel}
          </span>
        )}
      </div>
    );
  }

  // Banknote renderer
  const noteSprite = item.noteSprite!;
  const baseW = NOTE_WIDTH_PX[size];
  const displayW = Math.round(baseW * (0.88 + 0.12 * item.scaleRatio));
  const displayH = Math.round(displayW * (noteSprite.h / noteSprite.w));

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      <div
        style={{ width: displayW, height: displayH }}
        className="relative overflow-hidden rounded-[5px] ring-1 ring-black/20 shadow-[0_5px_10px_rgba(15,23,42,0.26)]"
      >
        {!imgFailed ? (
          <svg
            viewBox={`${noteSprite.x} ${noteSprite.y} ${noteSprite.w} ${noteSprite.h}`}
            width={displayW}
            height={displayH}
            role="img"
            aria-label={item.chineseName}
            className="block w-full h-full"
          >
            <image
              href={NOTES_SPRITE_URL}
              x={0}
              y={0}
              width={252}
              height={672}
              preserveAspectRatio="none"
              onError={() => setImgFailed(true)}
            />
            <rect
              x={noteSprite.x}
              y={noteSprite.y}
              width={noteSprite.w}
              height={noteSprite.h}
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth={1.5}
            />
          </svg>
        ) : (
          <div
            className="w-full h-full flex items-center justify-between px-3 font-display font-extrabold"
            style={{
              backgroundColor: item.secondaryHex,
              color: item.accentHex,
              border: `2px solid ${item.accentHex}`,
            }}
          >
            <span className="text-lg">{item.shortLabel}</span>
            <span className="text-xs">{item.chineseName}</span>
          </div>
        )}
      </div>
      {showLabel && (
        <span className="mt-1 text-xs font-bold tracking-tight text-current font-mono-num">
          {item.shortLabel}
        </span>
      )}
    </div>
  );
};
