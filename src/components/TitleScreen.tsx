import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Cloud,
  CloudOff,
  Play,
  Star,
  Trophy,
  UserPlus,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AvatarId, StageId, STAGES } from '../data/gameContent';
import { CurrencyId } from '../data/hkCurrency';
import { StudentRecord } from '../hooks/useStudentCloud';
import { HKMoneyVisual } from './HKMoneyVisual';
import { StudentAvatar } from './ShopItemArt';
import { soundEngine } from '../lib/sound';

interface TitleScreenProps {
  user: User | null;
  authBusy: boolean;
  localPendingCount: number;
  students: StudentRecord[];
  activeStudent: StudentRecord | null;
  muted: boolean;
  onToggleMute: () => void;
  onQuickCreateStudent: (name: string, className: string, avatarId: AvatarId) => Promise<StudentRecord | null>;
  onStartStage: (stage: StageId) => void;
  onOpenStudentManager: (tab?: 'students' | 'history' | 'leaderboard') => void;
  onOpenCurrencyGuide: () => void;
  onSignIn: () => Promise<void>;
}

const SHOWCASE_COINS: CurrencyId[] = ['10d', '5d', '2d', '1d', '50c', '20c', '10c'];
const SHOWCASE_NOTES: CurrencyId[] = ['20d', '50d', '100d', '500d'];

export const TitleScreen: React.FC<TitleScreenProps> = ({
  user,
  authBusy,
  localPendingCount,
  students,
  activeStudent,
  muted,
  onToggleMute,
  onQuickCreateStudent,
  onStartStage,
  onOpenStudentManager,
  onOpenCurrencyGuide,
  onSignIn,
}) => {
  const [quickName, setQuickName] = useState('');
  const [quickClass, setQuickClass] = useState('');
  const [creating, setCreating] = useState(false);
  const [nameAlert, setNameAlert] = useState(false);

  const handleQuickRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim() || creating) return;
    setCreating(true);
    try {
      await onQuickCreateStudent(quickName, quickClass, 'cat');
      setQuickName('');
      setQuickClass('');
      setNameAlert(false);
    } finally {
      setCreating(false);
    }
  };

  const handleLaunchStage = (stage: StageId) => {
    if (!activeStudent) {
      if (quickName.trim()) {
        onQuickCreateStudent(quickName, quickClass, 'cat').then((created) => {
          if (created) {
            setQuickName('');
            setQuickClass('');
            onStartStage(stage);
          }
        });
      } else {
        soundEngine.playGentleRetry();
        setNameAlert(true);
      }
      return;
    }
    onStartStage(stage);
  };

  const getStageStars = (stageId: StageId): number => {
    if (!activeStudent) return 0;
    if (stageId === 'recognize') return activeStudent.starsStage1;
    if (stageId === 'exchange') return activeStudent.starsStage2;
    return activeStudent.starsStage3;
  };

  const getStageBest = (stageId: StageId): number => {
    if (!activeStudent) return 0;
    if (stageId === 'recognize') return activeStudent.bestStage1;
    if (stageId === 'exchange') return activeStudent.bestStage2;
    return activeStudent.bestStage3;
  };

  return (
    <div className="min-h-screen hk-counter-bg flex flex-col justify-between px-4 sm:px-6 lg:px-8 py-5">
      {/* Slim Game Shell Utility Perimeter */}
      <div className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-stone-600">
          {user ? (
            <button
              type="button"
              onClick={() => onOpenStudentManager('students')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-emerald-200 text-emerald-900 hover:bg-emerald-50 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <Cloud className="w-4 h-4 text-emerald-700" />
              <span>雲端已連線 · {user.displayName || user.email}</span>
              {localPendingCount > 0 && (
                <span className="text-amber-700 font-bold">（有待同步資料）</span>
              )}
            </button>
          ) : (
            <button
              type="button"
              disabled={authBusy}
              onClick={onSignIn}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 text-stone-800 hover:border-emerald-600 hover:text-emerald-900 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
            >
              <CloudOff className="w-4 h-4 text-amber-600" />
              <span>{authBusy ? '連接雲端中...' : '登入 Google 雲端儲存'}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCurrencyGuide}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 text-xs font-bold text-stone-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>香港貨幣圖鑑</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenStudentManager('leaderboard')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-stone-200 hover:border-amber-500 text-xs font-bold text-stone-800 transition-colors cursor-pointer whitespace-nowrap shadow-xs"
          >
            <Trophy className="w-4 h-4 text-amber-600" />
            <span>紀錄與龍虎榜</span>
          </button>

          <button
            type="button"
            onClick={onToggleMute}
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:border-stone-400 flex items-center justify-center text-stone-700 transition-colors cursor-pointer shadow-xs"
            aria-label={muted ? '開啟音效' : '靜音'}
            title={muted ? '開啟音效' : '靜音'}
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Title Arena */}
      <main className="w-full max-w-6xl mx-auto my-auto py-5 space-y-6">
        {/* Hero Tabletop Showcase + Bespoke SVG Title Lockup */}
        <section className="hk-felt-mat rounded-3xl border-2 border-[#1B6B53] shadow-xl p-6 md:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center overflow-hidden">
          <div className="lg:col-span-6 space-y-4">
            {/* Bespoke Inline SVG Title Lockup */}
            <svg
              viewBox="0 0 430 92"
              className="w-full max-w-[390px] h-auto"
              role="img"
              aria-label="精明小買家 1.0"
            >
              <rect
                x="2"
                y="4"
                width="426"
                height="84"
                rx="16"
                fill="#093829"
                stroke="#F59E0B"
                strokeWidth="2.5"
              />
              <rect
                x="8"
                y="10"
                width="414"
                height="72"
                rx="11"
                fill="none"
                stroke="#FDE68A"
                strokeOpacity="0.35"
                strokeWidth="1"
              />
              {/* Emblem coin mark */}
              <circle cx="48" cy="46" r="24" fill="#F59E0B" />
              <circle cx="48" cy="46" r="18" fill="#FEF3C7" stroke="#B45309" strokeWidth="1.5" />
              <text
                x="48"
                y="54"
                textAnchor="middle"
                fill="#92400E"
                fontSize="24"
                fontWeight="900"
                fontFamily="Outfit, sans-serif"
              >
                $
              </text>
              <text
                x="88"
                y="56"
                fill="#FFFDF7"
                fontSize="36"
                fontWeight="900"
                letterSpacing="3"
                fontFamily="'Noto Sans TC', sans-serif"
              >
                精明小買家
              </text>
              <text
                x="355"
                y="56"
                fill="#FBBF24"
                fontSize="28"
                fontWeight="800"
                fontFamily="Outfit, sans-serif"
              >
                1.0
              </text>
            </svg>

            <p className="text-emerald-50/90 text-sm md:text-base leading-relaxed max-w-lg">
              以真實香港硬幣與紙幣圖案打造互動小店收銀台，透過「認識幣值」、「等值置換」與「剛好付清」三大關卡，輕鬆練就日常理財小達人！
            </p>

            {/* Active Student Identity Strip */}
            <div className="pt-1">
              {activeStudent ? (
                <div className="bg-white/95 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-3 min-w-0">
                    <StudentAvatar avatarId={activeStudent.avatarId} size={46} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-stone-900 truncate">
                          {activeStudent.name}
                        </span>
                        {activeStudent.className && (
                          <span className="text-xs font-semibold text-stone-500">
                            · {activeStudent.className}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-stone-600 mt-0.5 flex items-center gap-2 font-mono-num">
                        <span className="inline-flex items-center gap-1 font-bold text-amber-700">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {activeStudent.totalStars} 顆星
                        </span>
                        <span>·</span>
                        <span>總分 {activeStudent.totalScore}</span>
                        <span>·</span>
                        <span>共 {students.length} 位學生</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenStudentManager('students')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition-colors cursor-pointer whitespace-nowrap"
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>切換 / 管理學生</span>
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleQuickRegister}
                  className={`bg-white/95 rounded-2xl p-4 space-y-2.5 shadow-md border-2 transition-colors ${
                    nameAlert ? 'border-amber-400 animate-gentle-shake' : 'border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-emerald-950">
                      請先輸入學生姓名，自動記錄你的闖關成績
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenStudentManager('students')}
                      className="text-xs font-bold text-emerald-700 hover:underline cursor-pointer"
                    >
                      更多頭像設定
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      maxLength={30}
                      value={quickName}
                      onChange={(e) => {
                        setQuickName(e.target.value);
                        setNameAlert(false);
                      }}
                      placeholder="輸入學生姓名（例如：陳小明）"
                      className="flex-1 px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none text-sm font-semibold text-stone-900"
                    />
                    <input
                      type="text"
                      maxLength={20}
                      value={quickClass}
                      onChange={(e) => setQuickClass(e.target.value)}
                      placeholder="班別（選填）"
                      className="sm:w-28 px-3 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none text-sm font-medium text-stone-900"
                    />
                    <button
                      type="submit"
                      disabled={creating || !quickName.trim()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-stone-950 text-sm font-extrabold cursor-pointer whitespace-nowrap transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>登記開始</span>
                    </button>
                  </div>
                  {nameAlert && (
                    <p className="text-xs font-bold text-rose-600">
                      請先填寫學生姓名再選擇關卡喔！
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Right: Interactive Live HK Currency Display Table */}
          <div className="lg:col-span-6 rounded-2xl bg-black/20 border border-white/10 p-5 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              {SHOWCASE_NOTES.map((nid, idx) => (
                <motion.button
                  key={nid}
                  type="button"
                  whileHover={{ y: -4, scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.25 }}
                  onClick={() => soundEngine.playNoteRustle()}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-md"
                  title="點擊聽紙幣音效"
                >
                  <HKMoneyVisual id={nid} size="sm" />
                </motion.button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {SHOWCASE_COINS.map((cid, idx) => (
                <motion.button
                  key={cid}
                  type="button"
                  whileHover={{ y: -5, rotate: 8, scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.12 + idx * 0.04, duration: 0.22 }}
                  onClick={() => soundEngine.playCoinClink(cid.endsWith('c') ? 50 : 500)}
                  className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 rounded-full"
                  title="點擊聽硬幣音效"
                >
                  <HKMoneyVisual id={cid} size="sm" />
                </motion.button>
              ))}
            </div>
            <p className="text-xs text-emerald-100/70">點擊上方香港硬幣與紙幣可試聽真實音效</p>
          </div>
        </section>

        {/* Three Core Game Stages */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGES.map((stage) => {
            const earnedStars = getStageStars(stage.id);
            const bestScore = getStageBest(stage.id);

            return (
              <div
                key={stage.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col justify-between shadow-sm hover:border-emerald-600/70 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-2">
                    <span className="font-bold" style={{ color: stage.accentColor }}>
                      {stage.order} · {stage.badgeText}
                    </span>
                    <span className="inline-flex items-center gap-0.5" aria-label={`已獲 ${earnedStars} 顆星`}>
                      {[1, 2, 3].map((n) => (
                        <Star
                          key={n}
                          className={`w-4 h-4 ${
                            n <= earnedStars
                              ? 'fill-amber-400 text-amber-500'
                              : 'text-stone-200'
                          }`}
                        />
                      ))}
                    </span>
                  </div>

                  <h2 className="text-xl font-extrabold text-stone-900">{stage.title}</h2>
                  <p className="text-xs font-bold text-stone-500 mt-0.5">{stage.subtitle}</p>
                  <p className="text-sm text-stone-600 mt-2.5 leading-relaxed">{stage.shortDesc}</p>
                </div>

                <div className="mt-5 pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-stone-500 font-mono-num">
                    {bestScore > 0 ? `最高分 ${bestScore}` : '尚未挑戰'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleLaunchStage(stage.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98] text-white text-sm font-bold transition-all cursor-pointer whitespace-nowrap shadow-xs"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>開始挑戰</span>
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      </main>

      {/* Single Flat Control-Hint Footer */}
      <footer className="w-full max-w-6xl mx-auto text-center text-xs text-stone-500 pt-2">
        點擊貨幣作答 · 鍵盤 1–4 選擇 / Enter 確認 / Backspace 退回 · Esc 暫停
      </footer>
    </div>
  );
};
