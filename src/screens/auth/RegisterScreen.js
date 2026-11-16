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
import { colors, radius, spacing, typography } from '../../theme';
import { validateRegisterForm } from '../../utils/validation';

export const RegisterScreen = ({ navigation }) => {
  const { register, authActionLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState('');

  const clearFieldError = field => {
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (submitError) {
      setSubmitError('');
    }
  };

  const handleRegister = async () => {
    setSubmitError('');
    const { isValid, errors } = validateRegisterForm({
      fullName,
      email,
      password,
      confirmPassword,
    });

    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    try {
      await register({ fullName, email, password });
    } catch (error) {
      setSubmitError(
        error?.message || 'Đăng ký tài khoản thất bại. Vui lòng thử lại.',
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
            <Text style={styles.title}>Tạo tài khoản mới</Text>
            <Text style={styles.subtitle}>
              Điền thông tin cá nhân để kết nối và nhắn tin trực tuyến
            </Text>
          </View>

          <View style={styles.card}>
            {submitError ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerText}>{submitError}</Text>
              </View>
            ) : null}

            <AppInput
              testID="register-fullname-input"
              label="Họ và tên"
              value={fullName}
              onChangeText={text => {
                setFullName(text);
                clearFieldError('fullName');
              }}
              placeholder="Nguyễn Văn A"
              autoCapitalize="words"
              error={fieldErrors.fullName}
            />

            <AppInput
              testID="register-email-input"
              label="Email"
              value={email}
              onChangeText={text => {
                setEmail(text);
                clearFieldError('email');
              }}
              placeholder="nhapemail@vidu.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={fieldErrors.email}
            />

            <AppInput
              testID="register-password-input"
              label="Mật khẩu"
              value={password}
              onChangeText={text => {
                setPassword(text);
                clearFieldError('password');
              }}
              placeholder="Tối thiểu 6 ký tự"
              secureTextEntry
              error={fieldErrors.password}
            />

            <AppInput
              testID="register-confirm-password-input"
              label="Nhập lại mật khẩu"
              value={confirmPassword}
              onChangeText={text => {
                setConfirmPassword(text);
                clearFieldError('confirmPassword');
              }}
              placeholder="Nhập lại mật khẩu ở trên"
              secureTextEntry
              error={fieldErrors.confirmPassword}
              returnKeyType="done"
              onSubmitEditing={handleRegister}
            />

            <AppButton
              testID="register-submit-button"
              title="Đăng ký tài khoản"
              onPress={handleRegister}
              loading={authActionLoading}
              style={styles.submitBtn}
            />

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Đã có tài khoản? </Text>
              <TouchableOpacity
                testID="go-to-login-button"
                activeOpacity={0.7}
                onPress={() => navigation.goBack()}>
                <Text style={styles.footerLink}>Đăng nhập</Text>
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
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
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
