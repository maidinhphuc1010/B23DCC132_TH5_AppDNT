/* eslint-env jest */
import React, { act } from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { AuthProvider } from '../src/context/AuthContext';
import { ChatScreen } from '../src/screens/chat/ChatScreen';
import { ContactsScreen } from '../src/screens/contacts/ContactsScreen';
import { HomeScreen } from '../src/screens/home/HomeScreen';
import { subscribeAuthState } from '../src/services/authService';
import {
  markConversationAsRead,
  sendMessage,
  subscribeConversations,
  subscribeMessages,
} from '../src/services/chatService';
import {
  startPresenceTracking,
  subscribeUserPresence,
} from '../src/services/presenceService';
import { subscribeContacts } from '../src/services/userService';

jest.mock('firebase/database', () => ({
  ref: jest.fn(),
  onValue: jest.fn(),
}));

jest.mock('../src/services/firebaseConfig', () => ({
  isFirebaseConfigured: () => true,
}));

jest.mock('../src/services/authService', () => ({
  subscribeAuthState: jest.fn(),
  loginUser: jest.fn(),
  registerUser: jest.fn(),
  logoutUser: jest.fn(),
}));

jest.mock('../src/services/presenceService', () => ({
  startPresenceTracking: jest.fn(),
  subscribeUserPresence: jest.fn(),
}));

jest.mock('../src/services/userService', () => {
  const actual = jest.requireActual('../src/services/userService');
  return {
    ...actual,
    subscribeContacts: jest.fn(),
  };
});

jest.mock('../src/services/chatService', () => ({
  getChatId: (a, b) => [a, b].sort().join('_'),
  subscribeConversations: jest.fn(),
  subscribeMessages: jest.fn(),
  markConversationAsRead: jest.fn(() => Promise.resolve()),
  sendMessage: jest.fn(() => Promise.resolve()),
}));

describe('Dọn dẹp realtime listeners khi unmount (Memory Leak Prevention)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('AuthProvider gọi unsubscribe cho cả AuthState và PresenceTracking khi unmount', async () => {
    const unsubAuth = jest.fn();
    const stopPresence = jest.fn();

    subscribeAuthState.mockImplementation(cb => {
      cb({
        uid: 'uid-logged-in',
        displayName: 'Test User',
        email: 'test@chat.vn',
        avatar: '',
      });
      return unsubAuth;
    });
    startPresenceTracking.mockReturnValue(stopPresence);

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AuthProvider>
          <React.Fragment />
        </AuthProvider>,
      );
    });

    expect(startPresenceTracking).toHaveBeenCalledWith('uid-logged-in');

    await act(async () => {
      renderer.unmount();
    });

    expect(unsubAuth).toHaveBeenCalledTimes(1);
    expect(stopPresence).toHaveBeenCalledTimes(1);
  });

  it('HomeScreen và ContactsScreen gọi unsubscribe đầy đủ khi rời màn hình', async () => {
    const unsubAuth = jest.fn();
    const stopPresence = jest.fn();
    const unsubConversations = jest.fn();
    const unsubContacts = jest.fn();

    subscribeAuthState.mockImplementation(cb => {
      cb({
        uid: 'uid-main',
        displayName: 'Main User',
        email: 'main@chat.vn',
      });
      return unsubAuth;
    });
    startPresenceTracking.mockReturnValue(stopPresence);
    subscribeConversations.mockImplementation((_uid, cb) => {
      cb([]);
      return unsubConversations;
    });
    subscribeContacts.mockImplementation((_uid, cb) => {
      cb([]);
      return unsubContacts;
    });

    const mockNavigation = { navigate: jest.fn(), goBack: jest.fn() };
    let renderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AuthProvider>
          <HomeScreen navigation={mockNavigation} />
          <ContactsScreen navigation={mockNavigation} />
        </AuthProvider>,
      );
    });

    await act(async () => {
      renderer.unmount();
    });

    expect(unsubConversations).toHaveBeenCalledTimes(1);
    expect(unsubContacts).toHaveBeenCalledTimes(1);
  });

  it('ChatScreen đánh dấu đã đọc khi mở phòng, vô hiệu hóa gửi tin khoảng trắng và dọn sạch 2 listener khi unmount', async () => {
    const unsubMessages = jest.fn();
    const unsubPresence = jest.fn();

    subscribeAuthState.mockImplementation(cb => {
      cb({
        uid: 'uid-alice',
        displayName: 'Alice',
        email: 'alice@chat.vn',
      });
      return jest.fn();
    });
    startPresenceTracking.mockReturnValue(jest.fn());

    subscribeUserPresence.mockImplementation((_uid, cb) => {
      cb({
        uid: 'uid-bob',
        online: true,
        lastSeen: Date.now(),
        displayName: 'Bob',
      });
      return unsubPresence;
    });

    subscribeMessages.mockImplementation((_chatId, cb) => {
      cb([
        {
          id: 'm1',
          senderId: 'uid-bob',
          receiverId: 'uid-alice',
          text: 'Chào Alice!',
          createdAt: Date.now(),
        },
      ]);
      return unsubMessages;
    });

    const mockRoute = {
      params: {
        receiverId: 'uid-bob',
        receiverName: 'Bob',
      },
    };
    const mockNavigation = { goBack: jest.fn() };

    let renderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <AuthProvider>
          <ChatScreen route={mockRoute} navigation={mockNavigation} />
        </AuthProvider>,
      );
    });

    expect(markConversationAsRead).toHaveBeenCalledWith(
      'uid-alice_uid-bob',
      'uid-alice',
    );

    const input = renderer.root.findByProps({ testID: 'chat-message-input' });
    await act(async () => {
      input.props.onChangeText('     ');
    });

    const sendButton = renderer.root.findByProps({
      testID: 'chat-send-button',
    });
    expect(sendButton.props.disabled).toBe(true);
    expect(sendMessage).not.toHaveBeenCalled();

    await act(async () => {
      renderer.unmount();
    });

    expect(unsubMessages).toHaveBeenCalledTimes(1);
    expect(unsubPresence).toHaveBeenCalledTimes(1);
  });
});
