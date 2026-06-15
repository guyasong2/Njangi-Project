import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

import { Sidebar } from '../src/components/ui/Sidebar';
import { useAuthStore } from '../src/store/useAuthStore';
import { apiClient } from '../src/api/client';
import './global.css';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function AnimatedSplashScreen({ onFinish }: { onFinish: () => void }) {
  return (
    <Animated.View 
      entering={FadeIn.duration(500)}
      exiting={FadeOut.duration(500)}
      style={{ 
        flex: 1, 
        backgroundColor: '#F5F1E8', 
        justifyContent: 'center', 
        alignItems: 'center', 
        position: 'absolute', 
        top: 0, left: 0, right: 0, bottom: 0, 
        zIndex: 1000 
      }}
    >
      <Animated.View entering={FadeIn.delay(200).duration(800)}>
          <View className="items-center">
              <View className="mb-4 bg-[#0B3D2E] w-20 h-20 rounded-[25px] items-center justify-center shadow-lg">
                  <Ionicons name="leaf" size={40} color="#F5A623" />
              </View>
              <Text className="text-3xl font-black text-[#0B3D2E] tracking-tighter">Njangi</Text>
              <Text className="text-[10px] font-bold text-[#B07722] uppercase tracking-[4px] mt-2">Community Wealth</Text>
          </View>
      </Animated.View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  
  const segments = useSegments();
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);

  // Protected Routes Guard
  useEffect(() => {
    if (!appIsReady) return;

    // Cast to string[] to avoid TS2367 with typedRoutes enabled
    const currentSegments = segments as string[];
    const firstSegment = currentSegments[0];

    const inAuthGroup = firstSegment === 'login' || 
                        firstSegment === 'signup' || 
                        firstSegment === 'auth-choice' || 
                        firstSegment === 'onboarding' ||
                        firstSegment === 'login-email' ||
                        firstSegment === 'enter-phone' ||
                        firstSegment === 'verify-otp' ||
                        firstSegment === 'index' ||
                        currentSegments.length === 0;

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if user is not authenticated and trying to access protected route
      router.replace('/auth-choice');
    } else if (isAuthenticated && inAuthGroup && firstSegment !== 'index' && currentSegments.length > 0) {
      // Redirect to dashboard if user is authenticated and trying to access auth routes
      // We exclude 'index' to allow the splash screen's own redirect logic to handle it
      router.replace('/dashboard');
    }
  }, [isAuthenticated, segments, appIsReady, router]);

  useEffect(() => {
    async function prepare() {
      try {
        // Validate any persisted token before routing.
        // If expired, the 401 interceptor auto-calls logout() so
        // isAuthenticated becomes false before the nav guard fires.
        const storedToken = useAuthStore.getState().token;
        const minSplash = new Promise(resolve => setTimeout(resolve, 2000));

        if (storedToken) {
          await Promise.all([
            minSplash,
            apiClient.get('/auth/dashboard/').catch(() => {
              // Swallow error — the 401 interceptor already cleared auth state
            }),
          ]);
        } else {
          await minSplash;
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        setTimeout(() => setShowSplash(false), 200);
      }
    }

    prepare();
  }, []);

  useEffect(() => {
    if (appIsReady) {
      SplashScreen.hideAsync();
    }
  }, [appIsReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {showSplash && <AnimatedSplashScreen onFinish={() => setShowSplash(false)} />}
      
      {!showSplash && (
        <Animated.View entering={FadeIn.duration(300)} style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="auth-choice" />
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="login-email" />
            <Stack.Screen name="enter-phone" />
            <Stack.Screen name="verify-otp" />
            <Stack.Screen name="dashboard" />
            <Stack.Screen name="groups" />
            <Stack.Screen name="group-details" />
            <Stack.Screen name="create-group" />
            <Stack.Screen name="join-group" />
          </Stack>
          <Sidebar />
        </Animated.View>
      )}

      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
