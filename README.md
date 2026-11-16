# Bài Thực Hành 5: Ứng Dụng Chat 1-1 Realtime Với Firebase (React Native CLI)

Ứng dụng nhắn tin 1-1 thời gian thực xây dựng trên nền tảng **React Native CLI thuần (0.81.5)** tích hợp **Firebase Modular JS SDK v11** (`firebase/app`, `firebase/auth`, `firebase/database`), lưu phiên đăng nhập tự động với `AsyncStorage`, theo dõi trạng thái trực tuyến (`Online/Offline`) thời gian thực và định vị thiết bị GPS qua `@react-native-community/geolocation`.

---

## 1. Tính Năng Chính

- **Xác thực người dùng (Firebase Authentication)**:
  - Đăng ký tài khoản mới (`Họ và tên`, `Email`, `Mật khẩu`, `Nhập lại mật khẩu`) với kiểm tra hợp lệ từng trường và lưu hồ sơ vào `users/{uid}`.
  - Đăng nhập Email/Password kèm thông báo lỗi tiếng Việt chi tiết.
  - Lưu phiên tự động qua `getReactNativePersistence(AsyncStorage)` — mở lại ứng dụng vào thẳng màn hình chính.
  - Đăng xuất an toàn: tự động cập nhật `online: false` và `lastSeen` trước khi `signOut`.
- **Trạng thái hoạt động thời gian thực (Realtime Presence)**:
  - Lắng nghe `.info/connected`, đăng ký `onDisconnect().update({ online: false, lastSeen: serverTimestamp() })` và đồng bộ theo vòng đời `AppState` (`active` / `background`).
- **Danh bạ & Tìm kiếm liên hệ**:
  - Hiển thị toàn bộ người dùng khác trên hệ thống (loại trừ bản thân), ưu tiên người đang Online lên đầu.
  - Tìm kiếm tức thì theo họ tên (hỗ trợ cả có dấu và không dấu) hoặc địa chỉ email.
- **Nhắn tin 1-1 Realtime & Đếm tin chưa đọc**:
  - Định danh phòng chat duy nhất theo cặp UID: `[uid1, uid2].sort().join('_')`.
  - Ghi nguyên tử đa đường dẫn (`update(ref(db), updates)`) đồng thời vào `messages/{chatId}` và `conversations/{chatId}` kèm `increment(1)` cho số tin chưa đọc của người nhận.
  - Tự động cuộn xuống tin nhắn mới nhất, chặn gửi tin nhắn rỗng/khoảng trắng, và đưa `unreadCount` về `0` ngay khi mở phòng chat.
- **Cài đặt & Định vị GPS**:
  - Hiển thị hồ sơ cá nhân đang đăng nhập, xin quyền vị trí runtime (Android/iOS) và lấy tọa độ GPS thực tế (`Latitude`, `Longitude`, `Accuracy`).

---

## 2. Kiến Trúc Thư Mục

Toàn bộ lệnh gọi Firebase và GPS được đóng gói 100% bên trong tầng `src/services/` (không có màn hình hay component nào gọi trực tiếp SDK):

```text
├── __mocks__/
│   └── @env.js                    # Biến môi trường giả lập cho Jest
├── __tests__/                     # Bộ kiểm thử đơn vị & kiến trúc (Jest)
├── android/                       # Mã nguồn native Android (React Native CLI)
├── ios/                           # Mã nguồn native iOS (React Native CLI)
├── src/
│   ├── components/
│   │   ├── chat/                  # ConversationItem, ContactItem, MessageBubble, ChatInputBar
│   │   └── common/                # Avatar, AppInput, AppButton, SearchBar, EmptyState, LoadingView, TabIcon
│   ├── context/
│   │   └── AuthContext.js         # Quản lý phiên đăng nhập & kích hoạt Presence
│   ├── navigation/
│   │   ├── routes.js              # Hằng số tên màn hình
│   │   ├── AuthStack.js           # Luồng Đăng nhập / Đăng ký
│   │   ├── MainTabNavigator.js    # Bottom Tabs: Home, Danh bạ, Thông báo, Cài đặt
│   │   └── AppNavigator.js        # Điều hướng gốc theo trạng thái xác thực
│   ├── screens/
│   │   ├── auth/                  # LoginScreen, RegisterScreen
│   │   ├── home/                  # HomeScreen (Danh sách cuộc trò chuyện)
│   │   ├── contacts/              # ContactsScreen (Danh bạ & tìm kiếm)
│   │   ├── chat/                  # ChatScreen (Phòng chat 1-1 realtime)
│   │   ├── notifications/         # NotificationScreen (Thông báo tin chưa đọc)
│   │   └── settings/              # SettingsScreen (Hồ sơ, định vị GPS, đăng xuất)
│   ├── services/
│   │   ├── firebaseConfig.js      # Khởi tạo Firebase App, Auth (AsyncStorage), Database
│   │   ├── authService.js         # Đăng ký, đăng nhập, đăng xuất, mapAuthError tiếng Việt
│   │   ├── presenceService.js     # Đồng bộ Online/Offline & onDisconnect
│   │   ├── userService.js         # Lắng nghe & tìm kiếm Danh bạ
│   │   ├── chatService.js         # Gửi/nhận tin nhắn, cuộc trò chuyện & unreadCount
│   │   └── locationService.js     # Xin quyền & đọc tọa độ GPS hiện tại
│   ├── theme/                     # Hệ thống màu sắc, khoảng cách, kiểu chữ
│   └── utils/                     # Kiểm tra dữ liệu đầu vào & định dạng thời gian
├── .env.example                   # Mẫu biến môi trường Firebase
├── database.rules.json            # Quy tắc bảo mật & chỉ mục Realtime Database
├── App.js
└── index.js
```

---

## 3. Hướng Dẫn Thiết Lập Firebase

### Bước 1: Tạo Firebase Project & Web App
1. Truy cập [Firebase Console](https://console.firebase.google.com/) và nhấn **Create a project**.
2. Tại trang tổng quan dự án, chọn biểu tượng **Web (`</>`)** để đăng ký ứng dụng mới (ví dụ: `firebase-chat-rn`).
3. Sao chép các giá trị trong đối tượng `firebaseConfig`.

### Bước 2: Bật Email/Password Authentication
1. Vào menu **Build -> Authentication -> Get started**.
2. Chọn tab **Sign-in method**, nhấp vào **Email/Password**, bật công tắc **Enable** và nhấn **Save**.

### Bước 3: Tạo Realtime Database & Nạp Security Rules
1. Vào menu **Build -> Realtime Database -> Create Database**.
2. Chọn vùng máy chủ (khuyến nghị `us-central1` hoặc `asia-southeast1`), hoàn tất khởi tạo và sao chép đường dẫn URL của Database (ví dụ: `https://ten-project-default-rtdb.firebaseio.com`).
3. Chuyển sang tab **Rules**, sao chép toàn bộ nội dung từ tệp [`database.rules.json`](./database.rules.json) dán vào trình soạn thảo và nhấn **Publish**.

### Bước 4: Cấu hình tệp `.env`
Sao chép `.env.example` thành `.env` (nếu chưa có) và điền thông số thực tế từ Firebase Console:

```env
FIREBASE_API_KEY=AIzaSy...
FIREBASE_AUTH_DOMAIN=ten-project.firebaseapp.com
FIREBASE_DATABASE_URL=https://ten-project-default-rtdb.firebaseio.com
FIREBASE_PROJECT_ID=ten-project
FIREBASE_STORAGE_BUCKET=ten-project.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=123456789012
FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890
```

> **Lưu ý**: Tệp `.env` đã được đưa vào `.gitignore` để bảo mật khóa API. Mỗi khi chỉnh sửa `.env`, hãy khởi động lại Metro với cờ `--reset-cache`.

---

## 4. Cài Đặt & Khởi Chạy Ứng Dụng

### Yêu cầu môi trường
- **Node.js** >= 20
- **JDK 17** & **Android Studio** (Android SDK + máy ảo AVD hoặc thiết bị thật bật USB Debugging)
- Trên macOS (nếu chạy iOS): **Xcode** & **CocoaPods**

### Các lệnh thực thi
```bash
# 1. Cài đặt các gói phụ thuộc
npm install

# 2. Khởi chạy Metro Bundler (xóa cache biến môi trường cũ nếu vừa sửa .env)
npm start -- --reset-cache

# 3. Build và chạy trên Android (mở ở cửa sổ terminal thứ 2)
npm run android

# 4. Build và chạy trên iOS (chỉ dành cho macOS)
cd ios && pod install && cd ..
npm run ios
```

---

## 5. Kiểm Tra Mã Nguồn & Chạy Kiểm Thử Tự Động

```bash
# Kiểm tra quy chuẩn mã nguồn ESLint
npm run lint

# Chạy toàn bộ bộ kiểm thử Jest
npm test
```
