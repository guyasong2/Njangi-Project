import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Vibration, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  FadeIn,
} from 'react-native-reanimated';
import { NumericKeypad } from '../src/components/ui/NumericKeypad';
import { useAuthStore } from '../src/store/useAuthStore';
import { signOut } from 'firebase/auth';
import { auth } from '../src/firebase';

const PIN_LENGTH = 4;

export default function PinLock() {
  const router = useRouter();
  const storedPin = useAuthStore(state => state.pin);
  const logout = useAuthStore(state => state.logout);
  const clearPin = useAuthStore(state => state.clearPin);

  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-12, { duration: 50 }),
      withTiming(12, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
    if (Platform.OS !== 'web') Vibration.vibrate(300);
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinSubmit();
    }
  }, [pin]);

  const handlePinSubmit = () => {
    if (pin === storedPin) {
      router.replace('/dashboard');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      shake();
      setErrorMsg(newAttempts >= 3 ? `${newAttempts} failed attempts` : 'Incorrect PIN');
      setTimeout(() => setPin(''), 400);

      if (newAttempts >= 5) {
        Alert.alert(
          'Too Many Attempts',
          'You have been logged out for security. Please log in again.',
          [{ text: 'OK', onPress: handleLogout }]
        );
      }
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (_) {}
    logout();
    router.replace('/onboarding');
  };

  const onPressNum = (num: string) => {
    if (pin.length < PIN_LENGTH) setPin(prev => prev + num);
  };

  const onDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
        <View className="flex-1 items-center justify-between pt-16 pb-4">
          <View className="items-center px-6">
            {/* Branding */}
            <Text className="text-3xl font-extrabold text-[#0B3D2E] tracking-tight mb-2">Njangi</Text>
            <Text className="text-sm font-medium text-[#6b665B] mb-10">Enter your PIN to continue</Text>

            {/* Avatar shield */}
            <View className="w-20 h-20 bg-[#0B3D2E]/10 rounded-full items-center justify-center mb-8">
              <Ionicons name="lock-closed" size={32} color="#0B3D2E" />
            </View>

            {/* Dots */}
            <Animated.View style={[{ flexDirection: 'row', gap: 16 }, shakeStyle]}>
              {Array.from({ length: PIN_LENGTH }).map((_, i) => (
                <View
                  key={i}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: i < pin.length ? '#0B3D2E' : 'transparent',
                    borderWidth: 2,
                    borderColor: i < pin.length ? '#0B3D2E' : '#B0A99A',
                  }}
                />
              ))}
            </Animated.View>

            {/* Error message */}
            <Text
              className="text-xs font-bold text-red-500 mt-4"
              style={{ opacity: errorMsg ? 1 : 0 }}
            >
              {errorMsg || ' '}
            </Text>
          </View>

          {/* Keypad */}
          <View className="w-full">
            <NumericKeypad onPressNum={onPressNum} onDelete={onDelete} />

            {/* Forgot PIN */}
            <TouchableOpacity className="items-center mt-2 mb-4" onPress={handleLogout}>
              <Text className="text-sm font-bold text-njangi-orange">Forgot PIN? Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
