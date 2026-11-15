import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { KnowledgeBasePillar } from '../types/orchestration';
import type { ActiveNavView, UserPreferences } from '../utils/navOrder';
import { normalizeNavOrder, normalizeUserPreferences } from '../utils/navOrder';
import type { GeminiChatModelId } from '../utils/geminiChatConfig';
import { resolveGeminiChatModel } from '../utils/geminiChatConfig';

const VALID_ID_REGEX = /^[a-zA-Z0-9_\-]+$/;

export function sanitizeFirestoreId(raw: string, fallback = 'default'): string {
  const cleaned = String(raw || '')
    .replace(/[^a-zA-Z0-9_\-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  if (!cleaned || !VALID_ID_REGEX.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}

export interface PersistedChatSession {
  id: string;
  ownerUid: string;
  title: string;
  model: GeminiChatModelId;
  rolePresetId: string;
  systemInstruction: string;
  industryContext?: string;
  messageCount: number;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface PersistedChatMessage {
  id: string;
  ownerUid: string;
  sessionId: string;
  role: 'user' | 'model';
  text: string;
  model: GeminiChatModelId;
  createdAt?: unknown;
}

export async function upsertUserProfile(user: User): Promise<void> {
  const uid = sanitizeFirestoreId(user.uid);
  const path = `users/${uid}`;
  const ref = doc(db, 'users', uid);

  try {
    const snap = await getDoc(ref);
    const displayName = (user.displayName || user.email?.split('@')[0] || 'Enterprise User').slice(0, 120);
    const email = (user.email || 'user@example.com').slice(0, 254);
    const photoURL = user.photoURL ? user.photoURL.slice(0, 512) : undefined;

    if (!snap.exists()) {
      const payload: Record<string, any> = {
        uid,
        displayName,
        email,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp()
      };
      if (photoURL) payload.photoURL = photoURL;
      await setDoc(ref, payload);
    } else {
      const updatePayload: Record<string, any> = {
        displayName,
        email,
        lastLoginAt: serverTimestamp()
      };
      if (photoURL) updatePayload.photoURL = photoURL;
      await updateDoc(ref, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadUserPreferencesFromFirestore(uid: string): Promise<UserPreferences | null> {
  const cleanUid = sanitizeFirestoreId(uid);
  const path = `users/${cleanUid}/preferences/default`;
  try {
    const snap = await getDoc(doc(db, 'users', cleanUid, 'preferences', 'default'));
    if (!snap.exists()) return null;
    const data = snap.data();
    return normalizeUserPreferences({
      navButtonOrder: data.navButtonOrder as ActiveNavView[],
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function saveUserPreferencesToFirestore(
  uid: string,
  prefs: UserPreferences,
  preferredIndustry?: string
): Promise<void> {
  const cleanUid = sanitizeFirestoreId(uid);
  const path = `users/${cleanUid}/preferences/default`;
  const ref = doc(db, 'users', cleanUid, 'preferences', 'default');

  try {
    const snap = await getDoc(ref);
    const payload: Record<string, any> = {
      ownerUid: cleanUid,
      navButtonOrder: normalizeNavOrder(prefs.navButtonOrder).slice(0, 12),
      updatedAt: serverTimestamp()
    };
    if (preferredIndustry && preferredIndustry.trim()) {
      payload.preferredIndustry = preferredIndustry.trim().slice(0, 80);
    }

    if (!snap.exists()) {
      await setDoc(ref, payload);
    } else {
      await updateDoc(ref, {
        navButtonOrder: payload.navButtonOrder,
        ...(payload.preferredIndustry ? { preferredIndustry: payload.preferredIndustry } : {}),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveIndustryKnowledgeSnapshotToFirestore(
  uid: string,
  industryId: string,
  industryName: string,
  knowledgeBase: KnowledgeBasePillar[]
): Promise<void> {
  const cleanUid = sanitizeFirestoreId(uid);
  const cleanIndustryId = sanitizeFirestoreId(industryId, 'industry');
  const path = `users/${cleanUid}/industries/${cleanIndustryId}`;
  const ref = doc(db, 'users', cleanUid, 'industries', cleanIndustryId);

  const boundedPillars = knowledgeBase.slice(0, 5).map((p) => ({
    id: String(p.id).slice(0, 32),
    title: String(p.title).slice(0, 120),
    metric: String(p.metric).slice(0, 80),
    trend: String(p.trend).slice(0, 60),
    summary: String(p.summary).slice(0, 600),
    details: (p.details || []).slice(0, 8).map((d) => String(d).slice(0, 200)),
    vectorChunks: (p.vectorChunks || []).slice(0, 20).map((c) => ({
      id: String(c.id).slice(0, 64),
      text: String(c.text).slice(0, 400),
      source: String(c.source).slice(0, 140)
    }))
  }));

  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        ownerUid: cleanUid,
        industryId: cleanIndustryId,
        industryName: industryName.slice(0, 120),
        knowledgeBase: boundedPillars,
        updatedAt: serverTimestamp()
      });
    } else {
      await updateDoc(ref, {
        industryName: industryName.slice(0, 120),
        knowledgeBase: boundedPillars,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function loadIndustryKnowledgeSnapshotFromFirestore(
  uid: string,
  industryId: string
): Promise<KnowledgeBasePillar[] | null> {
  const cleanUid = sanitizeFirestoreId(uid);
  const cleanIndustryId = sanitizeFirestoreId(industryId, 'industry');
  const path = `users/${cleanUid}/industries/${cleanIndustryId}`;

  try {
    const snap = await getDoc(doc(db, 'users', cleanUid, 'industries', cleanIndustryId));
    if (!snap.exists()) return null;
    const data = snap.data();
    return Array.isArray(data.knowledgeBase) ? (data.knowledgeBase as KnowledgeBasePillar[]) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeToUserChatSessions(
  uid: string,
  onSessions: (sessions: PersistedChatSession[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const cleanUid = sanitizeFirestoreId(uid);
  const path = `users/${cleanUid}/chats`;
  const q = query(
    collection(db, 'users', cleanUid, 'chats'),
    where('ownerUid', '==', cleanUid),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const sessions = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PersistedChatSession, 'id'>)
      }));
      onSessions(sessions);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export function subscribeToChatMessages(
  uid: string,
  chatId: string,
  onMessages: (messages: PersistedChatMessage[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const cleanUid = sanitizeFirestoreId(uid);
  const cleanChatId = sanitizeFirestoreId(chatId);
  const path = `users/${cleanUid}/chats/${cleanChatId}/messages`;
  const q = query(
    collection(db, 'users', cleanUid, 'chats', cleanChatId, 'messages'),
    where('ownerUid', '==', cleanUid),
    orderBy('createdAt', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<PersistedChatMessage, 'id'>)
      }));
      onMessages(messages);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        if (onError && wrapped instanceof Error) {
          onError(wrapped);
        }
      }
    }
  );
}

export async function createChatSessionInFirestore(params: {
  uid: string;
  sessionId: string;
  title: string;
  model: GeminiChatModelId;
  rolePresetId: string;
  systemInstruction: string;
  industryContext?: string;
}): Promise<void> {
  const cleanUid = sanitizeFirestoreId(params.uid);
  const cleanChatId = sanitizeFirestoreId(params.sessionId, `chat_${Date.now()}`);
  const path = `users/${cleanUid}/chats/${cleanChatId}`;

  try {
    const payload: Record<string, any> = {
      ownerUid: cleanUid,
      title: params.title.trim().slice(0, 120) || 'Strategy Session',
      model: resolveGeminiChatModel(params.model),
      rolePresetId: params.rolePresetId.trim().slice(0, 64) || 'strategy-advisor',
      systemInstruction: params.systemInstruction.trim().slice(0, 2000) || 'You are a helpful OKR strategist.',
      messageCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    if (params.industryContext && params.industryContext.trim()) {
      payload.industryContext = params.industryContext.trim().slice(0, 80);
    }

    await setDoc(doc(db, 'users', cleanUid, 'chats', cleanChatId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export async function updateChatSessionConfigInFirestore(params: {
  uid: string;
  sessionId: string;
  title?: string;
  model: GeminiChatModelId;
  rolePresetId: string;
  systemInstruction: string;
  industryContext?: string;
}): Promise<void> {
  const cleanUid = sanitizeFirestoreId(params.uid);
  const cleanChatId = sanitizeFirestoreId(params.sessionId);
  const path = `users/${cleanUid}/chats/${cleanChatId}`;

  try {
    const payload: Record<string, any> = {
      model: resolveGeminiChatModel(params.model),
      rolePresetId: params.rolePresetId.trim().slice(0, 64) || 'strategy-advisor',
      systemInstruction: params.systemInstruction.trim().slice(0, 2000) || 'You are a helpful OKR strategist.',
      updatedAt: serverTimestamp()
    };
    if (params.title && params.title.trim()) {
      payload.title = params.title.trim().slice(0, 120);
    }
    if (params.industryContext && params.industryContext.trim()) {
      payload.industryContext = params.industryContext.trim().slice(0, 80);
    }

    await updateDoc(doc(db, 'users', cleanUid, 'chats', cleanChatId), payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function appendChatMessageInFirestore(params: {
  uid: string;
  sessionId: string;
  messageId: string;
  role: 'user' | 'model';
  text: string;
  model: GeminiChatModelId;
  nextMessageCount: number;
  updatedTitle?: string;
}): Promise<void> {
  const cleanUid = sanitizeFirestoreId(params.uid);
  const cleanChatId = sanitizeFirestoreId(params.sessionId);
  const cleanMsgId = sanitizeFirestoreId(params.messageId, `msg_${Date.now()}`);
  const msgPath = `users/${cleanUid}/chats/${cleanChatId}/messages/${cleanMsgId}`;
  const chatPath = `users/${cleanUid}/chats/${cleanChatId}`;

  try {
    await setDoc(doc(db, 'users', cleanUid, 'chats', cleanChatId, 'messages', cleanMsgId), {
      ownerUid: cleanUid,
      sessionId: cleanChatId,
      role: params.role,
      text: params.text.trim().slice(0, 16000) || '(empty)',
      model: resolveGeminiChatModel(params.model),
      createdAt: serverTimestamp()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, msgPath);
  }

  try {
    const updatePayload: Record<string, any> = {
      messageCount: Math.min(5000, Math.max(0, Math.floor(params.nextMessageCount))),
      updatedAt: serverTimestamp()
    };
    if (params.updatedTitle && params.updatedTitle.trim()) {
      updatePayload.title = params.updatedTitle.trim().slice(0, 120);
    }
    await updateDoc(doc(db, 'users', cleanUid, 'chats', cleanChatId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, chatPath);
  }
}

export async function deleteChatSessionInFirestore(uid: string, sessionId: string): Promise<void> {
  const cleanUid = sanitizeFirestoreId(uid);
  const cleanChatId = sanitizeFirestoreId(sessionId);
  const path = `users/${cleanUid}/chats/${cleanChatId}`;
  try {
    await deleteDoc(doc(db, 'users', cleanUid, 'chats', cleanChatId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
