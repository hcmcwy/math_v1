export type CurrencyId =
  | '10c'
  | '20c'
  | '50c'
  | '1d'
  | '2d'
  | '5d'
  | '10d'
  | '20d'
  | '50d'
  | '100d'
  | '500d'
  | '1000d';

export type CurrencyKind = 'coin' | 'note';
export type CoinShape = 'circle' | 'scallop12';

export interface HKCurrencyItem {
  id: CurrencyId;
  kind: CurrencyKind;
  cents: number; // Integer cents to avoid floating point inaccuracy
  shortLabel: string; // e.g. "$2" or "5毫"
  chineseName: string; // e.g. "貳圓硬幣"
  spokenName: string; // e.g. "2元" or "5毫"
  englishName: string;
  colorHint: string; // Feature description for hints and reference guide
  accentHex: string;
  secondaryHex: string;
  // Relative visual scale factor for realistic physical comparison
  scaleRatio: number;
  // Coin sprite geometry in /assets/aistudio/Hk_money_coins_7f4379b0.jpg (399x170)
  coinSprite?: {
    cx: number;
    cy: number;
    r: number;
    shape: CoinShape;
  };
  // Note sprite crop box in /assets/aistudio/note_695d1213.png (252x672)
  noteSprite?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
}

export const COINS_SPRITE_URL = '/assets/aistudio/Hk_money_coins_7f4379b0.jpg';
export const NOTES_SPRITE_URL = '/assets/aistudio/note_695d1213.png';

export const HK_CURRENCIES: HKCurrencyItem[] = [
  {
    id: '10c',
    kind: 'coin',
    cents: 10,
    shortLabel: '1毫',
    chineseName: '壹毫硬幣',
    spokenName: '1毫 ($0.10)',
    englishName: 'Ten Cents',
    colorHint: '最細小的金黃色圓邊硬幣，刻有數字 10',
    accentHex: '#C58B2B',
    secondaryHex: '#F3D27A',
    scaleRatio: 0.72,
    coinSprite: { cx: 269.5, cy: 125.5, r: 28, shape: 'circle' },
  },
  {
    id: '20c',
    kind: 'coin',
    cents: 20,
    shortLabel: '2毫',
    chineseName: '貳毫硬幣',
    spokenName: '2毫 ($0.20)',
    englishName: 'Twenty Cents',
    colorHint: '金黃色 12 邊波浪形硬幣，刻有數字 20',
    accentHex: '#C8922B',
    secondaryHex: '#F6DA84',
    scaleRatio: 0.76,
    coinSprite: { cx: 192, cy: 124, r: 29, shape: 'scallop12' },
  },
  {
    id: '50c',
    kind: 'coin',
    cents: 50,
    shortLabel: '5毫',
    chineseName: '伍毫硬幣',
    spokenName: '5毫 ($0.50)',
    englishName: 'Fifty Cents',
    colorHint: '較大的金黃色圓邊硬幣，刻有數字 50',
    accentHex: '#BA8123',
    secondaryHex: '#F1CE72',
    scaleRatio: 0.84,
    coinSprite: { cx: 113, cy: 126, r: 31.5, shape: 'circle' },
  },
  {
    id: '1d',
    kind: 'coin',
    cents: 100,
    shortLabel: '$1',
    chineseName: '壹圓硬幣',
    spokenName: '1元 ($1.00)',
    englishName: 'One Dollar',
    colorHint: '銀白色圓邊硬幣，中央刻有大數字 1',
    accentHex: '#7A8694',
    secondaryHex: '#E3E8EE',
    scaleRatio: 0.94,
    coinSprite: { cx: 346, cy: 49.5, r: 38, shape: 'circle' },
  },
  {
    id: '2d',
    kind: 'coin',
    cents: 200,
    shortLabel: '$2',
    chineseName: '貳圓硬幣',
    spokenName: '2元 ($2.00)',
    englishName: 'Two Dollars',
    colorHint: '銀白色 12 邊波浪形硬幣，中央刻有數字 2',
    accentHex: '#73808E',
    secondaryHex: '#E1E6EC',
    scaleRatio: 1.0,
    coinSprite: { cx: 246, cy: 49, r: 39.5, shape: 'scallop12' },
  },
  {
    id: '5d',
    kind: 'coin',
    cents: 500,
    shortLabel: '$5',
    chineseName: '伍圓硬幣',
    spokenName: '5元 ($5.00)',
    englishName: 'Five Dollars',
    colorHint: '厚身大圓形銀白色硬幣，刻有空心大數字 5',
    accentHex: '#687584',
    secondaryHex: '#DCE3EA',
    scaleRatio: 1.0,
    coinSprite: { cx: 146.5, cy: 49.5, r: 39, shape: 'circle' },
  },
  {
    id: '10d',
    kind: 'coin',
    cents: 1000,
    shortLabel: '$10',
    chineseName: '拾圓硬幣',
    spokenName: '10元 ($10.00)',
    englishName: 'Ten Dollars',
    colorHint: '外圈銀色、內圈金色的雙色硬幣，刻有數字 10',
    accentHex: '#B68526',
    secondaryHex: '#D8DFE6',
    scaleRatio: 0.93,
    coinSprite: { cx: 47, cy: 50.5, r: 36.5, shape: 'circle' },
  },
  {
    id: '20d',
    kind: 'note',
    cents: 2000,
    shortLabel: '$20',
    chineseName: '貳拾元紙幣',
    spokenName: '20元 ($20)',
    englishName: 'Twenty Dollars',
    colorHint: '淺藍色紙幣，印有銅獅圖案與「貳拾」字樣',
    accentHex: '#2563EB',
    secondaryHex: '#DBEAFE',
    scaleRatio: 0.88,
    noteSprite: { x: 4, y: 550, w: 213, h: 108 },
  },
  {
    id: '50d',
    kind: 'note',
    cents: 5000,
    shortLabel: '$50',
    chineseName: '伍拾元紙幣',
    spokenName: '50元 ($50)',
    englishName: 'Fifty Dollars',
    colorHint: '翠綠色紙幣，印有銅獅圖案與「伍拾」字樣',
    accentHex: '#059669',
    secondaryHex: '#D1FAE5',
    scaleRatio: 0.92,
    noteSprite: { x: 4, y: 419, w: 223, h: 112 },
  },
  {
    id: '100d',
    kind: 'note',
    cents: 10000,
    shortLabel: '$100',
    chineseName: '壹佰元紙幣',
    spokenName: '100元 ($100)',
    englishName: 'One Hundred Dollars',
    colorHint: '鮮紅色紙幣（「紅杉魚」），印有「壹佰」字樣',
    accentHex: '#DC2626',
    secondaryHex: '#FEE2E2',
    scaleRatio: 0.95,
    noteSprite: { x: 4, y: 283, w: 230, h: 116 },
  },
  {
    id: '500d',
    kind: 'note',
    cents: 50000,
    shortLabel: '$500',
    chineseName: '伍佰元紙幣',
    spokenName: '500元 ($500)',
    englishName: 'Five Hundred Dollars',
    colorHint: '啡棕色紙幣（「大牛」），印有「伍佰」字樣',
    accentHex: '#92400E',
    secondaryHex: '#FEF3C7',
    scaleRatio: 0.98,
    noteSprite: { x: 4, y: 145, w: 236, h: 119 },
  },
  {
    id: '1000d',
    kind: 'note',
    cents: 100000,
    shortLabel: '$1000',
    chineseName: '壹仟元紙幣',
    spokenName: '1000元 ($1000)',
    englishName: 'One Thousand Dollars',
    colorHint: '金橙色最大面額紙幣（「金牛」），印有「壹仟」字樣',
    accentHex: '#D97706',
    secondaryHex: '#FFEDD5',
    scaleRatio: 1.0,
    noteSprite: { x: 4, y: 4, w: 244, h: 122 },
  },
];

export const CURRENCY_MAP: Record<CurrencyId, HKCurrencyItem> = HK_CURRENCIES.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<CurrencyId, HKCurrencyItem>
);

export const HK_COINS = HK_CURRENCIES.filter((c) => c.kind === 'coin');
export const HK_NOTES = HK_CURRENCIES.filter((c) => c.kind === 'note');

export function formatHKD(cents: number): string {
  const safe = Math.max(0, Math.round(cents));
  const dollars = Math.floor(safe / 100);
  const remCents = safe % 100;
  if (remCents === 0) {
    return `$${dollars}`;
  }
  return `$${dollars}.${String(remCents).padStart(2, '0')}`;
}

export function formatHKDChinese(cents: number): string {
  const safe = Math.max(0, Math.round(cents));
  const dollars = Math.floor(safe / 100);
  const dimes = Math.floor((safe % 100) / 10);
  if (dollars === 0 && dimes === 0) return '0元';
  if (dollars === 0) return `${dimes}毫`;
  if (dimes === 0) return `${dollars}元`;
  return `${dollars}元${dimes}毫`;
}

export function suggestNextCurrency(
  remainingCents: number,
  allowedIds: CurrencyId[]
): HKCurrencyItem | null {
  if (remainingCents <= 0) return null;
  const sorted = allowedIds
    .map((id) => CURRENCY_MAP[id])
    .filter((c) => c.cents <= remainingCents)
    .sort((a, b) => b.cents - a.cents);
  return sorted[0] ?? null;
}
