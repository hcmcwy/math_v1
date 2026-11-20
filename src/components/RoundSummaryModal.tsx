import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Cloud, Home, RotateCcw, Star } from 'lucide-react';
import { StageId, STAGES } from '../data/gameContent';
import { RoundResultPayload, StudentRecord } from '../hooks/useStudentCloud';
import { StudentAvatar } from './ShopItemArt';

interface RoundSummaryModalProps {
  result: RoundResultPayload;
  student: StudentRecord | null;
  savedToCloud: boolean;
  onReplay: () => void;
  onNextStage: (nextStage: StageId) => void;
  onHome: () => void;
}

export const RoundSummaryModal: React.FC<RoundSummaryModalProps> = ({
  result,
  student,
  savedToCloud,
  onReplay,
  onNextStage,
  onHome,
}) => {
  const stageIdx = STAGES.findIndex((s) => s.id === result.stage);
  const currentMeta = STAGES[stageIdx] ?? STAGES[0];
  const nextMeta = stageIdx >= 0 && stageIdx + 1 < STAGES.length ? STAGES[stageIdx + 1] : null;

  const headline =
    result.stars === 3
      ? '滿星通關！太出色了！'
      : result.stars === 2
      ? '表現超棒！精明小買家！'
      : '完成挑戰！再接再厲！';

  return (
    <div
      className="fixed inset-0 z-40 bg-stone-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="關卡完成結算"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-white rounded-3xl border border-stone-200 shadow-2xl overflow-hidden text-center"
      >
        {/* Top Emerald Banner */}
        <div className="hk-felt-mat px-6 pt-7 pb-6 text-white space-y-3">
          <div className="text-xs font-bold text-emerald-200">
            {currentMeta.order} · {currentMeta.title}
          </div>
          <h2 className="text-2xl font-extrabold">{headline}</h2>

          {/* Animated 3-Star Showcase */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {[1, 2, 3].map((n) => {
              const earned = n <= result.stars;
              return (
                <motion.div
                  key={n}
                  initial={{ scale: 0.3, rotate: -25, opacity: 0 }}
                  animate={{ scale: earned ? 1.1 : 0.92, rotate: 0, opacity: 1 }}
                  transition={{ delay: 0.12 * n, type: 'spring', stiffness: 280, damping: 16 }}
                >
                  <Star
                    className={`w-12 h-12 ${
                      earned
                        ? 'fill-amber-400 text-amber-300 drop-shadow-[0_3px_10px_rgba(251,191,36,0.55)]'
                        : 'text-emerald-900/60 fill-emerald-950/40'
                    }`}
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="p-6 space-y-5">
          {student && (
            <div className="flex items-center justify-center gap-2.5 text-sm font-bold text-stone-800">
              <StudentAvatar avatarId={student.avatarId} size={32} />
              <span>{student.name}</span>
              <span className="text-stone-300">·</span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                <Cloud className="w-3.5 h-3.5" />
                {savedToCloud ? '已即時儲存至雲端' : '已儲存至本機紀錄'}
              </span>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2.5 bg-[#FAF7F2] rounded-2xl border border-stone-200 p-4">
            <div>
              <div className="text-xs text-stone-500">本局得分</div>
              <div className="text-xl font-display font-extrabold text-emerald-800 font-mono-num mt-0.5">
                {result.score}
              </div>
            </div>
            <div className="border-x border-stone-200">
              <div className="text-xs text-stone-500">首次答對率</div>
              <div className="text-xl font-display font-extrabold text-amber-700 font-mono-num mt-0.5">
                {result.accuracy}%
              </div>
            </div>
            <div>
              <div className="text-xs text-stone-500">完成用時</div>
              <div className="text-xl font-display font-extrabold text-stone-800 font-mono-num mt-0.5">
                {result.durationSeconds}秒
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {nextMeta && (
              <button
                type="button"
                onClick={() => onNextStage(nextMeta.id)}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
              >
                <span>挑戰下一關：{nextMeta.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onReplay}
                className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>再玩一次</span>
              </button>
              <button
                type="button"
                onClick={onHome}
                className="py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Home className="w-4 h-4" />
                <span>返回主頁</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
