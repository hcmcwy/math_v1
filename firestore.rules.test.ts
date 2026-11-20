/**
 * Security Rule Verification Suite — 精明小買家 1.0
 * Documents the Dirty Dozen negative assertions for Firestore Rules evaluation.
 * Designed for use with @firebase/rules-unit-testing against the local Firestore emulator.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: 'create' | 'get' | 'list' | 'update' | 'delete';
  path: string;
  auth: { uid: string; email_verified: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Unauthenticated Student Create',
    operation: 'create',
    path: '/students/stu_unauth',
    auth: null,
    payload: { ownerId: 'uid_a', name: '小明' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Email Access',
    operation: 'create',
    path: '/students/stu_unverified',
    auth: { uid: 'uid_a', email_verified: false },
    payload: { ownerId: 'uid_a', name: '小明' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Identity Spoofing on Create',
    operation: 'create',
    path: '/students/stu_spoof',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_b', name: '冒充者' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Shadow Field Injection',
    operation: 'create',
    path: '/students/stu_shadow',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_a', name: '小明', isAdmin: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Path ID Poisoning',
    operation: 'create',
    path: '/students/bad..id$poison',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_a', name: '小明' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Oversized Name Payload',
    operation: 'create',
    path: '/students/stu_large',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_a', name: 'A'.repeat(200) },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Cross-Owner Read',
    operation: 'get',
    path: '/students/stu_owned_by_a',
    auth: { uid: 'uid_b', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unfiltered List Query Scraping',
    operation: 'list',
    path: '/students',
    auth: { uid: 'uid_b', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Immutable OwnerId Update',
    operation: 'update',
    path: '/students/stu_owned_by_a',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_b' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Forged Client Timestamp',
    operation: 'create',
    path: '/students/stu_forged_time',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_a', name: '小明', createdAt: '2020-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Orphaned GameSession Reference',
    operation: 'create',
    path: '/gameSessions/sess_orphan',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { ownerId: 'uid_a', studentId: 'nonexistent_student', stage: 'recognize' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Immutable GameSession Score Tampering',
    operation: 'update',
    path: '/gameSessions/sess_existing',
    auth: { uid: 'uid_a', email_verified: true },
    payload: { score: 999999 },
    expected: 'PERMISSION_DENIED',
  },
];
