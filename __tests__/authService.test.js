/* eslint-env jest */
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { get, ref, serverTimestamp, set, update } from 'firebase/database';
import {
  loginUser,
  logoutUser,
  mapAuthError,
  registerUser,
  subscribeAuthState,
} from '../src/services/authService';

jest.mock('../src/services/firebaseConfig', () => ({
  auth: { currentUser: { uid: 'uid-current' } },
  db: { __mockDb: true },
  isFirebaseConfigured: () => true,
}));

jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  updateProfile: jest.fn(),
  onAuthStateChanged: jest.fn(),
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn((_db, path) => ({ path: path || '' })),
  set: jest.fn(),
  update: jest.fn(),
  get: jest.fn(),
  serverTimestamp: jest.fn(() => 'MOCK_SERVER_TIMESTAMP'),
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('registerUser tạo tài khoản, cập nhật hồ sơ và lưu users/{uid} với online: true', async () => {
    const fakeUser = {
      uid: 'user-101',
      email: 'an.nguyen@test.com',
    };
    createUserWithEmailAndPassword.mockResolvedValueOnce({ user: fakeUser });
    updateProfile.mockResolvedValueOnce();
    set.mockResolvedValueOnce();

    const result = await registerUser({
      fullName: '  Nguyễn Văn An  ',
      email: '  An.Nguyen@Test.com ',
      password: 'password123',
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'an.nguyen@test.com',
      'password123',
    );
    expect(updateProfile).toHaveBeenCalledWith(
      fakeUser,
      expect.objectContaining({
        displayName: 'Nguyễn Văn An',
      }),
    );
    expect(ref).toHaveBeenCalledWith(expect.anything(), 'users/user-101');
    expect(set).toHaveBeenCalledWith(
      { path: 'users/user-101' },
      expect.objectContaining({
        uid: 'user-101',
        displayName: 'Nguyễn Văn An',
        email: 'an.nguyen@test.com',
        online: true,
        lastSeen: 'MOCK_SERVER_TIMESTAMP',
      }),
    );
    expect(serverTimestamp).toHaveBeenCalled();
    expect(result).toEqual(
      expect.objectContaining({
        uid: 'user-101',
        displayName: 'Nguyễn Văn An',
        email: 'an.nguyen@test.com',
      }),
    );
  });

  it('loginUser đăng nhập và cập nhật trạng thái online: true trên Realtime Database', async () => {
    const fakeUser = {
      uid: 'user-202',
      displayName: 'Trần Thị Bình',
      email: 'binh@test.com',
      photoURL: 'https://avatar.example/binh.png',
    };
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: fakeUser });
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({
        displayName: 'Trần Thị Bình',
        avatar: 'https://avatar.example/binh.png',
      }),
    });
    update.mockResolvedValueOnce();

    const loggedIn = await loginUser({
      email: 'Binh@test.com',
      password: 'secretPassword',
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      'binh@test.com',
      'secretPassword',
    );
    expect(update).toHaveBeenCalledWith(
      { path: 'users/user-202' },
      expect.objectContaining({
        uid: 'user-202',
        online: true,
        lastSeen: 'MOCK_SERVER_TIMESTAMP',
      }),
    );
    expect(loggedIn.uid).toBe('user-202');
  });

  it('logoutUser cập nhật online: false TRƯỚC KHI gọi signOut', async () => {
    const callOrder = [];
    update.mockImplementationOnce(async () => {
      callOrder.push('updateOffline');
    });
    signOut.mockImplementationOnce(async () => {
      callOrder.push('signOut');
    });

    await logoutUser('user-202');

    expect(update).toHaveBeenCalledWith(
      { path: 'users/user-202' },
      {
        online: false,
        lastSeen: 'MOCK_SERVER_TIMESTAMP',
      },
    );
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(callOrder).toEqual(['updateOffline', 'signOut']);
  });

  it('subscribeAuthState trả về thông tin người dùng chuẩn hóa và gọi unsubscribe đúng cách', () => {
    const mockUnsub = jest.fn();
    let authCallback;
    onAuthStateChanged.mockImplementationOnce((_auth, cb) => {
      authCallback = cb;
      return mockUnsub;
    });

    const listener = jest.fn();
    const unsubscribe = subscribeAuthState(listener);

    authCallback({
      uid: 'u-999',
      displayName: 'Lê Hoàng',
      email: 'hoang@test.com',
      photoURL: '',
    });

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        uid: 'u-999',
        displayName: 'Lê Hoàng',
        email: 'hoang@test.com',
      }),
    );

    authCallback(null);
    expect(listener).toHaveBeenLastCalledWith(null);

    unsubscribe();
    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });

  it('mapAuthError chuyển đổi đầy đủ mã lỗi Firebase sang tiếng Việt rõ ràng', () => {
    expect(mapAuthError({ code: 'auth/invalid-credential' })).toContain(
      'không chính xác',
    );
    expect(mapAuthError({ code: 'auth/wrong-password' })).toContain('Mật khẩu');
    expect(mapAuthError({ code: 'auth/email-already-in-use' })).toContain(
      'đã được sử dụng',
    );
    expect(mapAuthError({ code: 'auth/weak-password' })).toContain('6 ký tự');
    expect(mapAuthError({ code: 'auth/invalid-email' })).toContain('email');
    expect(mapAuthError({ code: 'auth/network-request-failed' })).toContain(
      'kết nối mạng',
    );
  });
});
