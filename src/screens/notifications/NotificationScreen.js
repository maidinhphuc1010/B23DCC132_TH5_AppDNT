import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/common/Avatar';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingView } from '../../components/common/LoadingView';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../navigation/routes';
import { subscribeConversations } from '../../services/chatService';
import { colors, radius, spacing, typography } from '../../theme';
import { formatConversationTime } from '../../utils/dateUtils';

export const NotificationScreen = ({ navigation }) => {
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
      list => {
        setConversations(list);
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

  const unreadNotifications = useMemo(
    () => conversations.filter(item => Number(item.unreadCount) > 0),
    [conversations],
  );

  const handleOpenNotification = item => {
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
        <Text style={styles.headerTitle}>Thông báo</Text>
        <Text style={styles.headerSubtitle}>
          Cập nhật tin nhắn mới và trạng thái đồng bộ thời gian thực
        </Text>
      </View>

      <View style={styles.systemCard}>
        <View style={styles.systemIconBox}>
          <Text style={styles.systemIcon}>🛡️</Text>
        </View>
        <View style={styles.systemInfo}>
          <Text style={styles.systemTitle}>
            Kết nối Realtime Database đang hoạt động
          </Text>
          <Text style={styles.systemDesc}>
            Tài khoản {user?.email || ''} đang được đồng bộ tin nhắn và trạng
            thái trực tuyến tự động.
          </Text>
        </View>
      </View>

      {loading ? (
        <LoadingView message="Đang kiểm tra thông báo mới..." />
      ) : (
        <FlatList
          data={unreadNotifications}
          keyExtractor={item => item.chatId}
          renderItem={({ item }) => (
            <TouchableOpacity
              testID={`notification-item-${item.chatId}`}
              activeOpacity={0.75}
              onPress={() => handleOpenNotification(item)}
              style={styles.notificationItem}>
              <Avatar
                uri={item.receiverAvatar}
                name={item.receiverName}
                size="md"
                online={item.receiverOnline}
                showStatus
              />
              <View style={styles.notificationBody}>
                <View style={styles.topRow}>
                  <Text numberOfLines={1} style={styles.senderName}>
                    {item.receiverName}
                  </Text>
                  <Text style={styles.timestamp}>
                    {formatConversationTime(item.lastMessageTime)}
                  </Text>
                </View>
                <Text numberOfLines={2} style={styles.messageText}>
                  Đã gửi {item.unreadCount} tin nhắn chưa đọc: &quot;
                  {item.lastMessage}&quot;
                </Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={
            unreadNotifications.length === 0
              ? styles.emptyListContent
              : styles.listContent
          }
          ListEmptyComponent={
            <EmptyState
              icon="🔔"
              title="Bạn đã đọc hết mọi tin nhắn"
              description="Khi có tin nhắn mới chưa đọc từ bạn bè, thông báo sẽ xuất hiện tức thì tại đây."
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
  systemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  systemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  systemIcon: {
    fontSize: 18,
  },
  systemInfo: {
    flex: 1,
  },
  systemTitle: {
    ...typography.captionBold,
    color: colors.primaryDark,
  },
  systemDesc: {
    ...typography.small,
    color: colors.textSecondary,
    marginTop: 2,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notificationBody: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  senderName: {
    flex: 1,
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  timestamp: {
    ...typography.small,
    color: colors.primary,
    fontWeight: '600',
  },
  messageText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
});
