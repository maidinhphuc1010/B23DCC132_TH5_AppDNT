import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabIcon } from '../components/common/TabIcon';
import { useAuth } from '../context/AuthContext';
import { ContactsScreen } from '../screens/contacts/ContactsScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { NotificationScreen } from '../screens/notifications/NotificationScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { subscribeConversations } from '../services/chatService';
import { colors } from '../theme';
import { ROUTES } from './routes';

const Tab = createBottomTabNavigator();

const renderHomeTabIcon = ({ focused }) => (
  <TabIcon name="home" focused={focused} />
);

const renderContactsTabIcon = ({ focused }) => (
  <TabIcon name="contacts" focused={focused} />
);

const renderNotificationsTabIcon = ({ focused }) => (
  <TabIcon name="notifications" focused={focused} />
);

const renderSettingsTabIcon = ({ focused }) => (
  <TabIcon name="settings" focused={focused} />
);

export const MainTabNavigator = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    if (!user?.uid) {
      setConversations([]);
      return undefined;
    }

    const unsubscribe = subscribeConversations(user.uid, nextList => {
      setConversations(nextList);
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  const totalUnreadMessages = useMemo(
    () =>
      conversations.reduce(
        (sum, item) => sum + (Number(item.unreadCount) || 0),
        0,
      ),
    [conversations],
  );

  const unreadThreadsCount = useMemo(
    () => conversations.filter(item => Number(item.unreadCount) > 0).length,
    [conversations],
  );

  const homeBadge =
    totalUnreadMessages > 0
      ? totalUnreadMessages > 99
        ? '99+'
        : totalUnreadMessages
      : undefined;

  const notificationBadge =
    unreadThreadsCount > 0 ? unreadThreadsCount : undefined;

  return (
    <Tab.Navigator
      initialRouteName={ROUTES.HOME_TAB}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        tabBarBadgeStyle: styles.badge,
      }}>
      <Tab.Screen
        name={ROUTES.HOME_TAB}
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: renderHomeTabIcon,
          tabBarBadge: homeBadge,
        }}
      />
      <Tab.Screen
        name={ROUTES.CONTACTS_TAB}
        component={ContactsScreen}
        options={{
          tabBarLabel: 'Danh bạ',
          tabBarIcon: renderContactsTabIcon,
        }}
      />
      <Tab.Screen
        name={ROUTES.NOTIFICATIONS_TAB}
        component={NotificationScreen}
        options={{
          tabBarLabel: 'Thông báo',
          tabBarIcon: renderNotificationsTabIcon,
          tabBarBadge: notificationBadge,
        }}
      />
      <Tab.Screen
        name={ROUTES.SETTINGS_TAB}
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Cài đặt',
          tabBarIcon: renderSettingsTabIcon,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.surface,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    height: 62,
    paddingTop: 4,
    paddingBottom: 6,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.badge,
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: '700',
  },
});
