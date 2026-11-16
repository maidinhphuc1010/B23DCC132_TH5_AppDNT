import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const AppButton = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
  testID,
}) => {
  const isDisabled = disabled || loading;
  const variantButtonStyle = styles[`btn_${variant}`] || styles.btn_primary;
  const variantTextStyle = styles[`text_${variant}`] || styles.text_primary;

  const indicatorColor =
    variant === 'outline' || variant === 'secondary'
      ? colors.primary
      : colors.textInverse;

  return (
    <TouchableOpacity
      testID={testID}
      activeOpacity={0.8}
      disabled={isDisabled}
      onPress={onPress}
      style={[
        styles.button,
        variantButtonStyle,
        isDisabled && styles.buttonDisabled,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <Text style={[styles.text, variantTextStyle]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  btn_primary: {
    backgroundColor: colors.primary,
  },
  btn_secondary: {
    backgroundColor: colors.primaryLight,
  },
  btn_outline: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  btn_danger: {
    backgroundColor: colors.danger,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    ...typography.bodyBold,
  },
  text_primary: {
    color: colors.textInverse,
  },
  text_secondary: {
    color: colors.primary,
  },
  text_outline: {
    color: colors.primary,
  },
  text_danger: {
    color: colors.textInverse,
  },
});
