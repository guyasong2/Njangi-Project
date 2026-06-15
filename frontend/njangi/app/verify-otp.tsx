import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NumericKeypad } from '../src/components/ui/NumericKeypad';
import { Button } from '../src/components/ui/Button';
import { useAuthStore } from '../src/store/useAuthStore';
import { apiClient } from '../src/api/client';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/firebase';

export default function VerifyOtp() {
  const router = useRouter();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  
  const setToken = useAuthStore(state => state.setToken);
  const confirmationResult = useAuthStore(state => state.confirmationResult);
  const logout = useAuthStore(state => state.logout);

  useEffect(() => {
    if (timer > 0) {
      const int = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(int);
    }
  }, [timer]);

  const handleVerify = async () => {
    if (code.length < 4) return; // Allow length 4 to 6 depending on Firebase
    if (!confirmationResult) {
      setError("Session expired. Please try logging in again.");
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Verify with Firebase
      await confirmationResult.confirm(code);
      
      const user = auth.currentUser;
      if (!user || (!user.email && !user.phoneNumber)) {
         throw new Error("Could not verify user context");
      }

      // 2. Validate against Django
      const id_token = await user.getIdToken();
      const data: any = await apiClient.post('/auth/firebase-login/', {
        id_token,
        email: user.email,
        phone_number: user.phoneNumber,
        google_uid: user.uid,
        name: user.displayName || 'Njangi Member',
      });
      
      setToken(data.tokens.access);
      router.replace('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP code');
      } else {
        setError(err.message || 'Verification failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const onPressNum = (num: string) => {
    if (code.length < 6) setCode(c => c + num); // Firebase allows 6 digits usually
  };
  const onDelete = () => setCode(c => c.slice(0, -1));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <View className="flex-1 px-6">
        <View className="flex-row items-center py-4">
          <TouchableOpacity 
            onPress={() => {
              logout(); 
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace('/auth-choice');
              }
            }}
            className="w-10 h-10 rounded-[20px] bg-[#EAE5D9] items-center justify-center"
          >
             <Ionicons name="arrow-back" size={20} color="#0B3D2E" />
          </TouchableOpacity>
        </View>

        <View className="items-center mt-6 mb-8">
          <Text className="text-3xl font-extrabold text-njangi-green mb-3 text-center">Verify Phone</Text>
          <Text className="text-[15px] text-njangi-gray text-center leading-relaxed px-2">
            Secure your financial future with your community. We sent a code to {phone}.
          </Text>
        </View>

        <View className="flex-row justify-center gap-3 mb-6">
          {/* Firebase OTPs are typically 6 digits */}
          {[0, 1, 2, 3, 4, 5].map(i => (
             <View key={i} className={`w-12 h-14 rounded-xl border-2 items-center justify-center bg-white ${code.length === i ? 'border-njangi-green' : 'border-transparent shadow-sm'}`}> 
                {code[i] ? <Text className="text-xl font-bold text-njangi-green">{code[i]}</Text> : <Text className="text-njangi-green font-medium opacity-30 text-xl">-</Text>}
             </View>
          ))}
        </View>
        
        {error ? (
          <Text className="text-center font-bold text-red-500 mb-6 text-[13px]">{error}</Text>
        ) : (
          <Text className="text-center font-bold text-[#B07722] mb-6 text-[12px]">
            {timer > 0 ? `Resend code in ${timer}s` : 'Resend Code'}
          </Text>
        )}

        <View className="w-full mt-auto">
          <NumericKeypad onPressNum={onPressNum} onDelete={onDelete} />
        </View>

        <View className="w-full mb-6 mt-4">
          <Button 
            title="Verify & Continue \u2192" 
            onPress={handleVerify} 
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
