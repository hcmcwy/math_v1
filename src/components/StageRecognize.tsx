import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Lightbulb, Sparkles, XCircle } from 'lucide-react';
import { CURRENCY_MAP, CurrencyId } from '../data/hkCurrency';
import {
  generateRecognizeQuestions,
  pickPraise,
  RecognizeQuestion,
} from '../data/gameContent';
import { HKMoneyVisual } from './HKMoneyVisual';
import { soundEngine } from '../lib/sound';
import { RoundResultPayload } from '../hooks/useStudentCloud';

interface StageRecognizeProps {
  onCelebrate: (intensity?: 'normal' | 'victory') => void;
  onScoreChange: (score: number, streak: number, current: number, total: number) => void;
  onComplete: (result: RoundResultPayload) => void;
}

export const StageRecognize: React.FC<StageRecognizeProps> = ({
  onCelebrate,
  onScoreChange,
  onComplete,
}) => {
  const [questions] = useState<RecognizeQuestion[]>(() => generateRecognizeQuestions());
  const [index, setIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [wrongIds, setWrongIds] = useState<CurrencyId[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'retry'; text: string } | null>(null);
  const [shakeId, setShakeId] = useState<CurrencyId | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<number | null>(null);

  const currentQ = questions[index];
  const targetItem = CURRENCY_MAP[currentQ.targetId];

  useEffect(() => {
    onScoreChange(score, streak, index + 1, questions.length);
  }, [score, streak, index, questions.length, onScoreChange]);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    (chosenId: CurrencyId) => {
      if (solved || wrongIds.includes(chosenId)) return;

      if (chosenId === currentQ.targetId) {
        const isFirstTry = wrongIds.length === 0;
        const nextStreak = isFirstTry ? streak + 1 : 0;
        const gained = isFirstTry ? 100 + Math.min(nextStreak - 1, 4) * 15 : 60;
        const nextScore = score + gained;
        const nextFirstTry = firstTryCorrect + (isFirstTry ? 1 : 0);

        setSolved(true);
        setScore(nextScore);
        setStreak(nextStreak);
        setFirstTryCorrect(nextFirstTry);
        setFeedback({
          type: 'success',
          text: `${pickPraise(index)} 這是「${targetItem.chineseName}」（${targetItem.spokenName}）！`,
        });

        soundEngine.playSuccessChime(Math.max(1, nextStreak));
        onCelebrate('normal');

        timerRef.current = window.setTimeout(() => {
          if (index + 1 >= questions.length) {
            const accuracy = Math.round((nextFirstTry / questions.length) * 100);
            const stars = accuracy >= 88 ? 3 : accuracy >= 60 ? 2 : 1;
            const durationSeconds = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000));
            onComplete({
              stage: 'recognize',
              score: nextScore,
              stars,
              correctCount: nextFirstTry,
              totalQuestions: questions.length,
              accuracy,
              durationSeconds,
            });
          } else {
            setIndex((i) => i + 1);
            setWrongIds([]);
            setShowHint(false);
            setSolved(false);
            setFeedback(null);
          }
        }, 1250);
      } else {
        soundEngine.playGentleRetry();
        setStreak(0);
        setWrongIds((prev) => [...prev, chosenId]);
        setShakeId(chosenId);
        setShowHint(true);
        const chosenItem = CURRENCY_MAP[chosenId];
        setFeedback({
          type: 'retry',
          text: `再細心觀察一下喔！這不是 ${chosenItem.shortLabel}，提示：${targetItem.colorHint}。`,
        });
        window.setTimeout(() => setShakeId(null), 380);
      }
    },
    [solved, wrongIds, currentQ.targetId, streak, score, firstTryCorrect, index, targetItem, questions.length, onCelebrate, onComplete]
  );

  // Keyboard shortcuts 1-4 for fast accessibility
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (solved) return;
      const num = Number(e.key);
      if (num >= 1 && num <= 4 && currentQ.options[num - 1]) {
        handleSelect(currentQ.options[num - 1]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [solved, currentQ.options, handleSelect]);

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5">
      {/* Emerald Display Mat */}
      <div className="hk-felt-mat relative rounded-2xl border-2 border-[#1B6B53] shadow-lg p-6 md:p-8 flex flex-col items-center justify-center min-h-[290px] md:min-h-[320px] overflow-hidden">
        <div className="w-full flex items-center justify-between text-emerald-100/80 text-xs font-medium mb-3">
          <span>請仔細辨認下方港幣的面額</span>
          <button
            type="button"
            onClick={() => setShowHint((h) => !h)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{showHint ? '隱藏特徵提示' : '觀察提示'}</span>
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={`${index}-${currentQ.targetId}`}
            initial={{ opacity: 0, scale: 0.84, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="my-3 flex flex-col items-center"
          >
            <div
              onClick={() =>
                targetItem.kind === 'coin'
                  ? soundEngine.playCoinClink(targetItem.cents)
                  : soundEngine.playNoteRustle()
              }
              title="點擊聆聽貨幣音效"
              className="cursor-pointer transition-transform duration-150 hover:scale-105 active:scale-95"
            >
              <HKMoneyVisual id={currentQ.targetId} size="xl" />
            </div>
            <p className="mt-3 text-xs text-emerald-100/75">
              {targetItem.kind === 'coin' ? '香港流通硬幣 · 點擊聽硬幣聲' : '香港流通紙幣 · 點擊聽紙幣聲'}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Optional Clue Bar */}
        {showHint && !solved && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 px-4 py-2 rounded-xl bg-amber-950/55 border border-amber-400/35 text-amber-100 text-sm text-center max-w-xl"
          >
            特徵提示：{targetItem.colorHint}
          </motion.div>
        )}

        {/* Instant Feedback Toast */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className={`mt-4 px-4 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold shadow-md ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border border-emerald-300'
                  : 'bg-amber-50 text-amber-950 border border-amber-300'
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
      </div>

      {/* 4 Tactile Answer Options */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {currentQ.options.map((optId, idx) => {
          const opt = CURRENCY_MAP[optId];
          const isWrong = wrongIds.includes(optId);
          const isCorrect = solved && optId === currentQ.targetId;
          const isShaking = shakeId === optId;

          let cardClass =
            'bg-white border-stone-200 hover:border-emerald-600 hover:bg-emerald-50/40 text-stone-900 shadow-sm';
          if (isCorrect) {
            cardClass = 'bg-emerald-600 border-emerald-700 text-white shadow-md scale-[1.02]';
          } else if (isWrong) {
            cardClass = 'bg-stone-100 border-stone-200 text-stone-400 opacity-65 cursor-not-allowed';
          }

          return (
            <button
              key={optId}
              type="button"
              disabled={solved || isWrong}
              onClick={() => handleSelect(optId)}
              className={`relative min-h-[84px] rounded-2xl border-2 px-4 py-3.5 flex flex-col items-center justify-center transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${cardClass} ${
                isShaking ? 'animate-gentle-shake' : ''
              }`}
            >
              <span
                className={`absolute top-2 left-2.5 text-xs font-mono-num font-bold ${
                  isCorrect ? 'text-emerald-100' : 'text-stone-400'
                }`}
              >
                {idx + 1}
              </span>

              {isCorrect && (
                <CheckCircle2 className="w-5 h-5 text-amber-300 absolute top-2 right-2.5" />
              )}
              {isWrong && (
                <XCircle className="w-4 h-4 text-rose-400 absolute top-2 right-2.5" />
              )}

              <span className="text-xl md:text-2xl font-display font-extrabold tracking-tight font-mono-num">
                {opt.shortLabel}
              </span>
              <span
                className={`text-xs font-medium mt-0.5 ${
                  isCorrect ? 'text-emerald-100' : 'text-stone-500'
                }`}
              >
                {opt.chineseName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
