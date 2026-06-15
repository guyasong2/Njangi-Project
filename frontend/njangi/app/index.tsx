import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Splash() {
  const router = useRouter();
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const hasPin = useAuthStore(state => state.hasPin);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isAuthenticated) {
        // If user has set a PIN, require it on app resume
        if (hasPin) {
          router.replace('/pin-lock');
        } else {
          router.replace('/dashboard');
        }
      } else {
        router.replace('/onboarding');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, [router, isAuthenticated, hasPin]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <View className="flex-1 items-center justify-center">
        <Text className="text-[48px] font-extrabold text-njangi-green tracking-tight">Njangi</Text>
      </View>
    </SafeAreaView>
  );
}
