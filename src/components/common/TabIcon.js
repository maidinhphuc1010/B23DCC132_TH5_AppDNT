import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../../theme';

const ICON_MAP = {
  home: '💬',
  contacts: '👥',
  notifications: '🔔',
  settings: '⚙️',
};

export const TabIcon = ({ name, focused }) => {
  const glyph = ICON_MAP[name] || '•';
  return (
    <View style={[styles.badge, focused && styles.badgeFocused]}>
      <Text style={[styles.glyph, focused && styles.glyphFocused]}>
        {glyph}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    width: 36,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeFocused: {
    backgroundColor: colors.primaryLight,
  },
  glyph: {
    fontSize: 16,
    opacity: 0.72,
  },
  glyphFocused: {
    opacity: 1,
  },
});
