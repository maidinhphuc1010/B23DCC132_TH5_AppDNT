import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { formatLastSeen } from '../../utils/dateUtils';
import { Avatar } from '../common/Avatar';

export const ContactItem = ({ item, onPress }) => {
  const statusLabel = formatLastSeen(item.online, item.lastSeen);

  return (
    <TouchableOpacity
      testID={`contact-item-${item.uid}`}
      activeOpacity={0.75}
      onPress={() => onPress(item)}
      style={styles.container}>
      <Avatar
        uri={item.avatar}
        name={item.displayName}
        size="md"
        online={item.online}
        showStatus
      />

      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {item.displayName}
        </Text>
        <Text numberOfLines={1} style={styles.email}>
          {item.email}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.statusText,
            item.online ? styles.statusOnline : styles.statusOffline,
          ]}>
          {statusLabel}
        </Text>
      </View>

      <View style={styles.chatChip}>
        <Text style={styles.chatChipText}>Nhắn tin</Text>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  name: {
    ...typography.bodyBold,
    color: colors.textPrimary,
  },
  email: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 1,
  },
  statusText: {
    ...typography.small,
    marginTop: 3,
  },
  statusOnline: {
    color: colors.online,
    fontWeight: '600',
  },
  statusOffline: {
    color: colors.textMuted,
  },
  chatChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.pill,
  },
  chatChipText: {
    ...typography.captionBold,
    color: colors.primary,
  },
});
