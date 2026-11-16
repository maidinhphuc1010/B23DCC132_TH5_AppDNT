import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoadingView } from '../components/common/LoadingView';
import { useAuth } from '../context/AuthContext';
import { ChatScreen } from '../screens/chat/ChatScreen';
import { AuthStack } from './AuthStack';
import { MainTabNavigator } from './MainTabNavigator';
import { ROUTES } from './routes';

const RootStack = createNativeStackNavigator();

export const AppNavigator = () => {
  const { user, initializing } = useAuth();

  if (initializing) {
    return <LoadingView message="Đang khôi phục phiên đăng nhập..." />;
  }

  return (
    <NavigationContainer>
      {user ? (
        <RootStack.Navigator
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}>
          <RootStack.Screen
            name={ROUTES.MAIN_TABS}
            component={MainTabNavigator}
          />
          <RootStack.Screen name={ROUTES.CHAT} component={ChatScreen} />
        </RootStack.Navigator>
      ) : (
        <AuthStack />
      )}
    </NavigationContainer>
  );
};
