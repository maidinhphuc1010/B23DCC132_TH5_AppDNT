import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const ChatInputBar = ({
  value,
  onChangeText,
  onSend,
  sending = false,
}) => {
  const canSend = Boolean(value && value.trim()) && !sending;

  return (
    <View style={styles.container}>
      <View style={styles.inputBox}>
        <TextInput
          testID="chat-message-input"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={2000}
        />
      </View>

      <TouchableOpacity
        testID="chat-send-button"
        activeOpacity={0.8}
        disabled={!canSend}
        onPress={onSend}
        style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}>
        {sending ? (
          <ActivityIndicator size="small" color={colors.textInverse} />
        ) : (
          <Text style={styles.sendText}>Gửi</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    maxHeight: 120,
    minHeight: 44,
    justifyContent: 'center',
  },
  input: {
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.xs + 2,
  },
  sendBtn: {
    marginLeft: spacing.sm,
    height: 44,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.offline,
    opacity: 0.55,
  },
  sendText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
});
