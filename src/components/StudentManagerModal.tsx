import React, { useEffect, useMemo, useState } from 'react';
import {
  Cloud,
  CloudOff,
  Download,
  Edit3,
  History,
  LogIn,
  LogOut,
  Plus,
  Star,
  Trash2,
  Trophy,
  UploadCloud,
  Users,
  X,
} from 'lucide-react';
import { User } from 'firebase/auth';
import { AVATAR_OPTIONS, AvatarId, StageId } from '../data/gameContent';
import { GameSessionRecord, StudentRecord } from '../hooks/useStudentCloud';
import { StudentAvatar } from './ShopItemArt';

interface StudentManagerModalProps {
  open: boolean;
  initialTab?: 'students' | 'history' | 'leaderboard';
  onClose: () => void;
  user: User | null;
  authBusy: boolean;
  cloudLoading: boolean;
  authNotice: string | null;
  syncError: string | null;
  localPendingCount: number;
  students: StudentRecord[];
  sessions: GameSessionRecord[];
  activeStudent: StudentRecord | null;
  onSelectStudent: (id: string) => void;
  onCreateStudent: (name: string, className: string, avatarId: AvatarId) => Promise<StudentRecord | null>;
  onUpdateStudent: (id: string, name: string, className: string, avatarId: AvatarId) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  onSignIn: () => Promise<void>;
  onLogout: () => Promise<void>;
  onMigrateLocal: () => Promise<void>;
  onExportCsv: () => void;
}

const STAGE_LABEL: Record<StageId, string> = {
  recognize: '第一關：認識幣值',
  exchange: '第二關：等值置換',
  checkout: '第三關：剛好付清',
};

export const StudentManagerModal: React.FC<StudentManagerModalProps> = ({
  open,
  initialTab = 'students',
  onClose,
  user,
  authBusy,
  cloudLoading,
  authNotice,
  syncError,
  localPendingCount,
  students,
  sessions,
  activeStudent,
  onSelectStudent,
  onCreateStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSignIn,
  onLogout,
  onMigrateLocal,
  onExportCsv,
}) => {
  const [tab, setTab] = useState<'students' | 'history' | 'leaderboard'>(initialTab);
  const [nameInput, setNameInput] = useState('');
  const [classInput, setClassInput] = useState('');
  const [avatarInput, setAvatarInput] = useState<AvatarId>('cat');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTab(initialTab);
    }
  }, [open, initialTab]);

  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [filterStage, setFilterStage] = useState<string>('all');

  const filteredSessions = useMemo(() => {
    return sessions.filter((s) => {
      if (filterStudentId !== 'all' && s.studentId !== filterStudentId) return false;
      if (filterStage !== 'all' && s.stage !== filterStage) return false;
      return true;
    });
  }, [sessions, filterStudentId, filterStage]);

  const rankedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (b.totalStars !== a.totalStars) return b.totalStars - a.totalStars;
      return b.totalScore - a.totalScore;
    });
  }, [students]);

  if (!open) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    try {
      if (editingId) {
        await onUpdateStudent(editingId, trimmed, classInput, avatarInput);
        setEditingId(null);
      } else {
        await onCreateStudent(trimmed, classInput, avatarInput);
      }
      setNameInput('');
      setClassInput('');
      setAvatarInput('cat');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (stu: StudentRecord) => {
    setEditingId(stu.id);
    setNameInput(stu.name);
    setClassInput(stu.className);
    setAvatarInput(stu.avatarId);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-950/60 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="學生管理與雲端紀錄"
    >
      <div className="bg-[#FAF7F2] w-full max-w-4xl max-h-[90vh] rounded-2xl border border-stone-200 shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 bg-white border-b border-stone-200 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-extrabold text-stone-900">多用戶學生管理與雲端儲存</h2>
            <p className="text-xs text-stone-500">
              支援建立多名學生檔案、即時雲端同步成績及匯出學習報表
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-500 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
            aria-label="關閉視窗"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud Account Banner */}
        <div className="px-6 py-3 bg-[#EFECE4] border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-sm">
            {user ? (
              <>
                <Cloud className="w-4 h-4 text-emerald-700 shrink-0" />
                <span className="font-bold text-emerald-950">雲端同步已啟用</span>
                <span className="text-stone-400">·</span>
                <span className="text-xs text-stone-700 truncate max-w-[240px]">
                  {user.displayName || user.email}
                </span>
              </>
            ) : (
              <>
                <CloudOff className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold text-stone-800">本機暫存模式</span>
                <span className="text-stone-400">·</span>
                <span className="text-xs text-stone-600">登入 Google 帳號即可跨裝置雲端儲存所有學生進度</span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            {user && localPendingCount > 0 && (
              <button
                type="button"
                disabled={authBusy}
                onClick={onMigrateLocal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>匯入本機 {localPendingCount} 位學生至雲端</span>
              </button>
            )}
            {user ? (
              <button
                type="button"
                disabled={authBusy}
                onClick={onLogout}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 cursor-pointer whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>登出雲端</span>
              </button>
            ) : (
              <button
                type="button"
                disabled={authBusy}
                onClick={onSignIn}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{authBusy ? '登入中...' : '登入 Google 開啟雲端儲存'}</span>
              </button>
            )}
          </div>
        </div>

        {(authNotice || syncError) && (
          <div
            className={`px-6 py-2 text-xs font-semibold ${
              syncError ? 'bg-rose-50 text-rose-800' : 'bg-emerald-50 text-emerald-900'
            }`}
          >
            {syncError || authNotice}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-6 pt-4 flex items-center justify-between gap-3 flex-wrap">
          <div className="inline-flex p-1 bg-stone-200/75 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setTab('students')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'students' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>學生管理 ({students.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('history')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'history' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>學習紀錄 ({sessions.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('leaderboard')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer whitespace-nowrap ${
                tab === 'leaderboard' ? 'bg-white text-emerald-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>小買家龍虎榜</span>
            </button>
          </div>

          {sessions.length > 0 && (
            <button
              type="button"
              onClick={onExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-300 bg-white hover:bg-stone-50 text-xs font-bold text-stone-700 cursor-pointer whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>匯出 CSV 報表</span>
            </button>
          )}
        </div>

        {/* Main Tab Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {tab === 'students' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left: Create / Edit Student Form */}
              <form
                onSubmit={handleSubmitForm}
                className="lg:col-span-5 bg-white rounded-2xl border border-stone-200 p-5 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-stone-900">
                    {editingId ? '編輯學生資料' : '新增學生檔案'}
                  </h3>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setNameInput('');
                        setClassInput('');
                      }}
                      className="text-xs font-semibold text-stone-500 hover:text-stone-800 cursor-pointer"
                    >
                      取消編輯
                    </button>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="stu-name">
                    學生姓名（必填）
                  </label>
                  <input
                    id="stu-name"
                    type="text"
                    required
                    maxLength={30}
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="例如：陳小明、林樂兒"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1" htmlFor="stu-class">
                    班別 / 組別（選填）
                  </label>
                  <input
                    id="stu-class"
                    type="text"
                    maxLength={20}
                    value={classInput}
                    onChange={(e) => setClassInput(e.target.value)}
                    placeholder="例如：小一甲、P2B"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-stone-50 focus:bg-white focus:border-emerald-600 focus:outline-none text-sm font-medium"
                  />
                </div>

                <div>
                  <span className="block text-xs font-bold text-stone-700 mb-2">選擇小買家頭像</span>
                  <div className="grid grid-cols-4 gap-2">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => setAvatarInput(av.id)}
                        className={`p-1.5 rounded-xl border-2 flex flex-col items-center gap-1 transition-all cursor-pointer ${
                          avatarInput === av.id
                            ? 'border-emerald-600 bg-emerald-50/50'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <StudentAvatar avatarId={av.id} size={36} />
                        <span className="text-[11px] font-semibold text-stone-700">{av.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting || !nameInput.trim()}
                  className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-sm font-bold inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>{editingId ? '儲存變更' : '建立並切換為此學生'}</span>
                </button>
              </form>

              {/* Right: Student Roster */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>點選任一位學生即可切換目前遊玩者</span>
                  {cloudLoading && <span>雲端讀取中...</span>}
                </div>

                {students.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                    尚未建立學生檔案，請在左側輸入學生姓名開始記錄成績！
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {students.map((stu) => {
                      const isActive = activeStudent?.id === stu.id;
                      return (
                        <div
                          key={stu.id}
                          className={`rounded-2xl border-2 p-3.5 bg-white flex items-center justify-between gap-3 transition-colors ${
                            isActive ? 'border-emerald-600 bg-emerald-50/25' : 'border-stone-200'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSelectStudent(stu.id)}
                            className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                          >
                            <StudentAvatar avatarId={stu.avatarId} size={46} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-stone-900 truncate">
                                  {stu.name}
                                </span>
                                {stu.className && (
                                  <span className="text-xs text-stone-500 whitespace-nowrap">
                                    · {stu.className}
                                  </span>
                                )}
                                {isActive && (
                                  <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                                    · 目前使用中
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-stone-500 mt-1 flex items-center gap-2.5 font-mono-num">
                                <span className="inline-flex items-center gap-1 text-amber-700 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                  {stu.totalStars} 顆星
                                </span>
                                <span>·</span>
                                <span>總分 {stu.totalScore}</span>
                                <span>·</span>
                                <span>{stu.gamesPlayed} 局</span>
                              </div>
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => startEdit(stu)}
                              className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900 cursor-pointer"
                              title="編輯學生"
                              aria-label={`編輯 ${stu.name}`}
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            {confirmDeleteId === stu.id ? (
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={async () => {
                                    await onDeleteStudent(stu.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold cursor-pointer"
                                >
                                  確定刪除
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 rounded-lg bg-stone-100 text-stone-600 text-xs font-semibold cursor-pointer"
                                >
                                  取消
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(stu.id)}
                                className="p-2 rounded-lg text-stone-400 hover:bg-rose-50 hover:text-rose-600 cursor-pointer"
                                title="刪除學生"
                                aria-label={`刪除 ${stu.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={filterStudentId}
                  onChange={(e) => setFilterStudentId(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
                  aria-label="按學生篩選"
                >
                  <option value="all">全部學生</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.className ? ` (${s.className})` : ''}
                    </option>
                  ))}
                </select>

                <select
                  value={filterStage}
                  onChange={(e) => setFilterStage(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800"
                  aria-label="按關卡篩選"
                >
                  <option value="all">全部關卡</option>
                  <option value="recognize">第一關：認識幣值</option>
                  <option value="exchange">第二關：等值置換</option>
                  <option value="checkout">第三關：剛好付清</option>
                </select>
              </div>

              {filteredSessions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                  暫時沒有符合條件的挑戰紀錄。完成任一關卡後會自動儲存到這裡！
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs text-stone-500 bg-stone-50/70">
                        <th className="py-3 px-4 font-bold">學生姓名</th>
                        <th className="py-3 px-4 font-bold">關卡</th>
                        <th className="py-3 px-4 font-bold text-right">分數</th>
                        <th className="py-3 px-4 font-bold text-center">星級</th>
                        <th className="py-3 px-4 font-bold text-right">首次準確率</th>
                        <th className="py-3 px-4 font-bold text-right">用時</th>
                        <th className="py-3 px-4 font-bold text-right">完成時間</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {filteredSessions.map((sess) => (
                        <tr key={sess.id} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4 font-bold text-stone-900">{sess.studentName}</td>
                          <td className="py-3 px-4 text-stone-700">{STAGE_LABEL[sess.stage]}</td>
                          <td className="py-3 px-4 text-right font-mono-num font-bold text-emerald-800">
                            {sess.score}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-0.5">
                              {[1, 2, 3].map((n) => (
                                <Star
                                  key={n}
                                  className={`w-3.5 h-3.5 ${
                                    n <= sess.stars
                                      ? 'fill-amber-400 text-amber-500'
                                      : 'text-stone-200'
                                  }`}
                                />
                              ))}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-stone-700">
                            {sess.accuracy}% ({sess.correctCount}/{sess.totalQuestions})
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-stone-500">
                            {sess.durationSeconds}秒
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-xs text-stone-500 whitespace-nowrap">
                            {new Date(sess.createdAtMs).toLocaleString('zh-HK', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'leaderboard' && (
            <div>
              {rankedStudents.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-stone-300 p-8 text-center text-sm text-stone-500">
                  建立學生檔案並完成關卡後，小買家龍虎榜便會自動更新排名！
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-stone-200 overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-xs text-stone-500 bg-stone-50/70">
                        <th className="py-3 px-4 font-bold">名次</th>
                        <th className="py-3 px-4 font-bold">學生</th>
                        <th className="py-3 px-4 font-bold text-right">累積星星</th>
                        <th className="py-3 px-4 font-bold text-right">總分</th>
                        <th className="py-3 px-4 font-bold text-center">三關最佳星級</th>
                        <th className="py-3 px-4 font-bold text-right">完成局數</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {rankedStudents.map((stu, idx) => (
                        <tr key={stu.id} className="hover:bg-stone-50/60">
                          <td className="py-3 px-4 font-mono-num font-extrabold text-stone-700">
                            #{idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <StudentAvatar avatarId={stu.avatarId} size={34} />
                              <div>
                                <div className="font-bold text-stone-900">{stu.name}</div>
                                {stu.className && (
                                  <div className="text-xs text-stone-500">{stu.className}</div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num font-extrabold text-amber-700">
                            {stu.totalStars} ★
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num font-bold text-emerald-800">
                            {stu.totalScore}
                          </td>
                          <td className="py-3 px-4 text-center font-mono-num text-xs text-stone-600">
                            {stu.starsStage1}★ / {stu.starsStage2}★ / {stu.starsStage3}★
                          </td>
                          <td className="py-3 px-4 text-right font-mono-num text-stone-600">
                            {stu.gamesPlayed}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
