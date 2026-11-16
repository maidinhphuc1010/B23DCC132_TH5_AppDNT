import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { get, ref, serverTimestamp, set, update } from 'firebase/database';
import { auth, db } from './firebaseConfig';

export const buildDefaultAvatar = (displayName, email = '') => {
  const label = (displayName || email || 'User').trim();
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    label,
  )}&background=4F46E5&color=ffffff&bold=true&size=128`;
};

export const mapAuthError = error => {
  if (!error) {
    return 'Đã xảy ra lỗi không xác định. Vui lòng thử lại.';
  }

  const code = error.code || '';

  switch (code) {
    case 'auth/invalid-email':
      return 'Địa chỉ email không đúng định dạng.';
    case 'auth/user-disabled':
      return 'Tài khoản này đã bị khóa hoặc vô hiệu hóa.';
    case 'auth/user-not-found':
      return 'Không tìm thấy tài khoản nào đăng ký với email này.';
    case 'auth/wrong-password':
      return 'Mật khẩu không chính xác. Vui lòng kiểm tra lại.';
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Email hoặc mật khẩu không chính xác.';
    case 'auth/email-already-in-use':
      return 'Email này đã được sử dụng. Vui lòng dùng email khác hoặc đăng nhập.';
    case 'auth/weak-password':
      return 'Mật khẩu quá yếu. Vui lòng nhập tối thiểu 6 ký tự.';
    case 'auth/missing-password':
      return 'Vui lòng nhập mật khẩu.';
    case 'auth/operation-not-allowed':
      return 'Phương thức Email/Password chưa được kích hoạt trên Firebase Console.';
    case 'auth/too-many-requests':
      return 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.';
    case 'auth/network-request-failed':
      return 'Không thể kết nối mạng. Vui lòng kiểm tra kết nối Internet.';
    case 'auth/invalid-api-key':
    case 'auth/api-key-not-valid':
    case 'auth/configuration-not-found':
      return 'Cấu hình Firebase chưa hợp lệ. Vui lòng cập nhật thông số trong tệp .env.';
    default:
      if (typeof code === 'string' && code.startsWith('auth/api-key-not-valid')) {
        return 'Cấu hình Firebase API Key chưa hợp lệ. Vui lòng kiểm tra tệp .env.';
      }
      if (typeof code === 'string' && code.startsWith('auth/')) {
        return 'Xác thực thất bại. Vui lòng kiểm tra thông tin và thử lại.';
      }
      return error.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
  }
};

const normalizeAuthUser = (firebaseUser, profileData = null) => {
  if (!firebaseUser) {
    return null;
  }
  const email = profileData?.email || firebaseUser.email || '';
  const displayName =
    profileData?.displayName ||
    firebaseUser.displayName ||
    (email ? email.split('@')[0] : 'Người dùng');
  const avatar =
    profileData?.avatar ||
    firebaseUser.photoURL ||
    buildDefaultAvatar(displayName, email);

  return {
    uid: firebaseUser.uid,
    displayName,
    email,
    avatar,
  };
};

export const registerUser = async ({ fullName, email, password }) => {
  const trimmedName = (fullName || '').trim();
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!trimmedName) {
    throw new Error('Vui lòng nhập họ và tên.');
  }
  if (!normalizedEmail) {
    throw new Error('Vui lòng nhập địa chỉ email.');
  }
  if (!password || password.length < 6) {
    throw new Error('Mật khẩu phải có ít nhất 6 ký tự.');
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );
    const { user } = credential;
    const avatar = buildDefaultAvatar(trimmedName, normalizedEmail);

    await updateProfile(user, {
      displayName: trimmedName,
      photoURL: avatar,
    });

    const userRecord = {
      uid: user.uid,
      displayName: trimmedName,
      email: normalizedEmail,
      avatar,
      online: true,
      lastSeen: serverTimestamp(),
      createdAt: serverTimestamp(),
    };

    await set(ref(db, `users/${user.uid}`), userRecord);

    return normalizeAuthUser(user, userRecord);
  } catch (error) {
    const mappedError = new Error(mapAuthError(error));
    mappedError.code = error?.code;
    throw mappedError;
  }
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error('Vui lòng nhập địa chỉ email.');
  }
  if (!password) {
    throw new Error('Vui lòng nhập mật khẩu.');
  }

  try {
    const credential = await signInWithEmailAndPassword(
      auth,
      normalizedEmail,
      password,
    );
    const { user } = credential;

    let existingProfile = null;
    try {
      const snapshot = await get(ref(db, `users/${user.uid}`));
      if (snapshot.exists()) {
        existingProfile = snapshot.val();
      }
    } catch (_) {
      // Bỏ qua lỗi đọc hồ sơ phụ để không chặn luồng đăng nhập chính
    }

    const displayName =
      existingProfile?.displayName ||
      user.displayName ||
      normalizedEmail.split('@')[0];
    const avatar =
      existingProfile?.avatar ||
      user.photoURL ||
      buildDefaultAvatar(displayName, normalizedEmail);

    await update(ref(db, `users/${user.uid}`), {
      uid: user.uid,
      displayName,
      email: user.email || normalizedEmail,
      avatar,
      online: true,
      lastSeen: serverTimestamp(),
    });

    return normalizeAuthUser(user, {
      displayName,
      email: user.email || normalizedEmail,
      avatar,
    });
  } catch (error) {
    const mappedError = new Error(mapAuthError(error));
    mappedError.code = error?.code;
    throw mappedError;
  }
};

export const logoutUser = async uid => {
  const targetUid = uid || auth.currentUser?.uid;

  if (targetUid) {
    try {
      await update(ref(db, `users/${targetUid}`), {
        online: false,
        lastSeen: serverTimestamp(),
      });
    } catch (_) {
      // Vẫn tiếp tục signOut ngay cả khi thiết bị mất mạng tạm thời
    }
  }

  await signOut(auth);
};

export const subscribeAuthState = callback => {
  const unsubscribe = onAuthStateChanged(auth, firebaseUser => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    callback(normalizeAuthUser(firebaseUser));
  });

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe();
    }
  };
};
