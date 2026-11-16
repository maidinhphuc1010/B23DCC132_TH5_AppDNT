/* eslint-env jest */
import fs from 'fs';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

const collectJsFiles = dirPath => {
  if (!fs.existsSync(dirPath)) {
    return [];
  }
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.flatMap(entry => {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      return collectJsFiles(fullPath);
    }
    if (/\.(js|jsx)$/.test(entry.name)) {
      return [fullPath];
    }
    return [];
  });
};

describe('Kiến trúc phân tầng & chuẩn React Native CLI thuần', () => {
  it('Không có màn hình hay component nào import trực tiếp firebase/* hoặc geolocation', () => {
    const restrictedDirs = [
      path.join(PROJECT_ROOT, 'src', 'screens'),
      path.join(PROJECT_ROOT, 'src', 'components'),
      path.join(PROJECT_ROOT, 'src', 'navigation'),
      path.join(PROJECT_ROOT, 'src', 'context'),
    ];

    const filesToCheck = [
      ...restrictedDirs.flatMap(collectJsFiles),
      path.join(PROJECT_ROOT, 'App.js'),
    ];

    expect(filesToCheck.length).toBeGreaterThan(0);

    const forbiddenImportPattern =
      /from\s+['"](firebase\/|@firebase\/|@react-native-community\/geolocation)/;

    filesToCheck.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(forbiddenImportPattern.test(content)).toBe(false);
    });
  });

  it('Đã loại bỏ hoàn toàn mọi gói và import Expo / json-server khỏi dự án', () => {
    const pkg = JSON.parse(
      fs.readFileSync(path.join(PROJECT_ROOT, 'package.json'), 'utf8'),
    );
    const allDeps = {
      ...(pkg.dependencies || {}),
      ...(pkg.devDependencies || {}),
    };

    expect(allDeps.expo).toBeUndefined();
    expect(allDeps['@expo/metro-runtime']).toBeUndefined();
    expect(allDeps['babel-preset-expo']).toBeUndefined();
    expect(allDeps['json-server']).toBeUndefined();

    const sourceFiles = [
      path.join(PROJECT_ROOT, 'index.js'),
      path.join(PROJECT_ROOT, 'App.js'),
      ...collectJsFiles(path.join(PROJECT_ROOT, 'src')),
    ];

    sourceFiles.forEach(filePath => {
      const content = fs.readFileSync(filePath, 'utf8');
      expect(/from\s+['"](expo|@expo\/)/.test(content)).toBe(false);
    });
  });

  it('database.rules.json hợp lệ và cấu hình đầy đủ bảo mật + chỉ mục cho users, conversations, messages', () => {
    const rulesPath = path.join(PROJECT_ROOT, 'database.rules.json');
    expect(fs.existsSync(rulesPath)).toBe(true);

    const parsed = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));
    expect(parsed.rules).toBeDefined();
    expect(parsed.rules.users).toBeDefined();
    expect(parsed.rules.conversations['.indexOn']).toContain('lastMessageTime');
    expect(parsed.rules.messages.$chatId['.indexOn']).toContain('createdAt');
  });
});
