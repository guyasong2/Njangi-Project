import { useState, useEffect } from 'react';
import { View, Text, Alert, TouchableOpacity, Platform, ScrollView, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../src/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithCredential,
} from 'firebase/auth';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../src/api/client';
import { useAuthStore } from '../src/store/useAuthStore';

WebBrowser.maybeCompleteAuthSession();

export default function AuthChoice() {
  const router = useRouter();

  // Google Auth Session Hook
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: '543531915403-k6g8lbno6rbqnfp4gv6seeuv3amk36tk.apps.googleusercontent.com',
  });

  const setToken = useAuthStore(state => state.setToken);
  const setPhotoUrl = useAuthStore(state => state.setPhotoUrl);
  const setDisplayName = useAuthStore(state => state.setDisplayName);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [isLogin, setIsLogin] = useState(true);

  // Shared fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign-up only fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Clear sign-up fields when switching to login
  const toggleMode = () => {
    setIsLogin(prev => !prev);
    setFullName('');
    setPhoneNumber('');
    setEmail('');
    setPassword('');
  };

  const performDjangoLogin = async (user: any) => {
    try {
      const id_token = await user.getIdToken(/* forceRefresh */ true);
      const data: any = await apiClient.post('/auth/firebase-login/', {
        id_token,
        email: user.email,
        google_uid: user.uid,
        name: user.displayName || 'Njangi Member',
      });
      setToken(data.tokens.access);
      setPhotoUrl(user.photoURL || null);
      const rawName = user.displayName || user.email?.split('@')[0] || 'Member';
      setDisplayName(rawName);
      router.replace('/dashboard');
    } catch (err: any) {
      Alert.alert('Server Sync Error', err.message || 'Could not connect to Njangi backend');
    }
  };

  useEffect(() => {
    if (response?.type === 'success') {
      setLoadingGoogle(true);
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(result => {
          if (!result.user.email) throw new Error('No email linked to this Google Account.');
          return performDjangoLogin(result.user);
        })
        .catch(err => {
          Alert.alert('Authentication Failed', err.message);
          setLoadingGoogle(false);
        });
    }
  }, [response]);

  const handleGoogleAuth = async () => {
    setLoadingGoogle(true);
    try {
      if (Platform.OS === 'web') {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        if (!result.user.email) throw new Error('No email linked to this Google Account.');
        await performDjangoLogin(result.user);
      } else {
        await promptAsync();
        return;
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user') {
        Alert.alert('Authentication Failed', err.message);
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.');
      return;
    }

    if (!isLogin) {
      if (!fullName.trim()) {
        Alert.alert('Error', 'Please enter your full name.');
        return;
      }
      if (!phoneNumber.trim()) {
        Alert.alert('Error', 'Please enter your phone number.');
        return;
      }
      // Basic phone validation: at least 8 digits
      if (!/^\+?[0-9\s\-]{8,}$/.test(phoneNumber.trim())) {
        Alert.alert('Error', 'Please enter a valid phone number.');
        return;
      }
    }

    setLoadingEmail(true);
    const cleanEmail = email.trim();
    
    try {
      if (isLogin) {
        const data: any = await apiClient.post('/auth/login/', {
          email: cleanEmail,
          password
        });
        setToken(data.tokens.access);
        setDisplayName(data.user.full_name || data.user.username);
        router.replace('/dashboard');
      } else {
        // Enforce Cameroon phone format (+2376XXXXXXXX)
        let cleanPhone = phoneNumber.replace(/[^0-9+]/g, '');
        if (!cleanPhone.startsWith('+2376')) {
          const last8 = cleanPhone.slice(-8);
          cleanPhone = `+2376${last8}`;
        }

        const data: any = await apiClient.post('/auth/register/', {
          email: cleanEmail,
          password,
          full_name: fullName.trim(),
          phone_number: cleanPhone
        });
        setToken(data.tokens.access);
        setDisplayName(data.user.full_name || data.user.username);
        router.replace('/dashboard');
      }
    } catch (err: any) {
      Alert.alert('Authentication Error', err.message || 'Failed to authenticate');
    } finally {
      setLoadingEmail(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      {/* Back Button */}
      <TouchableOpacity
        onPress={() => router.push('/onboarding')}
        className="absolute top-14 left-6 z-10 w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-[#EAE5D9]"
        style={{ elevation: 2 }}
      >
        <Ionicons name="chevron-back" size={22} color="#0B3D2E" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 20 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="items-center mb-8 mt-8">
            <View className="w-20 h-20 bg-njangi-green/10 rounded-full items-center justify-center mb-4">
              <Ionicons name="shield-checkmark" size={32} color="#0B3D2E" />
            </View>
            <Text className="text-3xl font-extrabold text-njangi-green mb-2 text-center tracking-tight">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </Text>
            <Text className="text-sm font-medium text-[#6b665B] text-center max-w-[280px] leading-relaxed">
              {isLogin
                ? 'Log into your community and continue your journey.'
                : 'Join the Njangi community and start building wealth together.'}
            </Text>
          </View>

          {/* Form Fields */}
          <View className="w-full mb-2 gap-3">
            {/* Sign-up only: Full Name */}
            {!isLogin && (
              <View>
                <Text className="text-xs font-bold text-[#0B3D2E] mb-1 ml-1 uppercase tracking-wider">
                  Full Name
                </Text>
                <Input
                  placeholder="e.g. Marie Ngono"
                  autoCapitalize="words"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            )}

            {/* Email */}
            <View>
              <Text className="text-xs font-bold text-[#0B3D2E] mb-1 ml-1 uppercase tracking-wider">
                Email Address
              </Text>
              <Input
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Sign-up only: Phone Number */}
            {!isLogin && (
              <View>
                <Text className="text-xs font-bold text-[#0B3D2E] mb-1 ml-1 uppercase tracking-wider">
                  Phone Number
                </Text>
                <Input
                  placeholder="+237 6XX XXX XXX"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                />
              </View>
            )}

            {/* Password */}
            <View>
              <Text className="text-xs font-bold text-[#0B3D2E] mb-1 ml-1 uppercase tracking-wider">
                Password
              </Text>
              <Input
                placeholder={isLogin ? 'Enter your password' : 'Min. 6 characters'}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Toggle Login / Sign-up */}
          <TouchableOpacity className="self-end mb-6 mt-2" onPress={toggleMode}>
            <Text className="text-[12px] font-bold text-njangi-orange">
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Log in'}
            </Text>
          </TouchableOpacity>

          {/* Actions */}
          <View className="w-full gap-4">
            <Button
              title={isLogin ? 'Log In' : 'Create Account'}
              onPress={handleEmailAuth}
              variant="primary"
              loading={loadingEmail}
            />

            <View className="flex-row items-center justify-center py-2">
              <View className="flex-1 h-[1px] bg-[#EAE5D9]" />
              <Text className="px-4 text-[#6b665B] font-medium text-xs uppercase tracking-wider">OR</Text>
              <View className="flex-1 h-[1px] bg-[#EAE5D9]" />
            </View>

            <TouchableOpacity
              onPress={handleGoogleAuth}
              disabled={loadingGoogle}
              className="w-full bg-white h-[56px] rounded-[16px] border-2 border-[#EAE5D9] flex-row items-center justify-center shadow-sm"
            >
              <Ionicons name="logo-google" size={20} color="#DB4437" style={{ marginRight: 12 }} />
              <Text className="text-[#333333] font-bold text-[16px]">
                {loadingGoogle ? 'Connecting...' : 'Continue with Google'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
