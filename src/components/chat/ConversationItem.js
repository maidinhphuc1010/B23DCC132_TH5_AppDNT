import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { formatConversationTime } from '../../utils/dateUtils';
import { Avatar } from '../common/Avatar';

export const ConversationItem = ({ item, currentUid, onPress }) => {
  const hasUnread = Number(item.unreadCount) > 0;
  const isSentByMe = Boolean(currentUid && item.lastSenderId === currentUid);
  const previewPrefix = isSentByMe ? 'Bạn: ' : '';
  const previewText = item.lastMessage
    ? `${previewPrefix}${item.lastMessage}`
    : 'Bắt đầu cuộc trò chuyện';

  const badgeLabel = item.unreadCount > 99 ? '99+' : String(item.unreadCount);

  return (
    <TouchableOpacity
      testID={`conversation-item-${item.chatId}`}
      activeOpacity={0.75}
      onPress={() => onPress(item)}
      style={[styles.container, hasUnread && styles.containerUnread]}>
      <Avatar
        uri={item.receiverAvatar}
        name={item.receiverName}
        size="md"
        online={item.receiverOnline}
        showStatus
      />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text
            numberOfLines={1}
            style={[styles.name, hasUnread && styles.nameUnread]}>
            {item.receiverName}
          </Text>
          <Text style={[styles.time, hasUnread && styles.timeUnread]}>
            {formatConversationTime(item.lastMessageTime)}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          <Text
            numberOfLines={1}
            style={[styles.preview, hasUnread && styles.previewUnread]}>
            {previewText}
          </Text>
          {hasUnread ? (
            <View testID={`unread-badge-${item.chatId}`} style={styles.badge}>
              <Text style={styles.badgeText}>{badgeLabel}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  containerUnread: {
    backgroundColor: '#F8FAFF',
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  name: {
    flex: 1,
    ...typography.bodyBold,
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  nameUnread: {
    fontWeight: '700',
  },
  time: {
    ...typography.small,
    color: colors.textMuted,
  },
  timeUnread: {
    color: colors.primary,
    fontWeight: '700',
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preview: {
    flex: 1,
    ...typography.caption,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  previewUnread: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: radius.pill,
    backgroundColor: colors.badge,
    paddingHorizontal: spacing.xs + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textInverse,
  },
});
