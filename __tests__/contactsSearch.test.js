/* eslint-env jest */
import { onValue } from 'firebase/database';
import { filterContacts, subscribeContacts } from '../src/services/userService';

jest.mock('../src/services/firebaseConfig', () => ({
  db: { __mockDb: true },
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn((_db, path) => ({ path })),
  onValue: jest.fn(),
}));

const SAMPLE_USERS = [
  {
    uid: 'me-001',
    displayName: 'Tài Khoản Hiện Tại',
    email: 'me@ptit.edu.vn',
    online: true,
  },
  {
    uid: 'u-002',
    displayName: 'Nguyễn Minh Quân',
    email: 'quan.nguyen@ptit.edu.vn',
    online: true,
  },
  {
    uid: 'u-003',
    displayName: 'Phạm Thu Hà',
    email: 'ha.pham@gmail.com',
    online: false,
  },
  {
    uid: 'u-004',
    displayName: 'Đặng Quốc Bảo',
    email: 'bao.dang@company.vn',
    online: true,
  },
];

describe('Danh bạ & tìm kiếm liên hệ (userService)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('filterContacts luôn loại bỏ người dùng đang đăng nhập', () => {
    const filtered = filterContacts(SAMPLE_USERS, '', 'me-001');
    expect(filtered.map(u => u.uid)).not.toContain('me-001');
    expect(filtered).toHaveLength(3);
  });

  it('filterContacts tìm kiếm tức thì theo tên (có dấu và không dấu) và theo email', () => {
    const byAccentlessName = filterContacts(
      SAMPLE_USERS,
      'dang quoc bao',
      'me-001',
    );
    expect(byAccentlessName).toHaveLength(1);
    expect(byAccentlessName[0].uid).toBe('u-004');

    const byPartialEmail = filterContacts(SAMPLE_USERS, 'ha.pham@', 'me-001');
    expect(byPartialEmail).toHaveLength(1);
    expect(byPartialEmail[0].displayName).toBe('Phạm Thu Hà');
  });

  it('subscribeContacts lọc bản thân, ưu tiên Online lên đầu và hủy đăng ký sạch sẽ', () => {
    const mockUnsub = jest.fn();
    let valueCallback;
    onValue.mockImplementationOnce((_ref, cb) => {
      valueCallback = cb;
      return mockUnsub;
    });

    const onContacts = jest.fn();
    const unsubscribe = subscribeContacts('me-001', onContacts);

    valueCallback({
      val: () => ({
        'me-001': SAMPLE_USERS[0],
        'u-002': SAMPLE_USERS[1],
        'u-003': SAMPLE_USERS[2],
        'u-004': SAMPLE_USERS[3],
      }),
    });

    const contacts = onContacts.mock.calls[0][0];
    expect(contacts).toHaveLength(3);
    expect(contacts.some(item => item.uid === 'me-001')).toBe(false);
    // Hai người dùng online đứng trước người dùng offline
    expect(contacts[0].online).toBe(true);
    expect(contacts[1].online).toBe(true);
    expect(contacts[2].online).toBe(false);

    unsubscribe();
    expect(mockUnsub).toHaveBeenCalledTimes(1);
  });
});
