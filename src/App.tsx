import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Flame,
  Home,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { StageId, STAGES } from './data/gameContent';
import { RoundResultPayload, useStudentCloud } from './hooks/useStudentCloud';
import { soundEngine } from './lib/sound';
import { CelebrationEffects } from './components/CelebrationEffects';
import { CurrencyGuideModal } from './components/CurrencyGuideModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { RoundSummaryModal } from './components/RoundSummaryModal';
import { StudentAvatar } from './components/ShopItemArt';
import { StageCheckout } from './components/StageCheckout';
import { StageExchange } from './components/StageExchange';
import { StageRecognize } from './components/StageRecognize';
import { StudentManagerModal } from './components/StudentManagerModal';
import { TitleScreen } from './components/TitleScreen';

type GameState = 'TITLE_MENU' | 'PLAYING' | 'PAUSED' | 'ROUND_SUMMARY';

function SmartShopperGame() {
  const cloud = useStudentCloud();

  const [gameState, setGameState] = useState<GameState>('TITLE_MENU');
  const [activeStage, setActiveStage] = useState<StageId>('recognize');
  const [roundNonce, setRoundNonce] = useState(1);

  // Active play HUD readouts
  const [hudScore, setHudScore] = useState(0);
  const [hudStreak, setHudStreak] = useState(0);
  const [hudCurrentQ, setHudCurrentQ] = useState(1);
  const [hudTotalQ, setHudTotalQ] = useState(8);

  // Round completion summary
  const [lastResult, setLastResult] = useState<RoundResultPayload | null>(null);
  const [lastSavedToCloud, setLastSavedToCloud] = useState(false);

  // Modals & celebration
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentModalTab, setStudentModalTab] = useState<'students' | 'history' | 'leaderboard'>('students');
  const [guideOpen, setGuideOpen] = useState(false);
  const [muted, setMuted] = useState<boolean>(() => soundEngine.isMuted());
  const [burstKey, setBurstKey] = useState(0);
  const [burstIntensity, setBurstIntensity] = useState<'normal' | 'victory'>('normal');

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  const triggerCelebration = useCallback((intensity: 'normal' | 'victory' = 'normal') => {
    setBurstIntensity(intensity);
    setBurstKey((k) => k + 1);
  }, []);

  const startStage = useCallback((stage: StageId) => {
    setActiveStage(stage);
    setHudScore(0);
    setHudStreak(0);
    setHudCurrentQ(1);
    setLastResult(null);
    setRoundNonce((n) => n + 1);
    setGameState('PLAYING');
  }, []);

  const handleScoreChange = useCallback(
    (score: number, streak: number, current: number, total: number) => {
      setHudScore(score);
      setHudStreak(streak);
      setHudCurrentQ(current);
      setHudTotalQ(total);
    },
    []
  );

  const handleStageComplete = useCallback(
    async (result: RoundResultPayload) => {
      setLastResult(result);
      setGameState('ROUND_SUMMARY');
      soundEngine.playFanfare();
      triggerCelebration('victory');

      if (cloud.activeStudent) {
        const savedCloud = await cloud.recordGameSession(cloud.activeStudent, result);
        setLastSavedToCloud(savedCloud);
      } else {
        setLastSavedToCloud(false);
      }
    },
    [cloud, triggerCelebration]
  );

  // Esc key toggles Pause during active play
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (guideOpen) {
          setGuideOpen(false);
          return;
        }
        if (studentModalOpen) {
          setStudentModalOpen(false);
          return;
        }
        if (gameState === 'PLAYING') {
          setGameState('PAUSED');
        } else if (gameState === 'PAUSED') {
          setGameState('PLAYING');
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [gameState, guideOpen, studentModalOpen]);

  const currentStageMeta = STAGES.find((s) => s.id === activeStage) ?? STAGES[0];

  return (
    <>
      <CelebrationEffects burstKey={burstKey} intensity={burstIntensity} />

      {gameState === 'TITLE_MENU' ? (
        <TitleScreen
          user={cloud.user}
          authBusy={cloud.authBusy}
          localPendingCount={cloud.localPendingCount}
          students={cloud.students}
          activeStudent={cloud.activeStudent}
          muted={muted}
          onToggleMute={toggleMute}
          onQuickCreateStudent={cloud.createStudent}
          onStartStage={startStage}
          onOpenStudentManager={(tab = 'students') => {
            setStudentModalTab(tab);
            setStudentModalOpen(true);
          }}
          onOpenCurrencyGuide={() => setGuideOpen(true)}
          onSignIn={cloud.signInWithGoogle}
        />
      ) : (
        <div className="min-h-screen hk-counter-bg flex flex-col">
          {/* Compact Low-Occlusion Game HUD */}
          <header className="w-full max-w-5xl mx-auto px-4 pt-4 pb-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setGameState('PAUSED')}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-stone-200 hover:border-stone-400 text-xs font-bold text-stone-800 cursor-pointer shadow-xs whitespace-nowrap"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>暫停</span>
              </button>

              <div className="text-sm font-extrabold text-stone-900">
                {currentStageMeta.order}：{currentStageMeta.title}
                <span className="ml-2 text-xs font-mono-num font-bold text-stone-500">
                  第 {hudCurrentQ} / {hudTotalQ} 題
                </span>
              </div>
            </div>

            {/* Right Status Cluster — clean tabular numbers, zero pills */}
            <div className="flex items-center gap-4 text-xs sm:text-sm font-bold text-stone-800">
              {cloud.activeStudent && (
                <div className="hidden sm:flex items-center gap-2 text-stone-700">
                  <StudentAvatar avatarId={cloud.activeStudent.avatarId} size={28} />
                  <span className="max-w-[110px] truncate">{cloud.activeStudent.name}</span>
                </div>
              )}

              <div className="flex items-center gap-3 font-mono-num">
                <span className="text-emerald-800">得分 {hudScore}</span>
                {hudStreak >= 2 && (
                  <span className="inline-flex items-center gap-0.5 text-amber-700">
                    <Flame className="w-4 h-4 fill-amber-400 text-amber-600" />
                    連對 {hudStreak}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setGuideOpen(true)}
                  className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:border-emerald-600 flex items-center justify-center text-emerald-800 cursor-pointer shadow-xs"
                  title="查看香港貨幣圖鑑"
                  aria-label="查看香港貨幣圖鑑"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="w-9 h-9 rounded-xl bg-white border border-stone-200 hover:border-stone-400 flex items-center justify-center text-stone-700 cursor-pointer shadow-xs"
                  title={muted ? '開啟音效' : '靜音'}
                  aria-label={muted ? '開啟音效' : '靜音'}
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </header>

          {/* Thin Stage Progress Bar */}
          <div className="w-full max-w-5xl mx-auto px-4 pb-3">
            <div className="w-full h-1.5 rounded-full bg-stone-200 overflow-hidden">
              <div
                style={{ width: `${Math.round(((hudCurrentQ - 1) / Math.max(1, hudTotalQ)) * 100)}%` }}
                className="h-full bg-emerald-600 transition-all duration-300"
              />
            </div>
          </div>

          {/* Active Stage Playfield */}
          <main className="flex-1 w-full px-4 pb-6 flex items-start justify-center">
            {activeStage === 'recognize' && (
              <StageRecognize
                key={`rec_${roundNonce}`}
                onCelebrate={triggerCelebration}
                onScoreChange={handleScoreChange}
                onComplete={handleStageComplete}
              />
            )}
            {activeStage === 'exchange' && (
              <StageExchange
                key={`ex_${roundNonce}`}
                onCelebrate={triggerCelebration}
                onScoreChange={handleScoreChange}
                onComplete={handleStageComplete}
              />
            )}
            {activeStage === 'checkout' && (
              <StageCheckout
                key={`chk_${roundNonce}`}
                onCelebrate={triggerCelebration}
                onScoreChange={handleScoreChange}
                onComplete={handleStageComplete}
              />
            )}
          </main>
        </div>
      )}

      {/* Pause Overlay */}
      {gameState === 'PAUSED' && (
        <div
          className="fixed inset-0 z-40 bg-stone-950/60 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-label="遊戲暫停"
        >
          <div className="w-full max-w-sm bg-white rounded-3xl border border-stone-200 shadow-2xl p-6 text-center space-y-5">
            <div>
              <div className="text-xs font-bold text-emerald-700">
                {currentStageMeta.order} · {currentStageMeta.title}
              </div>
              <h2 className="text-xl font-extrabold text-stone-900 mt-1">遊戲已暫停</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => setGameState('PLAYING')}
                className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>繼續遊戲</span>
              </button>
              <button
                type="button"
                onClick={() => startStage(activeStage)}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重新開始本關</span>
              </button>
              <button
                type="button"
                onClick={() => setGameState('TITLE_MENU')}
                className="w-full py-2.5 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>返回主畫面</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Round Summary Modal */}
      {gameState === 'ROUND_SUMMARY' && lastResult && (
        <RoundSummaryModal
          result={lastResult}
          student={cloud.activeStudent}
          savedToCloud={lastSavedToCloud}
          onReplay={() => startStage(activeStage)}
          onNextStage={(nextStage) => startStage(nextStage)}
          onHome={() => setGameState('TITLE_MENU')}
        />
      )}

      {/* Interactive Currency Guide Modal */}
      <CurrencyGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />

      {/* Multi-User Student Manager & Cloud Storage Modal */}
      <StudentManagerModal
        open={studentModalOpen}
        initialTab={studentModalTab}
        onClose={() => setStudentModalOpen(false)}
        user={cloud.user}
        authBusy={cloud.authBusy}
        cloudLoading={cloud.cloudLoading}
        authNotice={cloud.authNotice}
        syncError={cloud.syncError}
        localPendingCount={cloud.localPendingCount}
        students={cloud.students}
        sessions={cloud.sessions}
        activeStudent={cloud.activeStudent}
        onSelectStudent={(id) => cloud.setActiveStudentId(id)}
        onCreateStudent={cloud.createStudent}
        onUpdateStudent={cloud.updateStudentProfile}
        onDeleteStudent={cloud.deleteStudent}
        onSignIn={cloud.signInWithGoogle}
        onLogout={cloud.logout}
        onMigrateLocal={cloud.migrateLocalToCloud}
        onExportCsv={cloud.exportCsvReport}
      />
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SmartShopperGame />
    </ErrorBoundary>
  );
}
