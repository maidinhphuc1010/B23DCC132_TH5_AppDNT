const padZero = num => String(num).padStart(2, '0');

export const formatMessageTime = timestamp => {
  if (!timestamp || typeof timestamp !== 'number') {
    return 'Vừa xong';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
};

export const formatConversationTime = timestamp => {
  if (!timestamp || typeof timestamp !== 'number') {
    return '';
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const now = new Date();
  const isSameDay =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  if (isSameDay) {
    return `${padZero(date.getHours())}:${padZero(date.getMinutes())}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return 'Hôm qua';
  }

  return `${padZero(date.getDate())}/${padZero(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
};

export const formatLastSeen = (online, lastSeen) => {
  if (online) {
    return 'Đang hoạt động';
  }
  if (!lastSeen || typeof lastSeen !== 'number') {
    return 'Ngoại tuyến';
  }

  const diffMs = Date.now() - lastSeen;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) {
    return 'Vừa truy cập';
  }
  if (diffMinutes < 60) {
    return `Hoạt động ${diffMinutes} phút trước`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `Hoạt động ${diffHours} giờ trước`;
  }

  return `Hoạt động ${formatConversationTime(lastSeen)}`;
};

export const formatDateTimeFull = timestamp => {
  if (!timestamp || typeof timestamp !== 'number') {
    return '';
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return `${padZero(date.getHours())}:${padZero(date.getMinutes())}:${padZero(
    date.getSeconds(),
  )} - ${padZero(date.getDate())}/${padZero(
    date.getMonth() + 1,
  )}/${date.getFullYear()}`;
};
