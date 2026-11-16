import { AppState } from 'react-native';
import {
  onDisconnect,
  onValue,
  ref,
  serverTimestamp,
  update,
} from 'firebase/database';
import { db } from './firebaseConfig';

export const startPresenceTracking = uid => {
  if (!uid) {
    return () => {};
  }

  let isDisposed = false;
  const connectedRef = ref(db, '.info/connected');
  const userStatusRef = ref(db, `users/${uid}`);

  const setOnlineState = isOnline => {
    if (isDisposed) {
      return;
    }
    update(userStatusRef, {
      online: isOnline,
      lastSeen: serverTimestamp(),
    }).catch(() => {});
  };

  const unsubscribeConnected = onValue(connectedRef, snapshot => {
    if (isDisposed || snapshot.val() !== true) {
      return;
    }

    const disconnectHandler = onDisconnect(userStatusRef);
    if (disconnectHandler && typeof disconnectHandler.update === 'function') {
      disconnectHandler
        .update({
          online: false,
          lastSeen: serverTimestamp(),
        })
        .then(() => {
          if (!isDisposed) {
            setOnlineState(true);
          }
        })
        .catch(() => {
          setOnlineState(true);
        });
    } else {
      setOnlineState(true);
    }
  });

  const handleAppStateChange = nextAppState => {
    if (isDisposed) {
      return;
    }
    if (nextAppState === 'active') {
      setOnlineState(true);
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      setOnlineState(false);
    }
  };

  const appStateSubscription = AppState.addEventListener(
    'change',
    handleAppStateChange,
  );

  return () => {
    isDisposed = true;
    if (typeof unsubscribeConnected === 'function') {
      unsubscribeConnected();
    }
    if (
      appStateSubscription &&
      typeof appStateSubscription.remove === 'function'
    ) {
      appStateSubscription.remove();
    }
  };
};

export const subscribeUserPresence = (uid, callback) => {
  if (!uid) {
    return () => {};
  }

  const userRef = ref(db, `users/${uid}`);
  const unsubscribe = onValue(userRef, snapshot => {
    const data = snapshot.val();
    if (!data) {
      callback({
        uid,
        online: false,
        lastSeen: null,
        displayName: '',
        email: '',
        avatar: '',
      });
      return;
    }

    callback({
      uid: data.uid || uid,
      online: Boolean(data.online),
      lastSeen: typeof data.lastSeen === 'number' ? data.lastSeen : null,
      displayName: data.displayName || '',
      email: data.email || '',
      avatar: data.avatar || '',
    });
  });

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
};
