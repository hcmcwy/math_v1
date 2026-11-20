import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { AvatarId, StageId } from '../data/gameContent';

export interface StudentRecord {
  id: string;
  ownerId: string;
  name: string;
  className: string;
  avatarId: AvatarId;
  totalStars: number;
  totalScore: number;
  gamesPlayed: number;
  bestStage1: number;
  bestStage2: number;
  bestStage3: number;
  starsStage1: number;
  starsStage2: number;
  starsStage3: number;
  createdAtMs: number;
  updatedAtMs: number;
  source: 'cloud' | 'local';
}

export interface GameSessionRecord {
  id: string;
  ownerId: string;
  studentId: string;
  studentName: string;
  stage: StageId;
  score: number;
  stars: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  durationSeconds: number;
  createdAtMs: number;
  source: 'cloud' | 'local';
}

export interface RoundResultPayload {
  stage: StageId;
  score: number;
  stars: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  durationSeconds: number;
}

const LOCAL_STUDENTS_KEY = 'smart_shopper_local_students_v1';
const LOCAL_SESSIONS_KEY = 'smart_shopper_local_sessions_v1';
const ACTIVE_STUDENT_KEY = 'smart_shopper_active_student_v1';

const VALID_AVATARS: AvatarId[] = ['cat', 'panda', 'fox', 'bear', 'rabbit', 'owl', 'shiba', 'duck'];

function makeSafeId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`.replace(/[^a-zA-Z0-9_-]/g, '');
}

function sanitizeName(raw: string): string {
  return raw.trim().slice(0, 30);
}

function sanitizeClass(raw: string): string {
  return raw.trim().slice(0, 20);
}

function sanitizeAvatar(raw: string): AvatarId {
  return VALID_AVATARS.includes(raw as AvatarId) ? (raw as AvatarId) : 'cat';
}

function tsToMs(val: unknown): number {
  if (val instanceof Timestamp) return val.toMillis();
  if (typeof val === 'number') return val;
  if (val && typeof val === 'object' && 'seconds' in val) {
    return Number((val as { seconds: number }).seconds) * 1000;
  }
  return Date.now();
}

function loadLocalStudents(): StudentRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_STUDENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function loadLocalSessions(): GameSessionRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_SESSIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function useStudentCloud() {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  const [cloudStudents, setCloudStudents] = useState<StudentRecord[]>([]);
  const [cloudSessions, setCloudSessions] = useState<GameSessionRecord[]>([]);
  const [cloudLoading, setCloudLoading] = useState(false);

  const [localStudents, setLocalStudents] = useState<StudentRecord[]>(() => loadLocalStudents());
  const [localSessions, setLocalSessions] = useState<GameSessionRecord[]>(() => loadLocalSessions());

  const [activeStudentId, setActiveStudentId] = useState<string | null>(() => {
    try {
      return localStorage.getItem(ACTIVE_STUDENT_KEY);
    } catch {
      return null;
    }
  });

  const [syncError, setSyncError] = useState<string | null>(null);

  // Persist local guest data
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STUDENTS_KEY, JSON.stringify(localStudents));
    } catch {
      // ignore
    }
  }, [localStudents]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_SESSIONS_KEY, JSON.stringify(localSessions));
    } catch {
      // ignore
    }
  }, [localSessions]);

  useEffect(() => {
    try {
      if (activeStudentId) {
        localStorage.setItem(ACTIVE_STUDENT_KEY, activeStudentId);
      } else {
        localStorage.removeItem(ACTIVE_STUDENT_KEY);
      }
    } catch {
      // ignore
    }
  }, [activeStudentId]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthReady(true);
      setSyncError(null);
    });
    return () => unsub();
  }, []);

  // Real-time Firestore listeners when authenticated
  useEffect(() => {
    if (!authReady || !user) {
      setCloudStudents([]);
      setCloudSessions([]);
      setCloudLoading(false);
      return;
    }

    setCloudLoading(true);
    const studentsQuery = query(collection(db, 'students'), where('ownerId', '==', user.uid));
    const sessionsQuery = query(collection(db, 'gameSessions'), where('ownerId', '==', user.uid));

    const unsubStudents = onSnapshot(
      studentsQuery,
      (snap) => {
        const list: StudentRecord[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: String(data.ownerId || user.uid),
              name: String(data.name || ''),
              className: String(data.className || ''),
              avatarId: sanitizeAvatar(String(data.avatarId || 'cat')),
              totalStars: Number(data.totalStars || 0),
              totalScore: Number(data.totalScore || 0),
              gamesPlayed: Number(data.gamesPlayed || 0),
              bestStage1: Number(data.bestStage1 || 0),
              bestStage2: Number(data.bestStage2 || 0),
              bestStage3: Number(data.bestStage3 || 0),
              starsStage1: Number(data.starsStage1 || 0),
              starsStage2: Number(data.starsStage2 || 0),
              starsStage3: Number(data.starsStage3 || 0),
              createdAtMs: tsToMs(data.createdAt),
              updatedAtMs: tsToMs(data.updatedAt),
              source: 'cloud' as const,
            };
          })
          .sort((a, b) => b.updatedAtMs - a.updatedAtMs);
        setCloudStudents(list);
        setCloudLoading(false);
      },
      (err) => {
        setCloudLoading(false);
        setSyncError('無法讀取雲端學生資料，請確認網路連線。');
        try {
          handleFirestoreError(err, OperationType.LIST, 'students');
        } catch {
          // logged via handleFirestoreError
        }
      }
    );

    const unsubSessions = onSnapshot(
      sessionsQuery,
      (snap) => {
        const list: GameSessionRecord[] = snap.docs
          .map((d) => {
            const data = d.data();
            return {
              id: d.id,
              ownerId: String(data.ownerId || user.uid),
              studentId: String(data.studentId || ''),
              studentName: String(data.studentName || ''),
              stage: (data.stage as StageId) || 'recognize',
              score: Number(data.score || 0),
              stars: Number(data.stars || 1),
              correctCount: Number(data.correctCount || 0),
              totalQuestions: Number(data.totalQuestions || 1),
              accuracy: Number(data.accuracy || 0),
              durationSeconds: Number(data.durationSeconds || 0),
              createdAtMs: tsToMs(data.createdAt),
              source: 'cloud' as const,
            };
          })
          .sort((a, b) => b.createdAtMs - a.createdAtMs);
        setCloudSessions(list);
      },
      (err) => {
        try {
          handleFirestoreError(err, OperationType.LIST, 'gameSessions');
        } catch {
          // logged via handleFirestoreError
        }
      }
    );

    return () => {
      unsubStudents();
      unsubSessions();
    };
  }, [authReady, user]);

  const students = user ? cloudStudents : localStudents;
  const sessions = user ? cloudSessions : localSessions;

  // Ensure activeStudentId stays valid
  const activeStudent = useMemo(() => {
    if (students.length === 0) return null;
    const found = students.find((s) => s.id === activeStudentId);
    return found ?? students[0];
  }, [students, activeStudentId]);

  useEffect(() => {
    if (activeStudent && activeStudent.id !== activeStudentId) {
      setActiveStudentId(activeStudent.id);
    }
  }, [activeStudent, activeStudentId]);

  const signInWithGoogle = useCallback(async () => {
    setAuthBusy(true);
    setAuthNotice(null);
    setSyncError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setAuthNotice('已登入 Google 帳號，雲端資料即時同步中！');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (!msg.includes('popup-closed-by-user')) {
        setSyncError('Google 登入未完成，請允許彈出視窗或再試一次。');
      }
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setAuthBusy(true);
    try {
      await signOut(auth);
      setAuthNotice('已登出雲端帳號，已切換回本機暫存模式。');
    } finally {
      setAuthBusy(false);
    }
  }, []);

  const createStudent = useCallback(
    async (rawName: string, rawClassName: string, avatarId: AvatarId): Promise<StudentRecord | null> => {
      const name = sanitizeName(rawName);
      if (!name) return null;
      const className = sanitizeClass(rawClassName);
      const safeAvatar = sanitizeAvatar(avatarId);
      const studentId = makeSafeId('stu');
      const nowMs = Date.now();

      if (user) {
        const path = `students/${studentId}`;
        try {
          await setDoc(doc(db, 'students', studentId), {
            ownerId: user.uid,
            name,
            className,
            avatarId: safeAvatar,
            totalStars: 0,
            totalScore: 0,
            gamesPlayed: 0,
            bestStage1: 0,
            bestStage2: 0,
            bestStage3: 0,
            starsStage1: 0,
            starsStage2: 0,
            starsStage3: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          setActiveStudentId(studentId);
          return {
            id: studentId,
            ownerId: user.uid,
            name,
            className,
            avatarId: safeAvatar,
            totalStars: 0,
            totalScore: 0,
            gamesPlayed: 0,
            bestStage1: 0,
            bestStage2: 0,
            bestStage3: 0,
            starsStage1: 0,
            starsStage2: 0,
            starsStage3: 0,
            createdAtMs: nowMs,
            updatedAtMs: nowMs,
            source: 'cloud',
          };
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, path);
        }
      } else {
        const created: StudentRecord = {
          id: studentId,
          ownerId: 'local',
          name,
          className,
          avatarId: safeAvatar,
          totalStars: 0,
          totalScore: 0,
          gamesPlayed: 0,
          bestStage1: 0,
          bestStage2: 0,
          bestStage3: 0,
          starsStage1: 0,
          starsStage2: 0,
          starsStage3: 0,
          createdAtMs: nowMs,
          updatedAtMs: nowMs,
          source: 'local',
        };
        setLocalStudents((prev) => [created, ...prev]);
        setActiveStudentId(studentId);
        return created;
      }
    },
    [user]
  );

  const updateStudentProfile = useCallback(
    async (studentId: string, rawName: string, rawClassName: string, avatarId: AvatarId) => {
      const name = sanitizeName(rawName);
      if (!name) return;
      const className = sanitizeClass(rawClassName);
      const safeAvatar = sanitizeAvatar(avatarId);

      if (user) {
        const path = `students/${studentId}`;
        try {
          await updateDoc(doc(db, 'students', studentId), {
            name,
            className,
            avatarId: safeAvatar,
            updatedAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, path);
        }
      } else {
        setLocalStudents((prev) =>
          prev.map((s) =>
            s.id === studentId
              ? { ...s, name, className, avatarId: safeAvatar, updatedAtMs: Date.now() }
              : s
          )
        );
      }
    },
    [user]
  );

  const deleteStudent = useCallback(
    async (studentId: string) => {
      if (user) {
        const path = `students/${studentId}`;
        try {
          // Delete associated sessions first
          const studentSessions = cloudSessions.filter((sess) => sess.studentId === studentId);
          for (const sess of studentSessions) {
            await deleteDoc(doc(db, 'gameSessions', sess.id));
          }
          await deleteDoc(doc(db, 'students', studentId));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, path);
        }
      } else {
        setLocalStudents((prev) => prev.filter((s) => s.id !== studentId));
        setLocalSessions((prev) => prev.filter((sess) => sess.studentId !== studentId));
      }
      if (activeStudentId === studentId) {
        setActiveStudentId(null);
      }
    },
    [user, cloudSessions, activeStudentId]
  );

  const recordGameSession = useCallback(
    async (student: StudentRecord, result: RoundResultPayload): Promise<boolean> => {
      const sessionId = makeSafeId('sess');
      const safeScore = Math.max(0, Math.min(10000, Math.round(result.score)));
      const safeStars = Math.max(1, Math.min(3, Math.round(result.stars)));
      const safeTotal = Math.max(1, Math.min(50, Math.round(result.totalQuestions)));
      const safeCorrect = Math.max(0, Math.min(safeTotal, Math.round(result.correctCount)));
      const safeAccuracy = Math.max(0, Math.min(100, Math.round(result.accuracy)));
      const safeDuration = Math.max(0, Math.min(7200, Math.round(result.durationSeconds)));

      const nextBest1 = result.stage === 'recognize' ? Math.max(student.bestStage1, safeScore) : student.bestStage1;
      const nextBest2 = result.stage === 'exchange' ? Math.max(student.bestStage2, safeScore) : student.bestStage2;
      const nextBest3 = result.stage === 'checkout' ? Math.max(student.bestStage3, safeScore) : student.bestStage3;

      const nextStars1 = result.stage === 'recognize' ? Math.max(student.starsStage1, safeStars) : student.starsStage1;
      const nextStars2 = result.stage === 'exchange' ? Math.max(student.starsStage2, safeStars) : student.starsStage2;
      const nextStars3 = result.stage === 'checkout' ? Math.max(student.starsStage3, safeStars) : student.starsStage3;

      if (user) {
        const studentPath = `students/${student.id}`;
        const sessionPath = `gameSessions/${sessionId}`;
        try {
          await setDoc(doc(db, 'gameSessions', sessionId), {
            ownerId: user.uid,
            studentId: student.id,
            studentName: sanitizeName(student.name),
            stage: result.stage,
            score: safeScore,
            stars: safeStars,
            correctCount: safeCorrect,
            totalQuestions: safeTotal,
            accuracy: safeAccuracy,
            durationSeconds: safeDuration,
            createdAt: serverTimestamp(),
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, sessionPath);
        }

        try {
          await updateDoc(doc(db, 'students', student.id), {
            totalStars: Math.min(1000000, student.totalStars + safeStars),
            totalScore: Math.min(10000000, student.totalScore + safeScore),
            gamesPlayed: Math.min(100000, student.gamesPlayed + 1),
            bestStage1: nextBest1,
            bestStage2: nextBest2,
            bestStage3: nextBest3,
            starsStage1: nextStars1,
            starsStage2: nextStars2,
            starsStage3: nextStars3,
            updatedAt: serverTimestamp(),
          });
          return true;
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, studentPath);
        }
      } else {
        const nowMs = Date.now();
        const newSession: GameSessionRecord = {
          id: sessionId,
          ownerId: 'local',
          studentId: student.id,
          studentName: student.name,
          stage: result.stage,
          score: safeScore,
          stars: safeStars,
          correctCount: safeCorrect,
          totalQuestions: safeTotal,
          accuracy: safeAccuracy,
          durationSeconds: safeDuration,
          createdAtMs: nowMs,
          source: 'local',
        };
        setLocalSessions((prev) => [newSession, ...prev]);
        setLocalStudents((prev) =>
          prev.map((s) =>
            s.id === student.id
              ? {
                  ...s,
                  totalStars: s.totalStars + safeStars,
                  totalScore: s.totalScore + safeScore,
                  gamesPlayed: s.gamesPlayed + 1,
                  bestStage1: nextBest1,
                  bestStage2: nextBest2,
                  bestStage3: nextBest3,
                  starsStage1: nextStars1,
                  starsStage2: nextStars2,
                  starsStage3: nextStars3,
                  updatedAtMs: nowMs,
                }
              : s
          )
        );
        return false;
      }
    },
    [user]
  );

  // Migrate local guest students & sessions into Firestore when user signs in
  const migrateLocalToCloud = useCallback(async () => {
    if (!user || localStudents.length === 0) return;
    setAuthBusy(true);
    try {
      const idMap: Record<string, string> = {};
      for (const stu of localStudents) {
        const newId = makeSafeId('stu');
        idMap[stu.id] = newId;
        await setDoc(doc(db, 'students', newId), {
          ownerId: user.uid,
          name: sanitizeName(stu.name) || '學生',
          className: sanitizeClass(stu.className),
          avatarId: sanitizeAvatar(stu.avatarId),
          totalStars: Math.max(0, Math.min(1000000, Math.round(stu.totalStars))),
          totalScore: Math.max(0, Math.min(10000000, Math.round(stu.totalScore))),
          gamesPlayed: Math.max(0, Math.min(100000, Math.round(stu.gamesPlayed))),
          bestStage1: Math.max(0, Math.min(10000, Math.round(stu.bestStage1))),
          bestStage2: Math.max(0, Math.min(10000, Math.round(stu.bestStage2))),
          bestStage3: Math.max(0, Math.min(10000, Math.round(stu.bestStage3))),
          starsStage1: Math.max(0, Math.min(3, Math.round(stu.starsStage1))),
          starsStage2: Math.max(0, Math.min(3, Math.round(stu.starsStage2))),
          starsStage3: Math.max(0, Math.min(3, Math.round(stu.starsStage3))),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }

      for (const sess of localSessions) {
        const mappedStudentId = idMap[sess.studentId];
        if (!mappedStudentId) continue;
        const newSessId = makeSafeId('sess');
        await setDoc(doc(db, 'gameSessions', newSessId), {
          ownerId: user.uid,
          studentId: mappedStudentId,
          studentName: sanitizeName(sess.studentName) || '學生',
          stage: sess.stage,
          score: Math.max(0, Math.min(10000, Math.round(sess.score))),
          stars: Math.max(1, Math.min(3, Math.round(sess.stars))),
          correctCount: Math.max(0, Math.min(sess.totalQuestions, Math.round(sess.correctCount))),
          totalQuestions: Math.max(1, Math.min(50, Math.round(sess.totalQuestions))),
          accuracy: Math.max(0, Math.min(100, Math.round(sess.accuracy))),
          durationSeconds: Math.max(0, Math.min(7200, Math.round(sess.durationSeconds))),
          createdAt: serverTimestamp(),
        });
      }

      setLocalStudents([]);
      setLocalSessions([]);
      setAuthNotice('本機學生紀錄已成功同步到雲端！');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'students');
    } finally {
      setAuthBusy(false);
    }
  }, [user, localStudents, localSessions]);

  const exportCsvReport = useCallback(() => {
    const stageLabels: Record<StageId, string> = {
      recognize: '第一關：認識幣值',
      exchange: '第二關：等值置換',
      checkout: '第三關：剛好付清',
    };
    const header = ['學生姓名', '關卡', '分數', '獲得星級', '首次答對題數', '總題數', '準確率(%)', '用時(秒)', '完成時間'];
    const rows = sessions.map((s) => [
      s.studentName,
      stageLabels[s.stage] || s.stage,
      String(s.score),
      String(s.stars),
      String(s.correctCount),
      String(s.totalQuestions),
      String(s.accuracy),
      String(s.durationSeconds),
      new Date(s.createdAtMs).toLocaleString('zh-HK'),
    ]);
    const csv = '\uFEFF' + [header, ...rows].map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `精明小買家學習紀錄_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessions]);

  return {
    user,
    authReady,
    authBusy,
    authNotice,
    syncError,
    cloudLoading,
    students,
    sessions,
    activeStudent,
    localPendingCount: user ? localStudents.length : 0,
    setActiveStudentId,
    signInWithGoogle,
    logout,
    createStudent,
    updateStudentProfile,
    deleteStudent,
    recordGameSession,
    migrateLocalToCloud,
    exportCsvReport,
  };
}
