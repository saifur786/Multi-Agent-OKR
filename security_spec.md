# Firestore Security Specification

## 1. Master Data Invariants
1. **Strict Owner Isolation (No Cross-User PII Access)**: Every document under `/users/{userId}` and its subcollections (`/preferences`, `/industries`, `/chats`, `/chats/{chatId}/messages`) contains private workspace data or PII (`email`, `displayName`) and is readable/writable ONLY when `request.auth != null`, `request.auth.uid == userId`, `request.auth.token.email_verified == true` (for writes), and `isValidId(userId)`.
2. **No Unbounded Arrays or JSON Strings**: Chat history uses the `/users/{userId}/chats/{chatId}/messages/{messageId}` subcollection instead of an unbounded message array. `navButtonOrder` is strictly bounded (`<= 12` items, `size() > 0`) and `knowledgeBase` snapshots are strictly bounded (`<= 5` pillars, `size() > 0`).
3. **Referential Integrity & Parent Existence**: Every `ChatMessage` created at `/users/{userId}/chats/{chatId}/messages/{messageId}` verifies via `exists(...)` that the parent `/users/{userId}/chats/{chatId}` document exists and its `sessionId` matches `chatId`.
4. **Immutable Ownership & Creation Metadata**: `uid`, `ownerUid`, `sessionId`, and `createdAt` cannot be modified after creation (`incoming().ownerUid == existing().ownerUid`, `incoming().createdAt == existing().createdAt`).
5. **Server Timestamp Enforcement**: Every `createdAt`, `updatedAt`, and `lastLoginAt` write must equal `request.time` on creation or update.
6. **Allowlisted AI Models & Strict Field Sets**: `hasAll` and `hasOnly` prevent shadow/ghost fields on `create`, while `affectedKeys().hasOnly(...)` restricts `update` mutations to explicit action field sets.
7. **Collection-Group / List Hardening**: Every `allow list` validates `resource.data.ownerUid == request.auth.uid` (no blanket `isSignedIn()` list rules).

## 2. "Dirty Dozen" Adversarial Payloads (Expected Result: `PERMISSION_DENIED`)
1. **Unverified Email Write**: Write `/users/uid1/preferences/default` with `request.auth = { uid: 'uid1', token: { email_verified: false } }`.
2. **Ghost / Shadow Field Injection**: Create `/users/uid1` with `{ uid: 'uid1', displayName: 'A', email: 'a@b.com', createdAt: request.time, lastLoginAt: request.time, isAdmin: true }`.
3. **Owner UID Spoofing**: Create `/users/uid1/chats/c1` with `{ ownerUid: 'uid2', title: 'X', model: 'gemini-4-hydrogen', rolePresetId: 'strategy-advisor', systemInstruction: '...', messageCount: 0, createdAt: request.time, updatedAt: request.time }`.
4. **Path ID Poisoning**: Create `/users/uid1/chats/` with ID `bad..id/../../etc` or 200-character junk string violating `^[a-zA-Z0-9_\-]+$` / `<= 128`.
5. **Denial-of-Wallet Oversized String**: Create `/users/uid1/chats/c1/messages/m1` with `text` length `> 16000` characters.
6. **Forged Client Timestamp**: Create `/users/uid1/chats/c1` with `createdAt: Timestamp(2020-01-01)` instead of `request.time`.
7. **Orphaned Subcollection Message**: Create `/users/uid1/chats/nonexistent_chat/messages/m1` when parent `ChatSession` does not exist.
8. **Immutable Field Mutation**: Update `/users/uid1/chats/c1` attempting to alter `createdAt` or `ownerUid`.
9. **Cross-User PII Read**: Authenticated user `uid2` calls `get` on `/users/uid1` or `list` on `/users/uid1/chats`.
10. **Array Overflow Attack**: Create `/users/uid1/preferences/default` with `navButtonOrder` containing 25 entries (`> 12`) or invalid first element type (`123`).
11. **Disallowed Model Injection**: Create `/users/uid1/chats/c1` with `model: 'gemini-1.5-pro'` (outside allowlist).
12. **Out-of-Band Update Key**: Update `/users/uid1/preferences/default` with `{ navButtonOrder: ['studio'], secretFlag: true }` violating `affectedKeys().hasOnly(...)`.
