const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = email => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  return EMAIL_REGEX.test(email.trim());
};

export const validateLoginForm = ({ email, password }) => {
  const errors = {};
  const trimmedEmail = (email || '').trim();

  if (!trimmedEmail) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Định dạng email không hợp lệ (ví dụ: ten@domain.com).';
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (password.length < 6) {
    errors.password = 'Mật khẩu phải có ít nhất 6 ký tự.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const validateRegisterForm = ({
  fullName,
  email,
  password,
  confirmPassword,
}) => {
  const errors = {};
  const trimmedName = (fullName || '').trim();
  const trimmedEmail = (email || '').trim();

  if (!trimmedName) {
    errors.fullName = 'Vui lòng nhập họ và tên hiển thị.';
  } else if (trimmedName.length < 2) {
    errors.fullName = 'Họ và tên phải có ít nhất 2 ký tự.';
  }

  if (!trimmedEmail) {
    errors.email = 'Vui lòng nhập địa chỉ email.';
  } else if (!isValidEmail(trimmedEmail)) {
    errors.email = 'Định dạng email không hợp lệ (ví dụ: ten@domain.com).';
  }

  if (!password) {
    errors.password = 'Vui lòng nhập mật khẩu.';
  } else if (password.length < 6) {
    errors.password = 'Mật khẩu phải có tối thiểu 6 ký tự.';
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'Vui lòng nhập lại mật khẩu xác nhận.';
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'Mật khẩu nhập lại không trùng khớp.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
