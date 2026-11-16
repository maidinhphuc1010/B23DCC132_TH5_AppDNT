import {
  get,
  increment,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  serverTimestamp,
  update,
} from 'firebase/database';
import { db } from './firebaseConfig';

export const getChatId = (uid1, uid2) => {
  const first = typeof uid1 === 'string' ? uid1.trim() : '';
  const second = typeof uid2 === 'string' ? uid2.trim() : '';

  if (!first || !second) {
    throw new Error('Thiếu định danh người dùng để tạo phòng chat.');
  }

  return [first, second].sort().join('_');
};

export const sendMessage = async ({ chatId, senderId, receiverId, text }) => {
  const trimmedText = typeof text === 'string' ? text.trim() : '';

  if (!trimmedText) {
    throw new Error('Nội dung tin nhắn không được để trống.');
  }
  if (!senderId || !receiverId) {
    throw new Error('Thiếu thông tin người gửi hoặc người nhận.');
  }

  const resolvedChatId = chatId || getChatId(senderId, receiverId);
  const messagesListRef = ref(db, `messages/${resolvedChatId}`);
  const newMessageRef = push(messagesListRef);
  const messageId = newMessageRef.key;

  const messagePayload = {
    id: messageId,
    senderId,
    receiverId,
    text: trimmedText,
    createdAt: serverTimestamp(),
  };

  const updates = {
    [`messages/${resolvedChatId}/${messageId}`]: messagePayload,
    [`conversations/${resolvedChatId}/id`]: resolvedChatId,
    [`conversations/${resolvedChatId}/participants/${senderId}`]: true,
    [`conversations/${resolvedChatId}/participants/${receiverId}`]: true,
    [`conversations/${resolvedChatId}/lastMessage`]: trimmedText,
    [`conversations/${resolvedChatId}/lastMessageTime`]: serverTimestamp(),
    [`conversations/${resolvedChatId}/lastSenderId`]: senderId,
    [`conversations/${resolvedChatId}/unreadCount/${senderId}`]: 0,
    [`conversations/${resolvedChatId}/unreadCount/${receiverId}`]: increment(1),
  };

  await update(ref(db), updates);

  return {
    chatId: resolvedChatId,
    messageId,
    ...messagePayload,
  };
};

export const subscribeMessages = (chatId, callback, onError) => {
  if (!chatId) {
    callback([]);
    return () => {};
  }

  const messagesQuery = query(
    ref(db, `messages/${chatId}`),
    orderByChild('createdAt'),
  );

  const unsubscribe = onValue(
    messagesQuery,
    snapshot => {
      const list = [];

      if (snapshot && typeof snapshot.forEach === 'function') {
        snapshot.forEach(childSnapshot => {
          const val = childSnapshot.val();
          if (val && typeof val === 'object') {
            list.push({
              id: val.id || childSnapshot.key,
              senderId: val.senderId || '',
              receiverId: val.receiverId || '',
              text: val.text || '',
              createdAt:
                typeof val.createdAt === 'number' ? val.createdAt : 0,
            });
          }
        });
      } else {
        const raw = (snapshot && snapshot.val && snapshot.val()) || {};
        Object.entries(raw).forEach(([key, val]) => {
          if (val && typeof val === 'object') {
            list.push({
              id: val.id || key,
              senderId: val.senderId || '',
              receiverId: val.receiverId || '',
              text: val.text || '',
              createdAt:
                typeof val.createdAt === 'number' ? val.createdAt : 0,
            });
          }
        });
      }

      list.sort((a, b) => {
        if (a.createdAt !== b.createdAt) {
          return a.createdAt - b.createdAt;
        }
        return String(a.id).localeCompare(String(b.id));
      });

      callback(list);
    },
    error => {
      if (typeof onError === 'function') {
        onError(error);
      }
    },
  );

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
};

export const buildConversationList = (
  rawConversations = {},
  rawUsers = {},
  currentUid = '',
) => {
  if (!currentUid || !rawConversations || typeof rawConversations !== 'object') {
    return [];
  }

  const result = [];

  Object.entries(rawConversations).forEach(([chatKey, conv]) => {
    if (!conv || typeof conv !== 'object') {
      return;
    }

    const participants = conv.participants || {};
    const isParticipant =
      participants[currentUid] === true ||
      chatKey.startsWith(`${currentUid}_`) ||
      chatKey.endsWith(`_${currentUid}`);

    if (!isParticipant) {
      return;
    }

    let partnerId = Object.keys(participants).find(uid => uid !== currentUid);
    if (!partnerId) {
      const parts = chatKey.split('_');
      partnerId = parts.find(uid => uid !== currentUid) || '';
    }

    const partnerProfile = (partnerId && rawUsers?.[partnerId]) || {};
    const partnerEmail = partnerProfile.email || '';
    const partnerName =
      partnerProfile.displayName ||
      (partnerEmail ? partnerEmail.split('@')[0] : 'Người dùng');

    const unreadCount = Number(conv.unreadCount?.[currentUid] || 0);
    const lastMessageTime =
      typeof conv.lastMessageTime === 'number' ? conv.lastMessageTime : 0;

    result.push({
      chatId: conv.id || chatKey,
      receiverId: partnerId,
      receiverName: partnerName,
      receiverEmail: partnerEmail,
      receiverAvatar: partnerProfile.avatar || '',
      receiverOnline: Boolean(partnerProfile.online),
      receiverLastSeen:
        typeof partnerProfile.lastSeen === 'number'
          ? partnerProfile.lastSeen
          : null,
      lastMessage: conv.lastMessage || '',
      lastMessageTime,
      lastSenderId: conv.lastSenderId || '',
      unreadCount: unreadCount > 0 ? unreadCount : 0,
    });
  });

  result.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
  return result;
};

export const subscribeConversations = (currentUid, callback, onError) => {
  if (!currentUid) {
    callback([]);
    return () => {};
  }

  let latestConversations = {};
  let latestUsers = {};
  let hasLoadedConversations = false;

  const emitMerged = () => {
    if (!hasLoadedConversations) {
      return;
    }
    const merged = buildConversationList(
      latestConversations,
      latestUsers,
      currentUid,
    );
    callback(merged);
  };

  const unsubConversations = onValue(
    ref(db, 'conversations'),
    snapshot => {
      latestConversations = snapshot.val() || {};
      hasLoadedConversations = true;
      emitMerged();
    },
    error => {
      if (typeof onError === 'function') {
        onError(error);
      }
    },
  );

  const unsubUsers = onValue(
    ref(db, 'users'),
    snapshot => {
      latestUsers = snapshot.val() || {};
      emitMerged();
    },
    error => {
      if (typeof onError === 'function') {
        onError(error);
      }
    },
  );

  return () => {
    if (typeof unsubConversations === 'function') {
      unsubConversations();
    }
    if (typeof unsubUsers === 'function') {
      unsubUsers();
    }
  };
};

export const markConversationAsRead = async (chatId, currentUid) => {
  if (!chatId || !currentUid) {
    return;
  }

  const conversationRef = ref(db, `conversations/${chatId}`);
  const snapshot = await get(conversationRef);
  if (!snapshot.exists()) {
    return;
  }

  const currentUnread = Number(snapshot.val()?.unreadCount?.[currentUid] || 0);
  if (currentUnread === 0) {
    return;
  }

  await update(ref(db), {
    [`conversations/${chatId}/unreadCount/${currentUid}`]: 0,
  });
};
