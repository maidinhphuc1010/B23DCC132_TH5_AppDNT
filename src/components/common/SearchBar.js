import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm theo tên hoặc email...',
  testID = 'contacts-search-input',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
      />
      {value ? (
        <TouchableOpacity
          testID="clear-search-button"
          activeOpacity={0.7}
          onPress={() => onChangeText('')}
          style={styles.clearBtn}>
          <Text style={styles.clearText}>✕</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    minHeight: 46,
  },
  searchIcon: {
    fontSize: 20,
    color: colors.textMuted,
    marginRight: spacing.sm,
    lineHeight: 22,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
    paddingVertical: spacing.sm,
  },
  clearBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  clearText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '700',
  },
});
