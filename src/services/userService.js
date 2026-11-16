import { onValue, ref } from 'firebase/database';
import { db } from './firebaseConfig';

export const normalizeSearchText = value => {
  if (!value || typeof value !== 'string') {
    return '';
  }
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .trim();
};

export const filterContacts = (contacts = [], keyword = '', currentUid = '') => {
  const baseList = Array.isArray(contacts)
    ? contacts.filter(item => item && (!currentUid || item.uid !== currentUid))
    : [];

  const trimmedKeyword = (keyword || '').trim();
  if (!trimmedKeyword) {
    return baseList;
  }

  const rawLower = trimmedKeyword.toLowerCase();
  const normalizedQuery = normalizeSearchText(trimmedKeyword);

  return baseList.filter(contact => {
    const name = contact.displayName || '';
    const email = contact.email || '';

    const rawMatch =
      name.toLowerCase().includes(rawLower) ||
      email.toLowerCase().includes(rawLower);

    if (rawMatch) {
      return true;
    }

    return (
      normalizeSearchText(name).includes(normalizedQuery) ||
      normalizeSearchText(email).includes(normalizedQuery)
    );
  });
};

export const sortContacts = (contacts = []) => {
  return [...contacts].sort((a, b) => {
    const onlineDiff = Number(Boolean(b.online)) - Number(Boolean(a.online));
    if (onlineDiff !== 0) {
      return onlineDiff;
    }
    const nameA = (a.displayName || a.email || '').toLowerCase();
    const nameB = (b.displayName || b.email || '').toLowerCase();
    return nameA.localeCompare(nameB, 'vi');
  });
};

export const subscribeContacts = (currentUid, callback, onError) => {
  if (!currentUid) {
    callback([]);
    return () => {};
  }

  const usersRef = ref(db, 'users');
  const unsubscribe = onValue(
    usersRef,
    snapshot => {
      const rawUsers = snapshot.val() || {};
      const contacts = Object.entries(rawUsers)
        .map(([key, value]) => {
          if (!value || typeof value !== 'object') {
            return null;
          }
          const uid = value.uid || key;
          return {
            uid,
            displayName:
              value.displayName ||
              (value.email ? value.email.split('@')[0] : 'Người dùng'),
            email: value.email || '',
            avatar: value.avatar || '',
            online: Boolean(value.online),
            lastSeen:
              typeof value.lastSeen === 'number' ? value.lastSeen : null,
          };
        })
        .filter(item => item && item.uid !== currentUid);

      callback(sortContacts(contacts));
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
