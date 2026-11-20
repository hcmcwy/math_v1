import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Eye, EyeOff, Lightbulb, RotateCcw, Scale, Sparkles } from 'lucide-react';
import {
  CURRENCY_MAP,
  CurrencyId,
  formatHKD,
  formatHKDChinese,
  suggestNextCurrency,
} from '../data/hkCurrency';
import {
  ExchangeQuestion,
  generateExchangeQuestions,
  pickPraise,
} from '../data/gameContent';
import { HKMoneyVisual } from './HKMoneyVisual';
import { soundEngine } from '../lib/sound';
import { RoundResultPayload } from '../hooks/useStudentCloud';

interface TrayPiece {
  uid: string;
  currencyId: CurrencyId;
}

interface StageExchangeProps {
  onCelebrate: (intensity?: 'normal' | 'victory') => void;
  onScoreChange: (score: number, streak: number, current: number, total: number) => void;
  onComplete: (result: RoundResultPayload) => void;
}

export const StageExchange: React.FC<StageExchangeProps> = ({
  onCelebrate,
  onScoreChange,
  onComplete,
}) => {
  const [questions] = useState<ExchangeQuestion[]>(() => generateExchangeQuestions());
  const [index, setIndex] = useState(0);
  const [tray, setTray] = useState<TrayPiece[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [attemptsOnCurrent, setAttemptsOnCurrent] = useState(0);
  const [solved, setSolved] = useState(false);
  const [showTotalHelper, setShowTotalHelper] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'retry' | 'hint'; text: string } | null>(null);
  const [trayShake, setTrayShake] = useState(false);

  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const currentQ = questions[index];

  const currentCents = useMemo(
    () => tray.reduce((sum, p) => sum + CURRENCY_MAP[p.currencyId].cents, 0),
    [tray]
  );

  useEffect(() => {
    onScoreChange(score, streak, index + 1, questions.length);
  }, [score, streak, index, questions.length, onScoreChange]);

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

  const handleHint = () => {
    if (solved) return;
    const allowed = currentQ.requiredOnlyId
      ? [currentQ.requiredOnlyId]
      : currentQ.allowedDrawerIds;
    if (currentCents > currentQ.targetCents) {
      setFeedback({
        type: 'hint',
        text: `現在放多了 ${formatHKDChinese(currentCents - currentQ.targetCents)}，點擊兌換盤上的貨幣即可拿走！`,
      });
      return;
    }
    const remaining = currentQ.targetCents - currentCents;
    if (remaining === 0) {
      setFeedback({ type: 'hint', text: '金額已經剛剛好囉！按「確認兌換」試試看！' });
      return;
    }
    const nextItem = suggestNextCurrency(remaining, allowed);
    if (nextItem) {
      setFeedback({
        type: 'hint',
        text: `還差 ${formatHKDChinese(remaining)}，試試放一個「${nextItem.chineseName}」（${nextItem.shortLabel}）吧！`,
      });
    } else {
      setFeedback({
        type: 'hint',
        text: `還差 ${formatHKDChinese(remaining)}，可能需要先調整一下盤裡的貨幣組合喔！`,
      });
    }
  };

  const handleConfirm = useCallback(() => {
    if (solved) return;

    if (tray.length === 0) {
      soundEngine.playGentleRetry();
      setTrayShake(true);
      setFeedback({ type: 'retry', text: '兌換盤還是空的呢！請點選下方的硬幣或紙幣放進盤子。' });
      window.setTimeout(() => setTrayShake(false), 360);
      return;
    }

    // Check required single-denomination rule if applicable
    if (currentQ.requiredOnlyId) {
      const hasDisallowed = tray.some((p) => p.currencyId !== currentQ.requiredOnlyId);
      if (hasDisallowed) {
        soundEngine.playGentleRetry();
        setAttemptsOnCurrent((a) => a + 1);
        setStreak(0);
        setTrayShake(true);
        const reqItem = CURRENCY_MAP[currentQ.requiredOnlyId];
        setFeedback({
          type: 'retry',
          text: `這一題請只用「${reqItem.chineseName}」來兌換喔！點一下其他貨幣即可移除。`,
        });
        window.setTimeout(() => setTrayShake(false), 360);
        return;
      }
    }

    if (currentCents === currentQ.targetCents) {
      const isFirstTry = attemptsOnCurrent === 0;
      const nextStreak = isFirstTry ? streak + 1 : 0;
      const gained = isFirstTry ? 140 + Math.min(nextStreak - 1, 4) * 20 : 90;
      const nextScore = score + gained;
      const nextFirstTry = firstTryCorrect + (isFirstTry ? 1 : 0);

      setSolved(true);
      setScore(nextScore);
      setStreak(nextStreak);
      setFirstTryCorrect(nextFirstTry);
      setFeedback({
        type: 'success',
        text: `${pickPraise(index + 2)} ${currentQ.explanation}`,
      });

      soundEngine.playSuccessChime(Math.max(1, nextStreak));
      onCelebrate('normal');

      timerRef.current = window.setTimeout(() => {
        if (index + 1 >= questions.length) {
          const accuracy = Math.round((nextFirstTry / questions.length) * 100);
          const stars = accuracy >= 83 ? 3 : accuracy >= 50 ? 2 : 1;
          const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
          onComplete({
            stage: 'exchange',
            score: nextScore,
            stars,
            correctCount: nextFirstTry,
            totalQuestions: questions.length,
            accuracy,
            durationSeconds,
          });
        } else {
          setIndex((i) => i + 1);
          setTray([]);
          setAttemptsOnCurrent(0);
          setSolved(false);
          setFeedback(null);
        }
      }, 1400);
    } else {
      soundEngine.playGentleRetry();
      setAttemptsOnCurrent((a) => a + 1);
      setStreak(0);
      setTrayShake(true);
      if (currentCents < currentQ.targetCents) {
        const diff = currentQ.targetCents - currentCents;
        setFeedback({
          type: 'retry',
          text: `還差 ${formatHKDChinese(diff)}（${formatHKD(diff)}）就等值了，再多放一點試試看！`,
        });
      } else {
        const diff = currentCents - currentQ.targetCents;
        setFeedback({
          type: 'retry',
          text: `比目標多了 ${formatHKDChinese(diff)}（${formatHKD(diff)}），點擊兌換盤上的貨幣可以拿走喔！`,
        });
      }
      window.setTimeout(() => setTrayShake(false), 360);
    }
  }, [
    solved,
    tray,
    currentQ,
    currentCents,
    attemptsOnCurrent,
    streak,
    score,
    firstTryCorrect,
    index,
    questions.length,
    onCelebrate,
    onComplete,
  ]);

  // Enter to confirm, Backspace to undo last piece
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (solved) return;
      if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirm();
      } else if (e.key === 'Backspace' && tray.length > 0) {
        e.preventDefault();
        removePiece(tray[tray.length - 1].uid);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [solved, handleConfirm, tray, removePiece]);

  const progressRatio = Math.min(1.25, currentCents / currentQ.targetCents);
  const balanceState =
    currentCents === currentQ.targetCents
      ? '相等平衡'
      : currentCents < currentQ.targetCents
      ? '金額不足'
      : '超出目標';

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-4">
      {/* Task Prompt Header */}
      <div className="bg-white rounded-2xl border border-stone-200 px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <Scale className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <p className="text-base md:text-lg font-bold text-stone-900">{currentQ.prompt}</p>
            <p className="text-xs text-stone-500">
              點擊下方錢箱加入貨幣 · 點擊兌換盤內的貨幣可移除
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTotalHelper((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-xs font-semibold text-stone-700 cursor-pointer whitespace-nowrap"
          >
            {showTotalHelper ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showTotalHelper ? '隱藏小計' : '顯示小計'}</span>
          </button>
          <button
            type="button"
            onClick={handleHint}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 cursor-pointer whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>溫馨提示</span>
          </button>
        </div>
      </div>

      {/* Main Emerald Exchange Board */}
      <div className="hk-felt-mat rounded-2xl border-2 border-[#1B6B53] shadow-lg p-5 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch">
        {/* Left: Target Currency */}
        <div className="md:col-span-4 rounded-xl bg-black/20 border border-white/10 p-5 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold text-emerald-200/80 mb-3">目標兌換貨幣</span>
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2 }}
            className="my-2"
          >
            <HKMoneyVisual id={currentQ.targetId} size="lg" />
          </motion.div>
          <div className="mt-3 text-white font-display font-extrabold text-2xl font-mono-num">
            {formatHKD(currentQ.targetCents)}
          </div>
          <div className="text-xs text-emerald-100/80 mt-0.5">
            {CURRENCY_MAP[currentQ.targetId].chineseName}（{formatHKDChinese(currentQ.targetCents)}）
          </div>
        </div>

        {/* Right: Student's Exchange Tray */}
        <div
          className={`md:col-span-8 rounded-xl bg-black/15 border-2 border-dashed ${
            solved
              ? 'border-amber-300 bg-emerald-900/40'
              : currentCents > currentQ.targetCents
              ? 'border-rose-300/80'
              : 'border-emerald-300/40'
          } p-4 flex flex-col justify-between min-h-[225px] ${trayShake ? 'animate-gentle-shake' : ''}`}
        >
          <div className="flex items-center justify-between gap-2 text-xs text-emerald-100/90 mb-2">
            <span className="font-semibold">你的兌換盤（共 {tray.length} 件貨幣）</span>
            {showTotalHelper && (
              <span className="font-mono-num font-bold text-sm text-amber-200">
                目前總計：{formatHKD(currentCents)} · {balanceState}
              </span>
            )}
          </div>

          {/* Visual Balance Progress Bar */}
          {showTotalHelper && (
            <div className="w-full h-2.5 rounded-full bg-black/30 overflow-hidden mb-3">
              <div
                style={{ width: `${Math.min(100, progressRatio * 100)}%` }}
                className={`h-full transition-all duration-200 rounded-full ${
                  currentCents === currentQ.targetCents
                    ? 'bg-amber-400'
                    : currentCents > currentQ.targetCents
                    ? 'bg-rose-400'
                    : 'bg-emerald-400'
                }`}
              />
            </div>
          )}

          {/* Placed Coins & Notes */}
          <div className="flex-1 flex flex-wrap content-start items-center gap-2.5 py-2 min-h-[116px]">
            {tray.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-emerald-100/50 text-sm py-8">
                點擊下方收銀錢箱的港幣放入這裡
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
                    title={`點擊移除 ${CURRENCY_MAP[piece.currencyId].chineseName}`}
                    className="cursor-pointer transition-transform hover:-translate-y-1 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-lg"
                  >
                    <HKMoneyVisual id={piece.currencyId} size="sm" />
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>

          {/* Action Row inside Tray */}
          <div className="pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={clearTray}
              disabled={solved || tray.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>清空重選</span>
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={solved}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-[0.98] disabled:opacity-60 text-stone-950 text-base font-extrabold shadow-md transition-all cursor-pointer whitespace-nowrap"
            >
              <Check className="w-5 h-5 stroke-[2.6]" />
              <span>確認兌換</span>
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

      {/* Cash Drawer */}
      <div className="bg-[#ECE5D8] rounded-2xl border border-[#D8CEBC] p-4 shadow-inner">
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold text-stone-700">收銀錢箱（點選放入兌換盤）</span>
          {currentQ.requiredOnlyId && (
            <span className="text-xs font-bold text-amber-800">
              本題指定貨幣：{CURRENCY_MAP[currentQ.requiredOnlyId].chineseName}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-end justify-center gap-3 md:gap-4">
          {currentQ.allowedDrawerIds.map((cid) => {
            const item = CURRENCY_MAP[cid];
            const isHighlighted = currentQ.requiredOnlyId === cid;
            return (
              <button
                key={cid}
                type="button"
                disabled={solved}
                onClick={() => addMoney(cid)}
                className={`group flex flex-col items-center p-2.5 rounded-xl bg-white border-2 transition-all duration-150 hover:-translate-y-1 active:scale-95 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                  isHighlighted
                    ? 'border-amber-500 ring-2 ring-amber-300/60'
                    : 'border-stone-200 hover:border-emerald-600'
                }`}
              >
                <HKMoneyVisual id={cid} size="sm" />
                <span className="mt-1.5 text-xs font-extrabold text-stone-800 font-mono-num">
                  {item.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
