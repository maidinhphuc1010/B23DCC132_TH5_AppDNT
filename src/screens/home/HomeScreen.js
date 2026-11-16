import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConversationItem } from '../../components/chat/ConversationItem';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingView } from '../../components/common/LoadingView';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../navigation/routes';
import { subscribeConversations } from '../../services/chatService';
import { colors, radius, spacing, typography } from '../../theme';

export const HomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeConversations(
      user.uid,
      nextList => {
        setConversations(nextList);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const totalUnread = useMemo(
    () =>
      conversations.reduce(
        (sum, conv) => sum + (Number(conv.unreadCount) || 0),
        0,
      ),
    [conversations],
  );

  const handleOpenChat = item => {
    navigation.navigate(ROUTES.CHAT, {
      chatId: item.chatId,
      receiverId: item.receiverId,
      receiverName: item.receiverName,
      receiverAvatar: item.receiverAvatar,
      receiverEmail: item.receiverEmail,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Tin nhắn</Text>
          <Text style={styles.headerSubtitle}>
            Trò chuyện thời gian thực với bạn bè
          </Text>
        </View>
        {totalUnread > 0 ? (
          <View style={styles.unreadSummaryChip}>
            <Text style={styles.unreadSummaryText}>
              {totalUnread} chưa đọc
            </Text>
          </View>
        ) : null}
      </View>

      {loading ? (
        <LoadingView message="Đang đồng bộ cuộc trò chuyện..." />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={item => item.chatId}
          renderItem={({ item }) => (
            <ConversationItem
              item={item}
              currentUid={user?.uid}
              onPress={handleOpenChat}
            />
          )}
          contentContainerStyle={
            conversations.length === 0 ? styles.emptyListContent : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="💬"
              title="Chưa có cuộc trò chuyện nào"
              description="Hãy chuyển sang tab Danh bạ để tìm người dùng và bắt đầu nhắn tin."
              actionLabel="Mở Danh bạ"
              onAction={() => navigation.navigate(ROUTES.CONTACTS_TAB)}
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  headerSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  unreadSummaryChip: {
    backgroundColor: colors.dangerLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  unreadSummaryText: {
    ...typography.captionBold,
    color: colors.dangerText,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
