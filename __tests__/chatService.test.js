/* eslint-env jest */
import {
  get,
  increment,
  onValue,
  push,
  serverTimestamp,
  update,
} from 'firebase/database';
import {
  getChatId,
  markConversationAsRead,
  sendMessage,
  subscribeConversations,
} from '../src/services/chatService';

jest.mock('../src/services/firebaseConfig', () => ({
  db: { __mockDb: true },
}));

jest.mock('firebase/database', () => ({
  ref: jest.fn((_db, path) => ({ path: path || '' })),
  push: jest.fn(() => ({ key: 'msg-generated-001' })),
  update: jest.fn(),
  get: jest.fn(),
  query: jest.fn(target => target),
  orderByChild: jest.fn(),
  onValue: jest.fn(),
  increment: jest.fn(delta => ({ __increment: delta })),
  serverTimestamp: jest.fn(() => 'MOCK_TS'),
}));

describe('chatService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getChatId tạo định danh phòng chat bất biến theo thứ tự 2 UID', () => {
    expect(getChatId('uid_beta', 'uid_alpha')).toBe('uid_alpha_uid_beta');
    expect(getChatId('uid_alpha', 'uid_beta')).toBe('uid_alpha_uid_beta');
    expect(() => getChatId('', 'uid_beta')).toThrow();
  });

  it('sendMessage chặn hoàn toàn chuỗi rỗng hoặc chỉ chứa khoảng trắng', async () => {
    await expect(
      sendMessage({
        senderId: 'uid_a',
        receiverId: 'uid_b',
        text: '',
      }),
    ).rejects.toThrow('Nội dung tin nhắn không được để trống.');

    await expect(
      sendMessage({
        senderId: 'uid_a',
        receiverId: 'uid_b',
        text: '   \n\t  ',
      }),
    ).rejects.toThrow('Nội dung tin nhắn không được để trống.');

    expect(push).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('sendMessage ghi nguyên tử vào messages và conversations kèm increment unreadCount', async () => {
    update.mockResolvedValueOnce();

    const result = await sendMessage({
      senderId: 'uid_b',
      receiverId: 'uid_a',
      text: '  Xin chào buổi sáng!  ',
    });

    const expectedChatId = 'uid_a_uid_b';
    expect(result.chatId).toBe(expectedChatId);
    expect(result.text).toBe('Xin chào buổi sáng!');
    expect(increment).toHaveBeenCalledWith(1);
    expect(serverTimestamp).toHaveBeenCalled();

    expect(update).toHaveBeenCalledWith(
      { path: '' },
      expect.objectContaining({
        [`messages/${expectedChatId}/msg-generated-001`]: expect.objectContaining(
          {
            id: 'msg-generated-001',
            senderId: 'uid_b',
            receiverId: 'uid_a',
            text: 'Xin chào buổi sáng!',
            createdAt: 'MOCK_TS',
          },
        ),
        [`conversations/${expectedChatId}/lastMessage`]: 'Xin chào buổi sáng!',
        [`conversations/${expectedChatId}/lastMessageTime`]: 'MOCK_TS',
        [`conversations/${expectedChatId}/lastSenderId`]: 'uid_b',
        [`conversations/${expectedChatId}/unreadCount/uid_b`]: 0,
        [`conversations/${expectedChatId}/unreadCount/uid_a`]: {
          __increment: 1,
        },
      }),
    );
  });

  it('subscribeConversations lọc đúng cuộc trò chuyện của mình và sắp xếp mới nhất lên đầu', () => {
    const unsubConv = jest.fn();
    const unsubUsers = jest.fn();
    const listeners = {};

    onValue.mockImplementation((targetRef, cb) => {
      listeners[targetRef.path] = cb;
      return targetRef.path === 'conversations' ? unsubConv : unsubUsers;
    });

    const onUpdate = jest.fn();
    const unsubscribe = subscribeConversations('uid_me', onUpdate);

    listeners.users({
      val: () => ({
        uid_old: {
          uid: 'uid_old',
          displayName: 'Bạn Cũ',
          email: 'cu@test.com',
          online: false,
        },
        uid_new: {
          uid: 'uid_new',
          displayName: 'Bạn Mới',
          email: 'moi@test.com',
          online: true,
        },
      }),
    });

    listeners.conversations({
      val: () => ({
        uid_me_uid_old: {
          id: 'uid_me_uid_old',
          participants: { uid_me: true, uid_old: true },
          lastMessage: 'Hẹn gặp tuần sau',
          lastMessageTime: 1000,
          lastSenderId: 'uid_old',
          unreadCount: { uid_me: 1, uid_old: 0 },
        },
        uid_me_uid_new: {
          id: 'uid_me_uid_new',
          participants: { uid_me: true, uid_new: true },
          lastMessage: 'Tin nhắn vừa gửi xong',
          lastMessageTime: 5000,
          lastSenderId: 'uid_new',
          unreadCount: { uid_me: 3, uid_new: 0 },
        },
        uid_other1_uid_other2: {
          id: 'uid_other1_uid_other2',
          participants: { uid_other1: true, uid_other2: true },
          lastMessage: 'Không thuộc về uid_me',
          lastMessageTime: 9999,
        },
      }),
    });

    expect(onUpdate).toHaveBeenCalled();
    const latestList = onUpdate.mock.calls[onUpdate.mock.calls.length - 1][0];
    expect(latestList).toHaveLength(2);
    expect(latestList[0].chatId).toBe('uid_me_uid_new');
    expect(latestList[0].receiverName).toBe('Bạn Mới');
    expect(latestList[0].unreadCount).toBe(3);
    expect(latestList[1].chatId).toBe('uid_me_uid_old');

    unsubscribe();
    expect(unsubConv).toHaveBeenCalledTimes(1);
    expect(unsubUsers).toHaveBeenCalledTimes(1);
  });

  it('markConversationAsRead đưa số tin chưa đọc về 0 khi có tin chưa đọc', async () => {
    get.mockResolvedValueOnce({
      exists: () => true,
      val: () => ({
        unreadCount: { uid_me: 4 },
      }),
    });
    update.mockResolvedValueOnce();

    await markConversationAsRead('uid_a_uid_me', 'uid_me');

    expect(update).toHaveBeenCalledWith(
      { path: '' },
      {
        'conversations/uid_a_uid_me/unreadCount/uid_me': 0,
      },
    );
  });
});
