import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppButton } from '../../components/common/AppButton';
import { AppInput } from '../../components/common/AppInput';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../navigation/routes';
import { colors, radius, spacing, typography } from '../../theme';
import { validateLoginForm } from '../../utils/validation';

export const LoginScreen = ({ navigation }) => {
  const { login, authActionLoading, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const handleEmailChange = text => {
    setEmail(text);
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handlePasswordChange = text => {
    setPassword(text);
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleLogin = async () => {
    setSubmitError('');
    const { isValid, errors } = validateLoginForm({ email, password });
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    try {
      await login({ email, password });
    } catch (error) {
      setSubmitError(
        error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          <View style={styles.headerBlock}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoIcon}>💬</Text>
            </View>
            <Text style={styles.title}>Firebase Chat</Text>
            <Text style={styles.subtitle}>
              Đăng nhập để trò chuyện 1-1 thời gian thực cùng bạn bè
            </Text>
          </View>

          {!isConfigured ? (
            <View style={styles.warningBanner}>
              <Text style={styles.warningTitle}>Cấu hình Firebase mẫu</Text>
              <Text style={styles.warningText}>
                Tệp .env hiện đang dùng giá trị mẫu. Hãy điền thông số Firebase
                Project thực tế vào .env và khởi động lại Metro (--reset-cache)
                để đăng ký/đăng nhập.
              </Text>
            </View>
          ) : null}

          <View style={styles.card}>
            {submitError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

            <AppInput
              testID="login-email-input"
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="nhapemail@vidu.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldErrors.email}
            />

            <AppInput
              testID="login-password-input"
              label="Mật khẩu"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Nhập mật khẩu (tối thiểu 6 ký tự)"
              secureTextEntry
              error={fieldErrors.password}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />

            <AppButton
              testID="login-submit-button"
              title="Đăng nhập"
              onPress={handleLogin}
              loading={authActionLoading}
              style={styles.submitBtn}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Chưa có tài khoản? </Text>
              <TouchableOpacity
                testID="go-to-register-button"
                activeOpacity={0.7}
                onPress={() => navigation.navigate(ROUTES.REGISTER)}>
                <Text style={styles.footerLink}>Đăng ký ngay</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  warningBanner: {
    backgroundColor: colors.warningLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  warningTitle: {
    ...typography.captionBold,
    color: colors.warningText,
    marginBottom: 2,
  },
  warningText: {
    ...typography.caption,
    color: colors.warningText,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  errorBanner: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  errorBannerText: {
    ...typography.captionBold,
    color: colors.dangerText,
  },
  submitBtn: {
    marginTop: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  footerLink: {
    ...typography.bodyBold,
    color: colors.primary,
  },
});
