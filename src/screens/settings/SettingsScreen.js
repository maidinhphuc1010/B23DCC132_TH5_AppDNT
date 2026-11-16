import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/common/AppButton';
import { Avatar } from '../../components/common/Avatar';
import { useAuth } from '../../context/AuthContext';
import { getCurrentLocation } from '../../services/locationService';
import { colors, radius, spacing, typography } from '../../theme';
import { formatDateTimeFull } from '../../utils/dateUtils';

export const SettingsScreen = () => {
  const { user, logout, authActionLoading } = useAuth();
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [logoutError, setLogoutError] = useState('');

  const handleFetchLocation = useCallback(async () => {
    setLocationLoading(true);
    setLocationError('');
    try {
      const coords = await getCurrentLocation();
      setLocation(coords);
    } catch (error) {
      setLocationError(
        error?.message || 'Không thể lấy tọa độ GPS của thiết bị.',
      );
    } finally {
      setLocationLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    setLocationLoading(true);
    getCurrentLocation()
      .then(coords => {
        if (isMounted) {
          setLocation(coords);
          setLocationError('');
        }
      })
      .catch(error => {
        if (isMounted) {
          setLocationError(
            error?.message || 'Chưa lấy được vị trí GPS hiện tại.',
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setLocationLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    setLogoutError('');
    try {
      await logout();
    } catch (error) {
      setLogoutError(
        error?.message || 'Đăng xuất thất bại. Vui lòng thử lại.',
      );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cài đặt</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý hồ sơ cá nhân, định vị GPS và phiên đăng nhập
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <Avatar
              uri={user?.avatar}
              name={user?.displayName}
              size="lg"
              online
              showStatus
            />
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>
                {user?.displayName || 'Người dùng'}
              </Text>
              <Text style={styles.profileEmail}>{user?.email || ''}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusBadgeText}>Đang hoạt động</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionIcon}>📍</Text>
            <View style={styles.sectionTitleBox}>
              <Text style={styles.sectionTitle}>Định vị thiết bị (GPS)</Text>
              <Text style={styles.sectionSubtitle}>
                Tọa độ thời gian thực từ cảm biến vị trí của thiết bị
              </Text>
            </View>
          </View>

          {locationError ? (
            <View style={styles.locationErrorBox}>
              <Text style={styles.locationErrorText}>{locationError}</Text>
            </View>
          ) : null}

          {location ? (
            <View style={styles.coordsGrid}>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Vĩ độ (Latitude)</Text>
                <Text testID="gps-latitude-value" style={styles.coordValue}>
                  {Number(location.latitude).toFixed(6)}°
                </Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Kinh độ (Longitude)</Text>
                <Text testID="gps-longitude-value" style={styles.coordValue}>
                  {Number(location.longitude).toFixed(6)}°
                </Text>
              </View>
              <View style={styles.coordRow}>
                <Text style={styles.coordLabel}>Độ chính xác</Text>
                <Text style={styles.coordValue}>
                  {location.accuracy != null
                    ? `±${Math.round(location.accuracy)} m`
                    : 'Không xác định'}
                </Text>
              </View>
              <View style={[styles.coordRow, styles.coordRowLast]}>
                <Text style={styles.coordLabel}>Cập nhật lúc</Text>
                <Text style={styles.coordValue}>
                  {formatDateTimeFull(location.timestamp)}
                </Text>
              </View>
            </View>
          ) : !locationError ? (
            <Text style={styles.placeholderText}>
              Đang xác định tọa độ vị trí hiện tại của thiết bị...
            </Text>
          ) : null}

          <AppButton
            testID="refresh-location-button"
            title="Cập nhật vị trí"
            variant="secondary"
            loading={locationLoading}
            onPress={handleFetchLocation}
            style={styles.refreshBtn}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Phiên tài khoản</Text>
          <Text style={styles.logoutHint}>
            Khi đăng xuất, trạng thái tài khoản sẽ tự động chuyển về Ngoại tuyến
            (Offline) trên toàn bộ thiết bị của bạn bè.
          </Text>

          {logoutError ? (
            <Text style={styles.logoutErrorText}>{logoutError}</Text>
          ) : null}

          <AppButton
            testID="logout-button"
            title="Đăng xuất"
            variant="danger"
            loading={authActionLoading}
            onPress={handleLogout}
            style={styles.logoutBtn}
          />
        </View>
      </ScrollView>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileDetails: {
    flex: 1,
    marginLeft: spacing.lg,
  },
  profileName: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  profileEmail: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
    marginRight: 6,
  },
  statusBadgeText: {
    ...typography.small,
    color: colors.successText,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: spacing.sm + 2,
  },
  sectionTitleBox: {
    flex: 1,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  sectionSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationErrorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  locationErrorText: {
    ...typography.caption,
    color: colors.dangerText,
  },
  coordsGrid: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  coordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coordRowLast: {
    borderBottomWidth: 0,
  },
  coordLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  coordValue: {
    ...typography.captionBold,
    color: colors.textPrimary,
  },
  placeholderText: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  refreshBtn: {
    marginTop: spacing.xs,
  },
  logoutHint: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  logoutErrorText: {
    ...typography.caption,
    color: colors.danger,
    marginBottom: spacing.sm,
  },
  logoutBtn: {
    marginTop: spacing.xs,
  },
});
