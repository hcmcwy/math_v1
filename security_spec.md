# Security Specification — 精明小買家 1.0

## 1. Data Invariants
1. **Authentication & Verification**: Every read and write to `/students` and `/gameSessions` requires an authenticated user with `request.auth.token.email_verified == true`.
2. **Strict Ownership Isolation**: A user can only create, read, list, update, or delete student profiles and game sessions whose `ownerId` equals `request.auth.uid`.
3. **Referential Integrity (Master Gate)**: A `GameSession` in `/gameSessions/{sessionId}` cannot be created unless its referenced `/students/{studentId}` document exists and belongs to `request.auth.uid`.
4. **Immutable Audit Trail**: `GameSession` documents are append-only (`update` is always denied). On `StudentProfile`, `ownerId` and `createdAt` are immutable after creation.
5. **Temporal Integrity**: `createdAt` on create and `updatedAt` on create/update must strictly equal `request.time`.
6. **Strict Schema & Bounds**: All strings enforce exact `.size()` bounds; all numeric counters enforce integer type and non-negative ceilings; unknown shadow fields are blocked via `hasAll` + `hasOnly` and `affectedKeys().hasOnly()`.

## 2. The "Dirty Dozen" Payloads (Expected: PERMISSION_DENIED)

1. **Unauthenticated Student Create**: Missing `request.auth` creating `/students/stu_1`.
2. **Unverified Email Spoof**: Authenticated user with `email_verified: false` reading or writing `/students/stu_1`.
3. **Identity Spoofing on Create**: User `uid_a` creates `/students/stu_1` with `{ "ownerId": "uid_b", ... }`.
4. **Shadow Field Injection on Create**: User creates `/students/stu_1` with valid fields plus `{ "isAdmin": true }`.
5. **Path ID Poisoning**: User creates `/students/bad..id$with!junk` violating `^[a-zA-Z0-9_\-]+$`.
6. **Denial-of-Wallet Oversized Name**: User creates `/students/stu_1` with `name` of 500 characters (`> 30`).
7. **Cross-Owner Read**: User `uid_b` attempts `get` on `/students/stu_a` owned by `uid_a`.
8. **Blanket List Query Scraping**: User `uid_b` attempts `list` on `/students` without matching `ownerId == 'uid_b'`.
9. **Immutable Owner Tampering on Update**: User `uid_a` updates `/students/stu_a` changing `ownerId` or `createdAt`.
10. **Client-Forged Timestamp**: User creates `/students/stu_1` with a past client timestamp instead of `request.time`.
11. **Orphaned GameSession Create**: User creates `/gameSessions/sess_1` referencing a nonexistent `studentId` or another user's `studentId`.
12. **GameSession Tampering (Immutable Log Update)**: User attempts `update` on an existing `/gameSessions/sess_1` to inflate `score` or `stars`.
