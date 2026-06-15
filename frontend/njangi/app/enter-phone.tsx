import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/firebase';
import { linkWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { useAuthStore } from '../src/store/useAuthStore';

export default function EnterPhone() {
  const router = useRouter();
  const [phone, setPhone] = useState('677000000');
  const [loading, setLoading] = useState(false);

  const setConfirmationResult = useAuthStore(state => state.setConfirmationResult);

  useEffect(() => {
    // Set device language precisely as documentation instructs
    auth.useDeviceLanguage();

    // Initialize recaptcha globally based on Firebase Docs
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
        'callback': (response: any) => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
          console.log("Recaptcha processed natively.");
        }
      });
    }
  }, []);

  const handleSendOtp = async () => {
    if (!phone) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }
    
    if (!auth.currentUser) {
      Alert.alert('Error', 'No active user context found. Please login via Email/Google first.');
      return;
    }
    
    setLoading(true);
    try {
      const formattedPhone = `+237${phone}`;
      
      // Pass the initialized global recaptcha Verifier completely inline
      const confirmation = await linkWithPhoneNumber(auth.currentUser, formattedPhone, (window as any).recaptchaVerifier);

      setConfirmationResult(confirmation);
      
      router.push({ pathname: '/verify-otp', params: { phone: formattedPhone } });
    } catch (err: any) {
      if (err.code === 'auth/credential-already-in-use') {
         Alert.alert('Phone taken', 'This phone number is already linked to an account.');
      } else if (err.code === 'auth/unauthorized-domain') {
         Alert.alert('Domain Blocked', 'Please add localhost to Authorized Domains in Firebase Console.');
      } else if (err.code === 'auth/invalid-app-credential' || err.message.includes('400')) {
         Alert.alert('Firebase Config Error', 'Firebase Console rejected the Phone Auth securely (400 Bad Request). Make sure your Phone Provider is ON and localhost is authorized!');
      } else {
         Alert.alert('Verification Error', err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <View className="flex-1 px-6">
        
        {/* Invisible target container specifically for Firebase that MUST be empty */}
        <View nativeID="recaptcha-container" />
        
        {/* Header navigation */}
        <View className="flex-row items-center py-4">
          <TouchableOpacity 
            onPress={() => {
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

        <View className="mt-8 mb-10">
          <Text className="text-3xl font-extrabold text-njangi-green mb-2">Secure Link</Text>
          <Text className="text-sm text-njangi-gray font-medium leading-relaxed max-w-[300px]">
            Please bind a verified phone number to your profile to unlock Njangi features.
          </Text>
        </View>

        <View className="w-full">
          <Input 
            placeholder="Phone Number (e.g. 6XX XXX XXX)" 
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            prefix={<Text className="font-bold text-njangi-green mr-1">🇨🇲 +237</Text>}
          />
        </View>

        <View className="w-full mt-auto mb-6">
           <Button 
             title="Send OTP Code \u2192" 
             onPress={handleSendOtp} 
             loading={loading}
           />
        </View>
      </View>
    </SafeAreaView>
  );
}
