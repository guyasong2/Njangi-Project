import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState, useEffect } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { BottomNav } from '../src/components/ui/BottomNav';
import { apiClient } from '../src/api/client';
import { useUIStore } from '../src/store/uiStore';
import { useAuthStore } from '../src/store/useAuthStore';
import Animated, { FadeIn } from 'react-native-reanimated';

// Helper to resolve media URLs properly if they are relative paths
const resolveMediaUrl = (path?: string) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  
  const host = Platform.OS === 'web'
    ? (typeof window !== 'undefined' ? window.location.hostname : '127.0.0.1')
    : '172.20.10.8';
  return `http://${host}:8001${path}`;
};

export default function Profile() {
  const { toggleSidebar } = useUIStore();
  const photoUrl = useAuthStore(state => state.photoUrl);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode States
  const [isEditMode, setIsEditMode] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [newProfilePicUri, setNewProfilePicUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // KYC States
  const [isKYCExpanded, setIsKYCExpanded] = useState(false);
  const [isUploadingKYC, setIsUploadingKYC] = useState(false);
  const [kycIdNumber, setKycIdNumber] = useState('');
  const [kycFrontImage, setKycFrontImage] = useState<string | null>(null);
  const [kycBackImage, setKycBackImage] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await apiClient.get('/auth/profile/') as any;
      setProfile(response);
      setEditUsername(response.username || response.full_name || '');
    } catch (err: any) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const pickProfileImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setNewProfilePicUri(result.assets[0].uri);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setIsSaving(true);
      const formData = new FormData();
      
      formData.append('username', editUsername);
      if (editPassword) {
        formData.append('password', editPassword);
      }
      if (newProfilePicUri) {
        formData.append('profile_picture', {
          uri: newProfilePicUri,
          name: 'profile_pic.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const response = await apiClient.patch('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }) as any;

      setProfile(response);
      setIsEditMode(false);
      setEditPassword('');
      setNewProfilePicUri(null);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to save profile:', err);
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const pickKycImage = async (side: 'front' | 'back') => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (side === 'front') setKycFrontImage(result.assets[0].uri);
      else setKycBackImage(result.assets[0].uri);
    }
  };

  const submitKYCForm = async () => {
    if (!kycIdNumber || !kycFrontImage || !kycBackImage) {
      Alert.alert('Incomplete Form', 'Please fill in your ID number and upload both front and back images.');
      return;
    }

    try {
      setIsUploadingKYC(true);
      const formData = new FormData();
      formData.append('id_number', kycIdNumber);
      
      // We pass the front image as the main kyc_document to satisfy backend requirements for now
      formData.append('kyc_document', {
        uri: kycFrontImage,
        name: 'kyc_front.jpg',
        type: 'image/jpeg',
      } as any);
      
      // Also send the back image if backend gets updated to support it
      formData.append('kyc_document_back', {
        uri: kycBackImage,
        name: 'kyc_back.jpg',
        type: 'image/jpeg',
      } as any);

      const response = await apiClient.patch('/auth/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }) as any;
      
      setProfile(response);
      setIsKYCExpanded(false);
      Alert.alert('Success', 'KYC documents submitted successfully! Verification is pending.');
    } catch (err: any) {
      console.error('Failed to submit KYC:', err);
      Alert.alert('Error', 'Failed to submit KYC documents.');
    } finally {
      setIsUploadingKYC(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0B3D2E" />
      </SafeAreaView>
    );
  }

  const trustScore = profile?.trust_score || 500;
  const referralBonus = parseFloat(profile?.referral_bonus || '0').toLocaleString();
  const totalSaved = parseFloat(profile?.total_saved || '0').toLocaleString();
  const kycStatus = profile?.kyc_status || 'unverified'; // unverified, pending, verified

  // Dynamic trust score label based on score band
  const trustLabel = trustScore >= 800 ? 'Excellent' : trustScore >= 650 ? 'Good' : trustScore >= 500 ? 'Fair' : 'Building';

  // Achievements unlocked by reaching score thresholds and group activity
  const groupsLed = profile?.groups_led || 0;
  const achievements = [
    trustScore >= 500 && { title: 'Consistent Contributor', icon: 'sync-circle-outline' },
    trustScore >= 650 && { title: 'Trustworthy Peer', icon: 'hand-okay' },
    groupsLed >= 1  && { title: 'Community Leader', icon: 'ribbon-outline' },
  ].filter(Boolean) as { title: string; icon: string }[];

  const hasAchievements = achievements.length > 0;

  const displayProfilePic = newProfilePicUri 
    ? { uri: newProfilePicUri }
    : profile?.profile_picture 
      ? { uri: resolveMediaUrl(profile.profile_picture)! }
      : photoUrl 
        ? { uri: photoUrl }
        : require('../assets/images/pp.png');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        >
        
        {/* Header */}
        <View className="px-6 pt-4 flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={toggleSidebar}>
            <Ionicons name="menu" size={28} color="#0B3D2E" />
          </TouchableOpacity>
          <Text className="text-xl font-extrabold text-[#0B3D2E] tracking-tight">Profile</Text>
          <TouchableOpacity onPress={() => {
            if (isEditMode) {
              handleSaveProfile();
            } else {
              setIsEditMode(true);
            }
          }}>
            {isSaving ? (
              <ActivityIndicator size="small" color="#0B3D2E" />
            ) : (
              <Text className="text-md font-bold text-[#F5A623]">
                {isEditMode ? 'Save' : 'Edit'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* User Identity Section */}
        <View className="items-center mb-8 px-6">
          <TouchableOpacity 
            className="relative"
            onPress={isEditMode ? pickProfileImage : undefined}
            disabled={!isEditMode}
          >
            <View className="w-24 h-24 rounded-full border-4 border-white shadow-sm overflow-hidden bg-white">
               <Image 
                source={displayProfilePic}
                className="w-full h-full"
               />
            </View>
            {isEditMode && (
              <View className="absolute inset-0 bg-black/40 rounded-full items-center justify-center">
                <Ionicons name="camera" size={24} color="white" />
              </View>
            )}
            <View className="absolute bottom-0 right-[-10px] bg-[#F5A623] px-3 py-1 rounded-full flex-row items-center border-2 border-white">
              <Ionicons name="shield-checkmark" size={12} color="#0B3D2E" />
              <Text className="text-[10px] font-black text-[#0B3D2E] ml-1">
                {kycStatus === 'verified' ? 'VERIFIED' : kycStatus === 'pending' ? 'PENDING' : 'MEMBER'}
              </Text>
            </View>
          </TouchableOpacity>

          {isEditMode ? (
            <View className="w-full mt-6">
              <Text className="text-xs font-bold text-[#6b665B] mb-2 uppercase">Username</Text>
              <TextInput 
                className="bg-white rounded-2xl px-4 py-3 font-bold text-[#333333] border border-[#EAE5D9] mb-4"
                value={editUsername}
                onChangeText={setEditUsername}
                placeholder="Enter Username"
              />
              <Text className="text-xs font-bold text-[#6b665B] mb-2 uppercase">New Password</Text>
              <TextInput 
                className="bg-white rounded-2xl px-4 py-3 font-bold text-[#333333] border border-[#EAE5D9]"
                value={editPassword}
                onChangeText={setEditPassword}
                placeholder="Leave blank to keep current"
                secureTextEntry
              />
            </View>
          ) : (
            <>
              <Text className="text-2xl font-black text-[#333333] mt-4 uppercase tracking-tighter">
                {profile?.username || profile?.full_name || 'Njangi Member'}
              </Text>
              <Text className="text-sm font-medium text-[#6b665B] mt-1">
                Njangi Member since {profile?.member_since || '2024'}
              </Text>
            </>
          )}
        </View>

        {!isEditMode && (
          <>
            {/* Row Layout for Trust Score & Stats */}
            <View className="px-6 mb-8 flex-row gap-4">
               {/* Smaller Trust Score Card */}
               <View className="flex-1 bg-white rounded-[30px] p-4 shadow-sm border border-[#EAE5D9] items-center relative overflow-hidden">
                   <View className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-[#F5F1E8]/30 rounded-full" />
                   
                   <Text className="text-[11px] font-extrabold text-[#333333] mb-4 uppercase">Trust Score</Text>
                   
                   {/* Smaller Gauge */}
                   <View className="w-24 h-24 rounded-full border-[8px] border-[#EAE5D9] items-center justify-center">
                       <View className="absolute w-24 h-24 rounded-full border-[8px] border-[#F5A623] border-b-transparent border-l-transparent" style={{ transform: [{ rotate: '45deg' }] }} />
                       <View className="items-center">
                           <Text className="text-xl font-black text-[#0B3D2E]">{trustScore}</Text>
                       </View>
                   </View>
    
                   <View className="bg-[#FAF8F3] px-3 py-1 rounded-full mt-3">
                       <Text className="text-[10px] font-extrabold text-[#B07722]">{trustLabel}</Text>
                   </View>
               </View>

               {/* Right Side Stats */}
               <View className="flex-1 gap-4">
                  {/* Total Saved Mini Card */}
                  <View className="flex-1 bg-[#0B3D2E] rounded-[30px] p-4 justify-center shadow-md">
                      <Text className="text-white/70 font-bold text-[9px] uppercase tracking-widest mb-1">Total Saved</Text>
                      <Text className="text-lg font-black text-white">FCFA {totalSaved}</Text>
                  </View>
                  {/* Referral Mini Card */}
                  <View className="flex-1 bg-[#EAE5D9]/40 rounded-[30px] p-4 justify-center border border-[#EAE5D9]/50">
                      <Text className="text-[9px] font-bold text-[#6b665B] uppercase tracking-widest mb-1">Referrals</Text>
                      <Text className="text-lg font-black text-[#333333]">{referralBonus}</Text>
                  </View>
               </View>
            </View>
    
            {/* Achievements Section */}
            <View className="mb-8 pl-6">
                <Text className="text-sm font-extrabold text-[#333333] mb-4">Achievements</Text>
                {hasAchievements ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                      {achievements.map((item, idx) => (
                        <View key={idx} className="w-32 h-36 bg-white rounded-[30px] p-4 mr-4 items-center justify-center shadow-sm border border-[#EAE5D9]">
                            <View className="w-12 h-12 bg-[#F5F1E8] rounded-full items-center justify-center mb-3">
                               {item.icon.includes('hand') ?
                                 <MaterialCommunityIcons name={item.icon as any} size={24} color="#B07722" /> :
                                 <Ionicons name={item.icon as any} size={24} color="#0B3D2E" />
                               }
                            </View>
                            <Text className="text-[10px] font-bold text-center text-[#333333] leading-relaxed">{item.title}</Text>
                        </View>
                      ))}
                  </ScrollView>
                ) : (
                  <View className="bg-[#F5F1E8] rounded-3xl p-5 border border-dashed border-[#EAE5D9] items-center">
                    <Ionicons name="trophy-outline" size={32} color="#EAE5D9" />
                    <Text className="text-[#A09C90] text-xs font-medium mt-2 text-center">Keep contributing to unlock achievements</Text>
                  </View>
                )}
            </View>
    
            {/* Bank Accounts Section */}
            <View className="px-6 mb-8">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-sm font-extrabold text-[#333333]">Linked Accounts & Cards</Text>
                <TouchableOpacity>
                  <Ionicons name="add-circle" size={24} color="#F5A623" />
                </TouchableOpacity>
              </View>

              {profile?.linked_accounts && profile.linked_accounts.length > 0 ? (
                <View className="bg-white rounded-3xl p-2 shadow-sm border border-[#FAF8F3]">
                  {profile.linked_accounts.map((account: any, idx: number) => (
                    <TouchableOpacity key={account.id || idx} className="flex-row items-center p-3 mb-1 border-b border-[#F5F1E8]">
                      <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: `${account.color || '#0B3D2E'}15` }}>
                        <Ionicons name={(account.icon || 'card-outline') as any} size={18} color={account.color || '#0B3D2E'} />
                      </View>
                      <View className="flex-1">
                        <Text className="font-bold text-[#333333] text-[13px]">{account.name}</Text>
                        <Text className="text-[10px] font-medium text-[#A09C90]">**** **** {account.last4 || '****'}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={16} color="#A09C90" />
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <TouchableOpacity className="bg-white rounded-3xl p-5 shadow-sm border border-dashed border-[#EAE5D9] items-center flex-row justify-center">
                  <Ionicons name="add-circle-outline" size={20} color="#F5A623" />
                  <Text className="text-[#6b665B] font-bold text-sm ml-2">Link a Mobile Money or Bank Account</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* KYC Section */}
            <View className="px-6 mb-8">
              <Text className="text-sm font-extrabold text-[#333333] mb-4">Identity Verification</Text>
              <View className="bg-white rounded-3xl p-5 shadow-sm border border-[#FAF8F3]">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 bg-[#F5F1E8] rounded-full items-center justify-center mr-3">
                      <Ionicons name="id-card-outline" size={20} color="#0B3D2E" />
                    </View>
                    <View>
                      <Text className="font-bold text-[#333333]">KYC Status</Text>
                      <Text className={`text-xs font-bold ${kycStatus === 'verified' ? 'text-green-600' : kycStatus === 'pending' ? 'text-[#F5A623]' : 'text-red-500'}`}>
                        {kycStatus.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  {kycStatus === 'verified' && (
                    <Ionicons name="checkmark-circle" size={24} color="green" />
                  )}
                </View>
                
                {kycStatus !== 'verified' && !isKYCExpanded && (
                  <TouchableOpacity 
                    onPress={() => setIsKYCExpanded(true)}
                    className="bg-[#0B3D2E] rounded-2xl py-3 items-center justify-center flex-row"
                  >
                    <Ionicons name="shield-half-outline" size={18} color="white" className="mr-2" />
                    <Text className="text-white font-bold ml-2">
                      Complete Verification
                    </Text>
                  </TouchableOpacity>
                )}

                {/* Expanded KYC Form */}
                {kycStatus !== 'verified' && isKYCExpanded && (
                  <View className="mt-4 pt-4 border-t border-[#F5F1E8]">
                    <Text className="text-xs font-bold text-[#6b665B] mb-2 uppercase">ID Card or Passport Number</Text>
                    <TextInput 
                      className="bg-[#F5F1E8] rounded-2xl px-4 py-3 font-bold text-[#333333] mb-4"
                      placeholder="Enter ID Number"
                      value={kycIdNumber}
                      onChangeText={setKycIdNumber}
                    />

                    <Text className="text-xs font-bold text-[#6b665B] mb-2 uppercase">ID Document Upload</Text>
                    <View className="flex-row gap-3 mb-4">
                      {/* Front Image */}
                      <TouchableOpacity 
                        onPress={() => pickKycImage('front')}
                        className="flex-1 h-24 bg-[#F5F1E8] rounded-2xl items-center justify-center overflow-hidden border-2 border-dashed border-[#EAE5D9]"
                      >
                        {kycFrontImage ? (
                          <Image source={{ uri: kycFrontImage }} className="w-full h-full" />
                        ) : (
                          <>
                            <Ionicons name="camera-outline" size={20} color="#A09C90" mb={4} />
                            <Text className="text-[10px] font-bold text-[#A09C90]">Front Side</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      
                      {/* Back Image */}
                      <TouchableOpacity 
                        onPress={() => pickKycImage('back')}
                        className="flex-1 h-24 bg-[#F5F1E8] rounded-2xl items-center justify-center overflow-hidden border-2 border-dashed border-[#EAE5D9]"
                      >
                        {kycBackImage ? (
                          <Image source={{ uri: kycBackImage }} className="w-full h-full" />
                        ) : (
                          <>
                            <Ionicons name="camera-outline" size={20} color="#A09C90" mb={4} />
                            <Text className="text-[10px] font-bold text-[#A09C90]">Back Side</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity 
                      onPress={submitKYCForm}
                      disabled={isUploadingKYC}
                      className={`bg-[#0B3D2E] rounded-2xl py-3 items-center justify-center flex-row ${isUploadingKYC ? 'opacity-50' : ''}`}
                    >
                      {isUploadingKYC ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white font-bold">Submit Documents</Text>
                      )}
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setIsKYCExpanded(false)}
                      className="py-3 items-center justify-center mt-1"
                    >
                      <Text className="text-[#A09C90] font-bold text-xs">Cancel</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
    
            {/* Settings List Section */}
            <View className="px-6 mb-8">
                {[
                    { title: 'Security & PIN', icon: 'lock-closed-outline' },
                    { title: 'Help & Support', icon: 'help-circle-outline' }
                ].map((item, idx) => (
                    <TouchableOpacity 
                        key={idx} 
                        className="flex-row items-center bg-white rounded-3xl p-5 mb-3 shadow-sm border border-[#FAF8F3]"
                    >
                        <View className="w-10 h-10 bg-[#F5F1E8] rounded-full items-center justify-center mr-4">
                            <Ionicons name={item.icon as any} size={20} color="#0B3D2E" />
                        </View>
                        <Text className="flex-1 font-bold text-[#333333]">{item.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color="#A09C90" />
                    </TouchableOpacity>
                ))}
            </View>
    
            {/* Invite Button */}
            <View className="px-6 mb-10">
                <TouchableOpacity className="bg-[#F5A623] h-16 rounded-3xl items-center justify-center flex-row shadow-lg">
                    <Ionicons name="person-add" size={20} color="#0B3D2E" className="mr-2" />
                    <Text className="text-[#0B3D2E] font-black tracking-tight text-lg ml-2">Invite Friends</Text>
                </TouchableOpacity>
            </View>
          </>
        )}

        {/* Spacer for BottomNav */}
        <View className="h-20" />

      </ScrollView>
      </Animated.View>
      <BottomNav />
    </SafeAreaView>
  );
}
