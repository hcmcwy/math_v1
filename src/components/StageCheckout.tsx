import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Eye, EyeOff, Lightbulb, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react';
import {
  CURRENCY_MAP,
  CurrencyId,
  formatHKD,
  formatHKDChinese,
  suggestNextCurrency,
} from '../data/hkCurrency';
import {
  CheckoutOrder,
  describeCheckoutSuccess,
  generateCheckoutOrders,
  pickPraise,
} from '../data/gameContent';
import { HKMoneyVisual } from './HKMoneyVisual';
import { ShopItemArt } from './ShopItemArt';
import { soundEngine } from '../lib/sound';
import { RoundResultPayload } from '../hooks/useStudentCloud';

interface TrayPiece {
  uid: string;
  currencyId: CurrencyId;
}

interface StageCheckoutProps {
  onCelebrate: (intensity?: 'normal' | 'victory') => void;
  onScoreChange: (score: number, streak: number, current: number, total: number) => void;
  onComplete: (result: RoundResultPayload) => void;
}

export const StageCheckout: React.FC<StageCheckoutProps> = ({
  onCelebrate,
  onScoreChange,
  onComplete,
}) => {
  const [orders] = useState<CheckoutOrder[]>(() => generateCheckoutOrders());
  const [index, setIndex] = useState(0);
  const [tray, setTray] = useState<TrayPiece[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);
  const [hintTier, setHintTier] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showRunningSum, setShowRunningSum] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'retry' | 'hint'; text: string } | null>(null);
  const [trayShake, setTrayShake] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const order = orders[index];

  const paidCents = useMemo(
    () => tray.reduce((sum, p) => sum + CURRENCY_MAP[p.currencyId].cents, 0),
    [tray]
  );

  useEffect(() => {
    onScoreChange(score, streak, index + 1, orders.length);
  }, [score, streak, index, orders.length, onScoreChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const addMoney = useCallback(
    (currencyId: CurrencyId) => {
      if (solved || tray.length >= 24) return;
      const item = CURRENCY_MAP[currencyId];
      if (item.kind === 'coin') {
        soundEngine.playCoinClink(item.cents);
      } else {
        soundEngine.playNoteRustle();
      }
      setTray((prev) => [...prev, { uid: `${Date.now()}_${Math.random()}`, currencyId }]);
      setFeedback(null);
    },
    [solved, tray.length]
  );

  const removePiece = useCallback(
    (uid: string) => {
      if (solved) return;
      soundEngine.playRemoveTick();
      setTray((prev) => prev.filter((p) => p.uid !== uid));
      setFeedback(null);
    },
    [solved]
  );

  const clearTray = useCallback(() => {
    if (solved || tray.length === 0) return;
    soundEngine.playRemoveTick();
    setTray([]);
    setFeedback(null);
  }, [solved, tray.length]);

  const handleMultiTierHint = () => {
    if (solved) return;
    const diff = order.priceCents - paidCents;
    if (diff < 0) {
      setFeedback({
        type: 'hint',
        text: `現在多付了 ${formatHKDChinese(Math.abs(diff))}（${formatHKD(Math.abs(diff))}），點一下付款盤裡的貨幣拿走喔！`,
      });
      return;
    }
    if (diff === 0) {
      setFeedback({ type: 'hint', text: '金額剛好符合標價！快按下「剛好付清」結帳吧！' });
      return;
    }

    const nextTier = hintTier + 1;
    setHintTier(nextTier);

    if (nextTier === 1) {
      const needsNotes = diff >= 2000;
      setFeedback({
        type: 'hint',
        text: needsNotes
          ? `還欠 ${formatHKDChinese(diff)}，建議先放較大面額的紙幣，再湊零錢會更快！`
          : `還欠 ${formatHKDChinese(diff)}，用下方的硬幣組合就能剛好湊齊！`,
      });
    } else {
      const suggestion = suggestNextCurrency(diff, order.allowedDrawerIds);
      setFeedback({
        type: 'hint',
        text: suggestion
          ? `小幫手建議：下一步可以放入「${suggestion.chineseName}」（${suggestion.shortLabel}）！`
          : `還差 ${formatHKDChinese(diff)}，請檢查是否需要調整已放入的硬幣。`,
      });
    }
  };

  const handleCheckout = useCallback(() => {
    if (solved) return;

    if (tray.length === 0) {
      soundEngine.playGentleRetry();
      setTrayShake(true);
      setFeedback({ type: 'retry', text: '請先從錢箱取出港幣放在收銀盤上結帳喔！' });
      window.setTimeout(() => setTrayShake(false), 360);
      return;
    }

    if (paidCents === order.priceCents) {
      const isFirstTry = attemptsOnCurrent === 0;
      const nextStreak = isFirstTry ? streak + 1 : 0;
      const gained = isFirstTry ? 150 + Math.min(nextStreak - 1, 4) * 20 : 100;
      const nextScore = score + gained;
      const nextFirstTry = firstTryCorrect + (isFirstTry ? 1 : 0);

      setSolved(true);
      setScore(nextScore);
      setStreak(nextStreak);
      setFirstTryCorrect(nextFirstTry);
      setFeedback({
        type: 'success',
        text: `${pickPraise(index + 1)} ${describeCheckoutSuccess(order.itemName, order.priceCents)}`,
      });

      soundEngine.playCashRegister();
      onCelebrate('normal');

      timerRef.current = window.setTimeout(() => {
        if (index + 1 >= orders.length) {
          const accuracy = Math.round((nextFirstTry / orders.length) * 100);
          const stars = accuracy >= 83 ? 3 : accuracy >= 50 ? 2 : 1;
          const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          onComplete({
            stage: 'checkout',
            score: nextScore,
            stars,
            correctCount: nextFirstTry,
            totalQuestions: orders.length,
            accuracy,
            durationSeconds,
          });
        } else {
          setIndex((i) => i + 1);
          setTray([]);
          setAttemptsOnCurrent(0);
          setHintTier(0);
          setSolved(false);
          setFeedback(null);
        }
      }, 1450);
    } else {
      soundEngine.playGentleRetry();
      setAttemptsOnCurrent((a) => a + 1);
      setStreak(0);
      setTrayShake(true);
      if (paidCents < order.priceCents) {
        const shortfall = order.priceCents - paidCents;
        setFeedback({
          type: 'retry',
          text: `還差 ${formatHKDChinese(shortfall)}（${formatHKD(shortfall)}）才足夠付款，再加一點港幣吧！`,
        });
      } else {
        const extra = paidCents - order.priceCents;
        setFeedback({
          type: 'retry',
          text: `多付了 ${formatHKDChinese(extra)}（${formatHKD(extra)}），請做到「剛好付清、不用找贖」，點擊收銀盤貨幣即可收回！`,
        });
      }
      window.setTimeout(() => setTrayShake(false), 360);
    }
  }, [
    solved,
    tray.length,
    paidCents,
    order,
    attemptsOnCurrent,
    streak,
    score,
    firstTryCorrect,
    index,
    orders.length,
    onCelebrate,
    onComplete,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (solved) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCheckout();
      } else if (e.key === 'Backspace' && tray.length > 0) {
        e.preventDefault();
        removePiece(tray[tray.length - 1].uid);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [solved, handleCheckout, tray, removePiece]);

  const drawerCoins = order.allowedDrawerIds.filter((id) => CURRENCY_MAP[id].kind === 'coin');
  const drawerNotes = order.allowedDrawerIds.filter((id) => CURRENCY_MAP[id].kind === 'note');

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Shop Counter Main Area */}
      <div className="hk-felt-mat rounded-2xl border-2 border-[#1B6B53] shadow-lg p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left: Product Showcase & Price Tag */}
        <div className="md:col-span-5 relative bg-[#FFFDF9] rounded-xl border border-stone-200 p-5 flex flex-col items-center justify-between text-center shadow-sm overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs text-stone-500">
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800">
              <ShoppingBag className="w-3.5 h-3.5" />
              {order.shopTag}
            </span>
            <span className="font-mono-num">貨品 #{index + 1}</span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 8, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="my-3 flex flex-col items-center"
            >
              <ShopItemArt artId={order.artId} className="w-28 h-28" />
              <h2 className="mt-2 text-xl font-extrabold text-stone-900">{order.itemName}</h2>
            </motion.div>
          </AnimatePresence>

          {/* Crisp HK Shop Price Tag */}
          <div className="w-full rounded-xl bg-amber-50 border border-amber-300/80 px-4 py-3 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900">商品定價</span>
            <div className="text-right">
              <div className="text-2xl md:text-3xl font-display font-extrabold text-rose-700 font-mono-num leading-none">
                {formatHKD(order.priceCents)}
              </div>
              <div className="text-xs font-semibold text-stone-600 mt-1">
                {formatHKDChinese(order.priceCents)}
              </div>
            </div>
          </div>

          {/* Paid Stamp Animation */}
          {solved && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/35 pointer-events-none">
              <div className="animate-stamp-pop border-4 border-rose-600 rounded-xl px-5 py-2 text-rose-600 font-extrabold text-2xl tracking-widest bg-white/95 shadow-lg">
                已付清 PAID
              </div>
            </div>
          )}
        </div>

        {/* Right: Checkout Payment Tray */}
        <div
          className={`md:col-span-7 rounded-xl bg-black/15 border-2 border-dashed ${
            solved
              ? 'border-amber-300 bg-emerald-900/40'
              : paidCents > order.priceCents
              ? 'border-rose-300/80'
              : 'border-emerald-300/40'
          } p-4 flex flex-col justify-between min-h-[250px] ${trayShake ? 'animate-gentle-shake' : ''}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div>
              <span className="text-xs font-bold text-emerald-100">收銀付款盤</span>
              {showRunningSum && (
                <div className="text-lg font-display font-extrabold text-amber-200 font-mono-num">
                  已放：{formatHKD(paidCents)}
                  <span className="ml-2 text-xs font-sans font-semibold text-emerald-100/85">
                    （{formatHKDChinese(paidCents)}）
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowRunningSum((v) => !v)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-emerald-100 cursor-pointer whitespace-nowrap"
              >
                {showRunningSum ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showRunningSum ? '心算挑戰' : '顯示已付'}</span>
              </button>
              <button
                type="button"
                onClick={handleMultiTierHint}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400/20 hover:bg-amber-400/30 border border-amber-300/40 text-xs font-semibold text-amber-200 cursor-pointer whitespace-nowrap"
              >
                <Lightbulb className="w-3.5 h-3.5" />
                <span>付款提示</span>
              </button>
            </div>
          </div>

          {/* Placed Money */}
          <div className="flex-1 flex flex-wrap content-start items-center gap-2.5 py-2 min-h-[120px]">
            {tray.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-emerald-100/55 text-sm py-8 text-center">
                請點選下方硬幣與紙幣，湊出剛好 {formatHKD(order.priceCents)} 付款
              </div>
            ) : (
              <AnimatePresence>
                {tray.map((piece) => (
                  <motion.button
                    key={piece.uid}
                    type="button"
                    initial={{ opacity: 0, scale: 0.65, y: 16 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    transition={{ duration: 0.16 }}
                    onClick={() => removePiece(piece.uid)}
                    title={`點擊收回 ${CURRENCY_MAP[piece.currencyId].chineseName}`}
                    className="cursor-pointer transition-transform hover:-translate-y-1 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg"
                  >
                    <HKMoneyVisual id={piece.currencyId} size="sm" />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearTray}
              disabled={solved || tray.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>收回全部</span>
            </button>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={solved}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] disabled:opacity-60 text-stone-950 text-base font-extrabold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-5 h-5 stroke-[2.6]" />
              <span>剛好付清</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-4 py-3 rounded-xl border text-sm font-bold flex items-center gap-2.5 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : feedback.type === 'hint'
                ? 'bg-sky-50 border-sky-200 text-sky-900'
                : 'bg-amber-50 border-amber-300 text-amber-950'
            }`}
          >
            {feedback.type === 'success' ? (
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
            ) : (
              <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Organized HK Wallet / Cash Drawer (Coins + Notes) */}
      <div className="bg-[#ECE5D8] rounded-2xl border border-[#D8CEBC] p-4 shadow-inner space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-stone-700">我的港幣錢包（點擊放入付款盤）</span>
          <span className="text-xs text-stone-500">按 Enter 付款 · Backspace 退回上一個</span>
        </div>

        <div className="flex flex-wrap items-end justify-center gap-2.5 md:gap-3">
          {drawerCoins.map((cid) => (
            <button
              key={cid}
              type="button"
              disabled={solved}
              onClick={() => addMoney(cid)}
              className="flex flex-col items-center p-2 rounded-xl bg-white border-2 border-stone-200 hover:border-emerald-600 hover:-translate-y-1 active:scale-95 transition-all duration-150 cursor-pointer shadow-xs"
            >
              <HKMoneyVisual id={cid} size="sm" />
              <span className="mt-1 text-xs font-extrabold text-stone-800 font-mono-num">
                {CURRENCY_MAP[cid].shortLabel}
              </span>
            </button>
          ))}
        </div>

        {drawerNotes.length > 0 && (
          <div className="pt-2 border-t border-[#D8CEBC] flex flex-wrap items-end justify-center gap-2.5 md:gap-3">
            {drawerNotes.map((cid) => (
              <button
                key={cid}
                type="button"
                disabled={solved}
                onClick={() => addMoney(cid)}
                className="flex flex-col items-center p-2 rounded-xl bg-white border-2 border-stone-200 hover:border-emerald-600 hover:-translate-y-1 active:scale-95 transition-all duration-150 cursor-pointer shadow-xs"
              >
                <HKMoneyVisual id={cid} size="sm" />
                <span className="mt-1 text-xs font-extrabold text-stone-800 font-mono-num">
                  {CURRENCY_MAP[cid].shortLabel}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
