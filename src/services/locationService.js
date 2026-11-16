import { PermissionsAndroid, Platform } from 'react-native';
import Geolocation from '@react-native-community/geolocation';

export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    if (typeof Geolocation.requestAuthorization === 'function') {
      Geolocation.requestAuthorization();
    }
    return true;
  }

  if (Platform.OS === 'android') {
    const finePermission = PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION;
    const coarsePermission =
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION;

    const alreadyGranted = await PermissionsAndroid.check(finePermission);
    if (alreadyGranted) {
      return true;
    }

    const grantedStatus = await PermissionsAndroid.request(finePermission, {
      title: 'Quyền truy cập vị trí',
      message:
        'Ứng dụng cần quyền truy cập GPS để hiển thị tọa độ vị trí hiện tại của thiết bị.',
      buttonNeutral: 'Hỏi lại sau',
      buttonNegative: 'Từ chối',
      buttonPositive: 'Cho phép',
    });

    if (grantedStatus === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    }

    const coarseGranted = await PermissionsAndroid.check(coarsePermission);
    return Boolean(coarseGranted);
  }

  return true;
};

const mapLocationError = error => {
  if (!error) {
    return 'Không thể lấy vị trí hiện tại. Vui lòng thử lại.';
  }

  switch (error.code) {
    case 1:
      return 'Quyền truy cập vị trí đã bị từ chối. Vui lòng cấp quyền GPS trong Cài đặt.';
    case 2:
      return 'Dịch vụ định vị GPS đang tắt hoặc không khả dụng trên thiết bị.';
    case 3:
      return 'Quá thời gian chờ tín hiệu GPS. Vui lòng kiểm tra định vị và thử lại.';
    default:
      return error.message || 'Không thể xác định tọa độ vị trí hiện tại.';
  }
};

const fetchPositionOnce = options =>
  new Promise((resolve, reject) => {
    Geolocation.getCurrentPosition(
      position => {
        const { coords = {}, timestamp } = position || {};
        resolve({
          latitude: coords.latitude,
          longitude: coords.longitude,
          accuracy: coords.accuracy ?? null,
          altitude: coords.altitude ?? null,
          timestamp: timestamp || Date.now(),
        });
      },
      err => reject(err),
      options,
    );
  });

export const getCurrentLocation = async () => {
  const hasPermission = await requestLocationPermission();
  if (!hasPermission) {
    throw new Error(
      'Quyền truy cập vị trí bị từ chối. Vui lòng cấp quyền GPS cho ứng dụng.',
    );
  }

  try {
    return await fetchPositionOnce({
      enableHighAccuracy: true,
      timeout: 12000,
      maximumAge: 10000,
    });
  } catch (primaryError) {
    if (primaryError && primaryError.code === 1) {
      throw new Error(mapLocationError(primaryError));
    }

    try {
      return await fetchPositionOnce({
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      });
    } catch (fallbackError) {
      throw new Error(mapLocationError(fallbackError));
    }
  }
};
