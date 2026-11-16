import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';
import { formatMessageTime } from '../../utils/dateUtils';

export const MessageBubble = ({ message, isOwn }) => {
  return (
    <View
      testID={`message-bubble-${message.id}`}
      style={[
        styles.row,
        isOwn ? styles.rowOwn : styles.rowOther,
      ]}>
      <View
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}>
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {message.text}
        </Text>
        <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>
          {formatMessageTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
  },
  rowOwn: {
    justifyContent: 'flex-end',
  },
  rowOther: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleOwn: {
    backgroundColor: colors.bubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: colors.bubbleReceived,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: {
    ...typography.body,
  },
  textOwn: {
    color: colors.bubbleSentText,
  },
  textOther: {
    color: colors.bubbleReceivedText,
  },
  time: {
    ...typography.small,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },
  timeOwn: {
    color: 'rgba(255, 255, 255, 0.78)',
  },
  timeOther: {
    color: colors.textMuted,
  },
});
