import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {useAuth} from '../contexts/AuthContext';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import VerifyEmailScreen from '../screens/VerifyEmailScreen';
import HomeScreen from '../screens/HomeScreen';
import GameLoadingScreen from '../screens/GameLoadingScreen';
import GameScreen from '../screens/GameScreen';
import GameOverScreen from '../screens/GameOverScreen';
import StoreScreen from '../screens/StoreScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import AdminPanelScreen from '../screens/AdminPanelScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  const {loading} = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={loading ? 'Splash' : 'Landing'}
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: {backgroundColor: '#0f172a'},
      }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Landing" component={LandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen
        name="GameLoading"
        component={GameLoadingScreen}
        options={{gestureEnabled: false, orientation: 'landscape'}}
      />
      <Stack.Screen
        name="Game"
        component={GameScreen}
        options={{
          gestureEnabled: false,
          orientation: 'landscape',
        }}
      />
      <Stack.Screen
        name="GameOver"
        component={GameOverScreen}
        options={{gestureEnabled: false}}
      />
      <Stack.Screen name="Store" component={StoreScreen} />
      <Stack.Screen name="UserProfile" component={UserProfileScreen} />
      <Stack.Screen name="AdminPanel" component={AdminPanelScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
