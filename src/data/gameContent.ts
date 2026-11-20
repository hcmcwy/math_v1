import { CURRENCY_MAP, CurrencyId, HK_CURRENCIES, formatHKDChinese } from './hkCurrency';

export type StageId = 'recognize' | 'exchange' | 'checkout';

export type AvatarId = 'cat' | 'panda' | 'fox' | 'bear' | 'rabbit' | 'owl' | 'shiba' | 'duck';

export const AVATAR_OPTIONS: { id: AvatarId; label: string; bg: string }[] = [
  { id: 'cat', label: '橘貓', bg: '#FEF3C7' },
  { id: 'panda', label: '熊貓', bg: '#E2E8F0' },
  { id: 'fox', label: '小狐狸', bg: '#FFEDD5' },
  { id: 'bear', label: '小熊', bg: '#FDE68A' },
  { id: 'rabbit', label: '白兔', bg: '#FCE7F3' },
  { id: 'owl', label: '貓頭鷹', bg: '#E0E7FF' },
  { id: 'shiba', label: '柴犬', bg: '#FEF9C3' },
  { id: 'duck', label: '小鴨', bg: '#DCFCE7' },
];

export interface StageMeta {
  id: StageId;
  order: string;
  title: string;
  subtitle: string;
  shortDesc: string;
  questionCount: number;
  accentColor: string;
  badgeText: string;
}

export const STAGES: StageMeta[] = [
  {
    id: 'recognize',
    order: '第一關',
    title: '認識幣值',
    subtitle: '辨認香港硬幣與紙幣',
    shortDesc: '觀察真實港幣圖案、顏色與邊緣形狀，準確選出對應的面額！',
    questionCount: 8,
    accentColor: '#0F766E',
    badgeText: '8 題挑戰',
  },
  {
    id: 'exchange',
    order: '第二關',
    title: '等值置換',
    subtitle: '靈活找換相等金額',
    shortDesc: '運用不同面額的硬幣與紙幣，在兌換盤湊出與目標完全相等的幣值！',
    questionCount: 6,
    accentColor: '#B45309',
    badgeText: '6 題兌換',
  },
  {
    id: 'checkout',
    order: '第三關',
    title: '剛好付清',
    subtitle: '小店收銀剛好付款',
    shortDesc: '化身精明小買家，按貨品標價放出剛好的港幣金額，不用找贖！',
    questionCount: 6,
    accentColor: '#BE123C',
    badgeText: '6 筆購物',
  },
];

export const PRAISE_MESSAGES = [
  '太聰明啦！完全正確！',
  '好厲害！你是精明小買家！',
  '眼明手快，算得超準確！',
  '做得好！繼續保持！',
  '滿分表現，給你一個大讚！',
  '真棒！你越來越熟悉港幣了！',
];

export function pickPraise(index: number): string {
  return PRAISE_MESSAGES[index % PRAISE_MESSAGES.length];
}

// ---------- Stage 1: Recognize Denominations ----------
export interface RecognizeQuestion {
  targetId: CurrencyId;
  options: CurrencyId[];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function generateRecognizeQuestions(): RecognizeQuestion[] {
  // Progressive sequence: 3 common coins -> 2 cent coins -> 3 banknotes (8 total)
  const tier1: CurrencyId[] = shuffle(['1d', '2d', '5d', '10d'] as CurrencyId[]).slice(0, 3);
  const tier2: CurrencyId[] = shuffle(['10c', '20c', '50c'] as CurrencyId[]).slice(0, 2);
  const tier3: CurrencyId[] = shuffle(['20d', '50d', '100d', '500d', '1000d'] as CurrencyId[]).slice(0, 3);
  const targets = [...tier1, ...tier2, ...tier3];

  const allIds = HK_CURRENCIES.map((c) => c.id);

  return targets.map((targetId) => {
    const target = CURRENCY_MAP[targetId];
    // Pick plausible distractors (prefer same kind first)
    const sameKind = shuffle(allIds.filter((id) => id !== targetId && CURRENCY_MAP[id].kind === target.kind));
    const otherKind = shuffle(allIds.filter((id) => id !== targetId && CURRENCY_MAP[id].kind !== target.kind));
    const distractors = [...sameKind.slice(0, 2), ...otherKind.slice(0, 1)];
    return {
      targetId,
      options: shuffle([targetId, ...distractors]),
    };
  });
}

// ---------- Stage 2: Equivalent Exchange ----------
export interface ExchangeQuestion {
  id: string;
  targetId: CurrencyId;
  targetQty: number;
  targetCents: number;
  prompt: string;
  requiredOnlyId?: CurrencyId; // When specified, must exchange using only this coin/note
  allowedDrawerIds: CurrencyId[];
  explanation: string;
}

const EXCHANGE_POOL: {
  tier: number;
  build: () => ExchangeQuestion;
}[] = [
  // Tier 1: Basic cents & $1/$2
  {
    tier: 1,
    build: () => ({
      id: 'ex_50c_to_10c',
      targetId: '50c',
      targetQty: 1,
      targetCents: 50,
      prompt: '請用「1毫」硬幣換取 1 個 5毫 硬幣',
      requiredOnlyId: '10c',
      allowedDrawerIds: ['10c', '20c'],
      explanation: '5 個 1毫 硬幣合起來就是 5毫！',
    }),
  },
  {
    tier: 1,
    build: () => ({
      id: 'ex_1d_to_50c',
      targetId: '1d',
      targetQty: 1,
      targetCents: 100,
      prompt: '請用「5毫」硬幣換取 1 個 1元 硬幣',
      requiredOnlyId: '50c',
      allowedDrawerIds: ['10c', '20c', '50c'],
      explanation: '2 個 5毫 硬幣剛好等於 1元！',
    }),
  },
  {
    tier: 1,
    build: () => ({
      id: 'ex_1d_free',
      targetId: '1d',
      targetQty: 1,
      targetCents: 100,
      prompt: '用較小面額的毫子硬幣，湊出與 1元 相等的金額',
      allowedDrawerIds: ['10c', '20c', '50c'],
      explanation: '1元等於 10 毫，可以用 5毫、2毫或 1毫自由組合！',
    }),
  },
  // Tier 2: $2 and $5
  {
    tier: 2,
    build: () => ({
      id: 'ex_2d_to_50c',
      targetId: '2d',
      targetQty: 1,
      targetCents: 200,
      prompt: '請用「5毫」硬幣換取 1 個 2元 硬幣',
      requiredOnlyId: '50c',
      allowedDrawerIds: ['20c', '50c', '1d'],
      explanation: '4 個 5毫 硬幣剛好等於 2元！',
    }),
  },
  {
    tier: 2,
    build: () => ({
      id: 'ex_5d_free',
      targetId: '5d',
      targetQty: 1,
      targetCents: 500,
      prompt: '用較小面額的硬幣，換取 1 個 5元 硬幣',
      allowedDrawerIds: ['50c', '1d', '2d'],
      explanation: '例如 2 個 2元 加 1 個 1元，剛好等於 5元！',
    }),
  },
  // Tier 3: $10
  {
    tier: 3,
    build: () => ({
      id: 'ex_10d_to_2d',
      targetId: '10d',
      targetQty: 1,
      targetCents: 1000,
      prompt: '請用「2元」硬幣換取 1 個 10元 硬幣',
      requiredOnlyId: '2d',
      allowedDrawerIds: ['1d', '2d', '5d'],
      explanation: '5 個 2元 硬幣（2 × 5 = 10）剛好等於 10元！',
    }),
  },
  {
    tier: 3,
    build: () => ({
      id: 'ex_10d_free',
      targetId: '10d',
      targetQty: 1,
      targetCents: 1000,
      prompt: '用較小面額的硬幣，換取 1 個 10元 硬幣',
      allowedDrawerIds: ['1d', '2d', '5d'],
      explanation: '2 個 5元 或 5 個 2元 等組合都可以換到 10元！',
    }),
  },
  // Tier 4: $20
  {
    tier: 4,
    build: () => ({
      id: 'ex_20d_to_5d',
      targetId: '20d',
      targetQty: 1,
      targetCents: 2000,
      prompt: '請用「5元」硬幣換取 1 張 20元 紙幣',
      requiredOnlyId: '5d',
      allowedDrawerIds: ['2d', '5d', '10d'],
      explanation: '4 個 5元 硬幣（5 × 4 = 20）剛好等於 20元！',
    }),
  },
  {
    tier: 4,
    build: () => ({
      id: 'ex_20d_free',
      targetId: '20d',
      targetQty: 1,
      targetCents: 2000,
      prompt: '用硬幣湊出與 1 張 20元 紙幣相等的金額',
      allowedDrawerIds: ['2d', '5d', '10d'],
      explanation: '例如 2 個 10元 硬幣就等於 1 張 20元 紙幣！',
    }),
  },
  // Tier 5: $50
  {
    tier: 5,
    build: () => ({
      id: 'ex_50d_free',
      targetId: '50d',
      targetQty: 1,
      targetCents: 5000,
      prompt: '用較小面額的紙幣和硬幣，換取 1 張 50元 紙幣',
      allowedDrawerIds: ['5d', '10d', '20d'],
      explanation: '例如 2 張 20元 加 1 個 10元，剛好是 50元！',
    }),
  },
  // Tier 6: $100 / $500
  {
    tier: 6,
    build: () => ({
      id: 'ex_100d_to_20d',
      targetId: '100d',
      targetQty: 1,
      targetCents: 10000,
      prompt: '請用「20元」紙幣換取 1 張 100元 紙幣',
      requiredOnlyId: '20d',
      allowedDrawerIds: ['10d', '20d', '50d'],
      explanation: '5 張 20元 紙幣（20 × 5 = 100）剛好等於 100元！',
    }),
  },
  {
    tier: 6,
    build: () => ({
      id: 'ex_100d_free',
      targetId: '100d',
      targetQty: 1,
      targetCents: 10000,
      prompt: '用較小面額的紙幣與硬幣，換取 1 張 100元 紙幣',
      allowedDrawerIds: ['10d', '20d', '50d'],
      explanation: '2 張 50元 或 1 張 50元 + 2 張 20元 + 1 個 10元 都是 100元！',
    }),
  },
];

export function generateExchangeQuestions(): ExchangeQuestion[] {
  const tiers = [1, 2, 3, 4, 5, 6];
  return tiers.map((tier) => {
    const candidates = EXCHANGE_POOL.filter((item) => item.tier === tier);
    const chosen = candidates[Math.floor(Math.random() * candidates.length)];
    return chosen.build();
  });
}

// ---------- Stage 3: Exact Payment Checkout ----------
export type ShopItemArtId =
  | 'pineapple_bun'
  | 'lemon_tea'
  | 'fishballs'
  | 'eraser'
  | 'pencil_case'
  | 'storybook'
  | 'notebook'
  | 'milk_tea'
  | 'backpack'
  | 'blocks'
  | 'soccer_ball'
  | 'umbrella';

export interface CheckoutOrder {
  id: string;
  itemName: string;
  shopTag: string;
  artId: ShopItemArtId;
  priceCents: number;
  allowedDrawerIds: CurrencyId[];
}

const CHECKOUT_TIERS: {
  tier: number;
  items: Omit<CheckoutOrder, 'id' | 'allowedDrawerIds'>[];
  drawer: CurrencyId[];
}[] = [
  {
    tier: 1,
    drawer: ['50c', '1d', '2d', '5d'],
    items: [
      { itemName: '香脆菠蘿包', shopTag: '港式麵包店', artId: 'pineapple_bun', priceCents: 600 },
      { itemName: '彩色擦膠', shopTag: '校園文具屋', artId: 'eraser', priceCents: 350 },
      { itemName: '咖哩魚蛋串', shopTag: '街角小食檔', artId: 'fishballs', priceCents: 800 },
    ],
  },
  {
    tier: 2,
    drawer: ['10c', '20c', '50c', '1d', '2d', '5d', '10d'],
    items: [
      { itemName: '凍檸檬茶', shopTag: '冰室飲品吧', artId: 'lemon_tea', priceCents: 1250 },
      { itemName: '格仔筆記本', shopTag: '校園文具屋', artId: 'notebook', priceCents: 980 },
      { itemName: '香滑絲襪奶茶', shopTag: '冰室飲品吧', artId: 'milk_tea', priceCents: 1420 },
    ],
  },
  {
    tier: 3,
    drawer: ['10c', '20c', '50c', '1d', '2d', '5d', '10d', '20d'],
    items: [
      { itemName: '帆布鉛筆盒', shopTag: '校園文具屋', artId: 'pencil_case', priceCents: 2650 },
      { itemName: '兒童彩虹雨傘', shopTag: '百貨生活館', artId: 'umbrella', priceCents: 3480 },
      { itemName: '香港故事繪本', shopTag: '親子小書店', artId: 'storybook', priceCents: 4230 },
    ],
  },
  {
    tier: 4,
    drawer: ['20c', '50c', '1d', '2d', '5d', '10d', '20d', '50d'],
    items: [
      { itemName: '創意積木套裝', shopTag: '玩具天地', artId: 'blocks', priceCents: 6850 },
      { itemName: '運動足球', shopTag: '體育用品店', artId: 'soccer_ball', priceCents: 8500 },
      { itemName: '精裝圖畫百科', shopTag: '親子小書店', artId: 'storybook', priceCents: 7340 },
    ],
  },
  {
    tier: 5,
    drawer: ['50c', '1d', '2d', '5d', '10d', '20d', '50d', '100d'],
    items: [
      { itemName: '輕量護脊書包', shopTag: '百貨生活館', artId: 'backpack', priceCents: 14650 },
      { itemName: '豪華積木城堡', shopTag: '玩具天地', artId: 'blocks', priceCents: 17800 },
      { itemName: '專業比賽足球', shopTag: '體育用品店', artId: 'soccer_ball', priceCents: 12950 },
    ],
  },
  {
    tier: 6,
    drawer: ['50c', '1d', '2d', '5d', '10d', '20d', '50d', '100d', '500d'],
    items: [
      { itemName: '全套書包文具禮盒', shopTag: '百貨生活館', artId: 'backpack', priceCents: 26550 },
      { itemName: '精選繪本套裝（6冊）', shopTag: '親子小書店', artId: 'storybook', priceCents: 34800 },
      { itemName: '超級機械積木組', shopTag: '玩具天地', artId: 'blocks', priceCents: 53650 },
    ],
  },
];

export function generateCheckoutOrders(): CheckoutOrder[] {
  return CHECKOUT_TIERS.map((group) => {
    const pick = group.items[Math.floor(Math.random() * group.items.length)];
    return {
      ...pick,
      id: `ord_${group.tier}_${pick.artId}`,
      allowedDrawerIds: group.drawer,
    };
  });
}

export function describeCheckoutSuccess(itemName: string, priceCents: number): string {
  return `剛好付清 ${formatHKDChinese(priceCents)}！成功買下「${itemName}」！`;
}
