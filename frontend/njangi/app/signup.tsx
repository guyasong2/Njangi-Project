import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/firebase';
import { signInWithPhoneNumber, RecaptchaVerifier } from 'firebase/auth';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Signup() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('677000000');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const setConfirmationResult = useAuthStore(state => state.setConfirmationResult);
  const setPendingCredentials = useAuthStore(state => state.setPendingCredentials);

  const handleSignup = async () => {
    if (!username || !phone || !password) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
    setLoading(true);
    try {
      // Firebase Web requires a recaptcha verifier
      if (!(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
        });
      }

      const formattedPhone = `+237${phone}`;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, (window as any).recaptchaVerifier);
      
      setConfirmationResult(confirmation);
      setPendingCredentials({ username, password });
      
      router.push({ pathname: '/verify-otp', params: { phone: formattedPhone } });
    } catch (err: any) {
      Alert.alert('Firebase Auth Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <View className="flex-1 px-6">
        <View id="recaptcha-container"></View>
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
          <Text className="text-3xl font-extrabold text-njangi-green mb-2">Create Account</Text>
          <Text className="text-sm text-njangi-gray font-medium leading-relaxed max-w-[300px]">
            Join the community today and secure your financial future.
          </Text>
        </View>

        <View className="w-full">
          <Input 
            placeholder="Username" 
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />
          <Input 
            placeholder="Phone Number (e.g. 6XX XXX XXX)" 
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            prefix={<Text className="font-bold text-njangi-green mr-1">🇨🇲 +237</Text>}
          />
          <Input 
            placeholder="Password" 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <View className="w-full mt-auto mb-6">
          <Button 
            title="Continue \u2192" 
            onPress={handleSignup} 
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
