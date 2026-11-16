import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';

const getInitials = name => {
  const cleaned = (name || '').trim();
  if (!cleaned) {
    return 'U';
  }
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  const first = parts[0][0] || '';
  const last = parts[parts.length - 1][0] || '';
  return `${first}${last}`.toUpperCase();
};

export const Avatar = ({
  uri,
  name = '',
  size = 'md',
  online = false,
  showStatus = false,
}) => {
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageError(false);
  }, [uri]);

  const containerSizeStyle = styles[`size_${size}`] || styles.size_md;
  const textSizeStyle = styles[`text_${size}`] || styles.text_md;
  const dotSizeStyle = styles[`dot_${size}`] || styles.dot_md;
  const shouldRenderImage = Boolean(uri && !imageError);

  return (
    <View style={[styles.wrapper, containerSizeStyle]}>
      {shouldRenderImage ? (
        <Image
          source={{ uri }}
          style={[styles.image, containerSizeStyle]}
          onError={() => setImageError(true)}
        />
      ) : (
        <View style={[styles.fallback, containerSizeStyle]}>
          <Text style={[styles.initials, textSizeStyle]}>
            {getInitials(name)}
          </Text>
        </View>
      )}
      {showStatus ? (
        <View
          testID={online ? 'status-dot-online' : 'status-dot-offline'}
          style={[
            styles.statusDot,
            dotSizeStyle,
            online ? styles.dotOnline : styles.dotOffline,
          ]}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  image: {
    backgroundColor: colors.primaryLight,
  },
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: colors.textInverse,
    fontWeight: '700',
  },
  size_sm: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  size_md: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  size_lg: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  size_xl: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  text_sm: {
    fontSize: 13,
  },
  text_md: {
    fontSize: 16,
  },
  text_lg: {
    fontSize: 22,
  },
  text_xl: {
    fontSize: 26,
  },
  statusDot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  dot_sm: {
    width: 11,
    height: 11,
    borderRadius: 6,
  },
  dot_md: {
    width: 13,
    height: 13,
    borderRadius: 7,
  },
  dot_lg: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  dot_xl: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  dotOnline: {
    backgroundColor: colors.online,
  },
  dotOffline: {
    backgroundColor: colors.offline,
  },
});
