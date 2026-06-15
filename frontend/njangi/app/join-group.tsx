import { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { SuccessModal } from '../src/components/ui/SuccessModal';
import { apiClient } from '../src/api/client';

export default function JoinGroup() {
   const router = useRouter();
   const [loading, setLoading] = useState(false);
   const [groupId, setGroupId] = useState('');
   const [successModalVisible, setSuccessModalVisible] = useState(false);

   const handleJoin = async () => {
      if (!groupId) {
         Alert.alert('Missing Field', 'Please provide a valid Group ID.');
         return;
      }
      setLoading(true);
      try {
         await apiClient.post(`/groups/${groupId}/join/`);
         setSuccessModalVisible(true);
      } catch (err: any) {
         Alert.alert('Join Failed', err.response?.data?.error || err.message || 'Could not join group');
      } finally {
         setLoading(false);
      }
   };

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
         <View className="flex-row items-center px-6 py-4">
            <TouchableOpacity
               onPress={() => {
                  if (router.canGoBack()) {
                     router.back();
                  } else {
                     router.replace('/dashboard');
                  }
               }}
               className="w-10 h-10 rounded-[20px] bg-[#EAE5D9] items-center justify-center"
            >
               <Ionicons name="arrow-back" size={20} color="#0B3D2E" />
            </TouchableOpacity>
            <Text className="text-lg font-extrabold text-[#333333] ml-4">Join Tontine</Text>
         </View>

         <View className="flex-1 px-6 mt-4">
            <View className="mb-6 mt-4">
               <Text className="text-[#6b665B] font-medium leading-relaxed">
                  Enter the unique Group ID provided by the community Administrator to sync into their active cycle.
               </Text>
            </View>

            <View className="mb-4">
               <Text className="text-[#333333] font-bold text-xs uppercase mb-2 ml-1">Group ID Number</Text>
               <Input placeholder="e.g. 5" keyboardType="numeric" value={groupId} onChangeText={setGroupId} />
            </View>

         </View>

         <View className="p-6 pt-2">
            <Button title="Join Group" onPress={handleJoin} loading={loading} />
         </View>

         <SuccessModal
            visible={successModalVisible}
            message="You have successfully joined the Njangi group!"
            onClose={() => {
               setSuccessModalVisible(false);
               router.replace('/dashboard');
            }}
         />
      </SafeAreaView>
   );
}
