import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export default function LoginEmail() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleProcess = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      
      // Push to MFA Phone Link Screen
      router.push('/enter-phone');
      
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <View className="flex-1 px-6">
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
          <Text className="text-3xl font-extrabold text-njangi-green mb-2">{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          <Text className="text-sm text-njangi-gray font-medium leading-relaxed max-w-[300px]">
            {isLogin ? "Log in to continue securing your community's financial future." : "Sign up with your email to start your Njangi journey."}
          </Text>
        </View>

        <View className="w-full">
          <Input 
            placeholder="Email Address" 
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <Input 
            placeholder="Password" 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity className="self-end mb-6" onPress={() => setIsLogin(!isLogin)}>
          <Text className="text-[12px] font-bold text-njangi-orange">
            {isLogin ? "Need an account? Sign up" : "Already have an account? Log in"}
          </Text>
        </TouchableOpacity>

        <View className="w-full mt-auto mb-6">
          <Button 
            title={(isLogin ? "Log In" : "Sign Up") + " \u2192"} 
            onPress={handleProcess} 
            loading={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}
