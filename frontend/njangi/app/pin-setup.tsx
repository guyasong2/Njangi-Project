import { useState, useEffect, useRef } from 'react';
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

const PIN_LENGTH = 4;

type Step = 'set' | 'confirm';

export default function PinSetup() {
  const router = useRouter();
  const setPin = useAuthStore(state => state.setPin);

  const [step, setStep] = useState<Step>('set');
  const [firstPin, setFirstPin] = useState('');
  const [pin, setCurrentPin] = useState('');

  // Shake animation for mismatch
  const shakeX = useSharedValue(0);
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }));

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
    if (Platform.OS !== 'web') Vibration.vibrate(200);
  };

  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinComplete();
    }
  }, [pin]);

  const handlePinComplete = () => {
    if (step === 'set') {
      setFirstPin(pin);
      setCurrentPin('');
      setStep('confirm');
    } else {
      if (pin === firstPin) {
        setPin(pin);
        router.replace('/dashboard');
      } else {
        shake();
        setTimeout(() => {
          setCurrentPin('');
        }, 400);
      }
    }
  };

  const onPressNum = (num: string) => {
    if (pin.length < PIN_LENGTH) {
      setCurrentPin(prev => prev + num);
    }
  };

  const onDelete = () => {
    setCurrentPin(prev => prev.slice(0, -1));
  };

  const handleSkip = () => {
    router.replace('/dashboard');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Animated.View entering={FadeIn.duration(350)} style={{ flex: 1 }}>
        {/* Header */}
        <View className="px-6 pt-4 flex-row items-center justify-between mb-2">
          <TouchableOpacity
            onPress={() => step === 'confirm' ? (setStep('set'), setCurrentPin(''), setFirstPin('')) : router.back()}
            className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-[#EAE5D9]"
          >
            <Ionicons name="chevron-back" size={22} color="#0B3D2E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleSkip}>
            <Text className="text-sm font-bold text-[#A09C90]">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-between pt-8 pb-4">
          <View className="items-center px-6">
            {/* Icon */}
            <View className="w-20 h-20 bg-[#0B3D2E]/10 rounded-full items-center justify-center mb-6">
              <Ionicons name="keypad-outline" size={36} color="#0B3D2E" />
            </View>

            <Text className="text-2xl font-extrabold text-[#0B3D2E] text-center mb-2">
              {step === 'set' ? 'Create Your PIN' : 'Confirm Your PIN'}
            </Text>
            <Text className="text-sm font-medium text-[#6b665B] text-center max-w-[260px] leading-relaxed">
              {step === 'set'
                ? 'Choose a 4-digit PIN to unlock the app quickly each time you return.'
                : 'Re-enter your PIN to confirm it.'}
            </Text>

            {/* Dots */}
            <Animated.View style={[{ flexDirection: 'row', gap: 16, marginTop: 36 }, shakeStyle]}>
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

            {step === 'confirm' && (
              <Text className="text-xs font-bold text-red-400 mt-3 opacity-0" style={{ opacity: 0 }} />
            )}
          </View>

          {/* Keypad */}
          <NumericKeypad onPressNum={onPressNum} onDelete={onDelete} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}
