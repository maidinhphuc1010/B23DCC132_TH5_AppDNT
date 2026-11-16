import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatInputBar } from '../../components/chat/ChatInputBar';
import { MessageBubble } from '../../components/chat/MessageBubble';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingView } from '../../components/common/LoadingView';
import { useAuth } from '../../context/AuthContext';
import {
  getChatId,
  markConversationAsRead,
  sendMessage,
  subscribeMessages,
} from '../../services/chatService';
import { subscribeUserPresence } from '../../services/presenceService';
import { colors, spacing, typography } from '../../theme';
import { formatLastSeen } from '../../utils/dateUtils';

export const ChatScreen = ({ route, navigation }) => {
  const { user } = useAuth();
  const params = route?.params || {};
  const {
    receiverId = '',
    receiverName: initialName = 'Người dùng',
    receiverAvatar: initialAvatar = '',
    chatId: routeChatId = '',
  } = params;

  const chatId = useMemo(() => {
    if (routeChatId) {
      return routeChatId;
    }
    if (user?.uid && receiverId) {
      return getChatId(user.uid, receiverId);
    }
    return '';
  }, [routeChatId, user?.uid, receiverId]);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const [partnerPresence, setPartnerPresence] = useState({
    online: false,
    lastSeen: null,
    displayName: initialName,
    avatar: initialAvatar,
  });

  const flatListRef = useRef(null);

  const scrollToLatest = useCallback((animated = true) => {
    if (flatListRef.current) {
      try {
        flatListRef.current.scrollToEnd({ animated });
      } catch (_) {
        // Bỏ qua nếu danh sách rỗng hoặc đang hủy mount
      }
    }
  }, []);

  useEffect(() => {
    if (!receiverId) {
      return undefined;
    }

    const unsubscribePresence = subscribeUserPresence(receiverId, presence => {
      setPartnerPresence(prev => ({
        online: Boolean(presence.online),
        lastSeen: presence.lastSeen,
        displayName: presence.displayName || prev.displayName || initialName,
        avatar: presence.avatar || prev.avatar || initialAvatar,
      }));
    });

    return () => {
      if (typeof unsubscribePresence === 'function') {
        unsubscribePresence();
      }
    };
  }, [receiverId, initialName, initialAvatar]);

  useEffect(() => {
    if (!chatId || !user?.uid) {
      setMessages([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    markConversationAsRead(chatId, user.uid).catch(() => {});

    const unsubscribeMessages = subscribeMessages(
      chatId,
      nextMessages => {
        setMessages(nextMessages);
        setLoading(false);

        const lastItem = nextMessages[nextMessages.length - 1];
        if (lastItem && lastItem.senderId !== user.uid) {
          markConversationAsRead(chatId, user.uid).catch(() => {});
        }
      },
      () => {
        setLoading(false);
      },
    );

    return () => {
      if (typeof unsubscribeMessages === 'function') {
        unsubscribeMessages();
      }
    };
  }, [chatId, user?.uid]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToLatest(true);
    }
  }, [messages.length, scrollToLatest]);

  const handleSend = async () => {
    const trimmed = inputText.trim();
    if (!trimmed || sending || !user?.uid || !receiverId) {
      return;
    }

    setSendError('');
    setSending(true);
    setInputText('');

    try {
      await sendMessage({
        chatId,
        senderId: user.uid,
        receiverId,
        text: trimmed,
      });
      scrollToLatest(true);
    } catch (error) {
      setInputText(trimmed);
      setSendError(error?.message || 'Gửi tin nhắn thất bại. Vui lòng thử lại.');
    } finally {
      setSending(false);
    }
  };

  const displayTitle = partnerPresence.displayName || initialName;
  const displayAvatar = partnerPresence.avatar || initialAvatar;
  const statusSubtitle = formatLastSeen(
    partnerPresence.online,
    partnerPresence.lastSeen,
  );

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          testID="chat-back-button"
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <Avatar
          uri={displayAvatar}
          name={displayTitle}
          size="sm"
          online={partnerPresence.online}
          showStatus
        />

        <View style={styles.headerInfo}>
          <Text numberOfLines={1} style={styles.headerName}>
            {displayTitle}
          </Text>
          <View style={styles.presenceRow}>
            <View
              style={[
                styles.headerDot,
                partnerPresence.online
                  ? styles.headerDotOnline
                  : styles.headerDotOffline,
              ]}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.headerStatus,
                partnerPresence.online && styles.headerStatusOnline,
              ]}>
              {statusSubtitle}
            </Text>
          </View>
        </View>
      </View>

      {sendError ? (
        <View style={styles.errorBar}>
          <Text style={styles.errorBarText}>{sendError}</Text>
        </View>
      ) : null}

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {loading ? (
          <LoadingView message="Đang tải tin nhắn..." />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                isOwn={item.senderId === user?.uid}
              />
            )}
            contentContainerStyle={
              messages.length === 0
                ? styles.emptyChatContent
                : styles.messagesContent
            }
            onContentSizeChange={() => {
              if (messages.length > 0) {
                scrollToLatest(false);
              }
            }}
            ListEmptyComponent={
              <EmptyState
                icon="👋"
                title={`Chào ${displayTitle}!`}
                description="Hãy gửi lời chào đầu tiên để bắt đầu cuộc trò chuyện thời gian thực."
              />
            }
          />
        )}

        <ChatInputBar
          value={inputText}
          onChangeText={text => {
            setInputText(text);
            if (sendError) {
              setSendError('');
            }
          }}
          onSend={handleSend}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  backIcon: {
    fontSize: 22,
    color: colors.textPrimary,
    fontWeight: '600',
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm + 2,
  },
  headerName: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  presenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  headerDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  headerDotOnline: {
    backgroundColor: colors.online,
  },
  headerDotOffline: {
    backgroundColor: colors.offline,
  },
  headerStatus: {
    ...typography.small,
    color: colors.textSecondary,
  },
  headerStatusOnline: {
    color: colors.online,
    fontWeight: '600',
  },
  errorBar: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  errorBarText: {
    ...typography.caption,
    color: colors.dangerText,
  },
  messagesContent: {
    paddingVertical: spacing.md,
  },
  emptyChatContent: {
    flexGrow: 1,
  },
});
