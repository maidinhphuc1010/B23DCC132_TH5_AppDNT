import React, { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ContactItem } from '../../components/chat/ContactItem';
import { EmptyState } from '../../components/common/EmptyState';
import { LoadingView } from '../../components/common/LoadingView';
import { SearchBar } from '../../components/common/SearchBar';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../navigation/routes';
import { filterContacts, subscribeContacts } from '../../services/userService';
import { colors, radius, spacing, typography } from '../../theme';

export const ContactsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setContacts([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const unsubscribe = subscribeContacts(
      user.uid,
      list => {
        setContacts(list);
        setLoading(false);
      },
      () => {
        setLoading(false);
      },
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const filteredContacts = useMemo(
    () => filterContacts(contacts, searchQuery, user?.uid),
    [contacts, searchQuery, user?.uid],
  );

  const onlineCount = useMemo(
    () => contacts.filter(item => item.online).length,
    [contacts],
  );

  const handleSelectContact = contact => {
    navigation.navigate(ROUTES.CHAT, {
      receiverId: contact.uid,
      receiverName: contact.displayName,
      receiverAvatar: contact.avatar,
      receiverEmail: contact.email,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.headerTitle}>Danh bạ</Text>
          <View style={styles.onlinePill}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlinePillText}>
              {onlineCount}/{contacts.length} trực tuyến
            </Text>
          </View>
        </View>
        <View style={styles.searchWrapper}>
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Tìm theo họ tên hoặc địa chỉ email..."
          />
        </View>
      </View>

      {loading ? (
        <LoadingView message="Đang tải danh bạ người dùng..." />
      ) : (
        <FlatList
          data={filteredContacts}
          keyExtractor={item => item.uid}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <ContactItem item={item} onPress={handleSelectContact} />
          )}
          contentContainerStyle={
            filteredContacts.length === 0 ? styles.emptyListContent : undefined
          }
          ListEmptyComponent={
            <EmptyState
              icon="👥"
              title={
                searchQuery.trim()
                  ? 'Không tìm thấy liên hệ phù hợp'
                  : 'Chưa có người dùng khác'
              }
              description={
                searchQuery.trim()
                  ? `Không có kết quả nào khớp với "${searchQuery.trim()}".`
                  : 'Hãy đăng ký thêm một tài khoản thứ hai để kiểm thử nhắn tin 1-1 thời gian thực.'
              }
            />
          }
        />
      )}
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
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.textPrimary,
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
    marginRight: spacing.xs + 2,
  },
  onlinePillText: {
    ...typography.captionBold,
    color: colors.successText,
  },
  searchWrapper: {
    marginTop: spacing.xxs,
  },
  emptyListContent: {
    flexGrow: 1,
  },
});
