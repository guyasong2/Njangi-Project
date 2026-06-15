import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Input } from '../src/components/ui/Input';
import { Button } from '../src/components/ui/Button';
import { SuccessModal } from '../src/components/ui/SuccessModal';
import { apiClient } from '../src/api/client';

export default function CreateGroup() {
   const router = useRouter();
   const [loading, setLoading] = useState(false);
   const [name, setName] = useState('');
   const [amount, setAmount] = useState('');
   const [cycleLength, setCycleLength] = useState('12');
   const [frequency, setFrequency] = useState('MONTHLY');
   const [isPrivate, setIsPrivate] = useState(false);
   const [successModalVisible, setSuccessModalVisible] = useState(false);

   const handleCreate = async () => {
      if (!name || !amount) {
         Alert.alert('Missing Fields', 'Please provide a name and contribution amount.');
         return;
      }
      setLoading(true);
      try {
         await apiClient.post('/groups/', {
            name,
            contribution_amount: amount,
            cycle_length: parseInt(cycleLength, 10),
            frequency,
            is_private: isPrivate
         });
         setSuccessModalVisible(true);
      } catch (err: any) {
         Alert.alert('Creation Failed', err.message);
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
            <Text className="text-lg font-extrabold text-[#333333] ml-4">Create Njangi</Text>
         </View>

         <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
            <View className="mb-6 mt-4">
               <Text className="text-[#6b665B] font-medium leading-relaxed">
                  Establish a new Njangi savings ecosystem. As the creator, you will be assigned as the Administrator and receive the first payout cycle.
               </Text>
            </View>

            <View className="space-y-4 gap-4">
               <View>
                  <Text className="text-[#333333] font-bold text-xs uppercase mb-2 ml-1">Group Name</Text>
                  <Input placeholder="e.g. Market Women Collective" value={name} onChangeText={setName} />
               </View>

               <View>
                  <Text className="text-[#333333] font-bold text-xs uppercase mb-2 ml-1">Contribution Amount (XAF)</Text>
                  <Input placeholder="e.g. 10000" keyboardType="numeric" value={amount} onChangeText={setAmount} />
               </View>

               <View>
                  <Text className="text-[#333333] font-bold text-xs uppercase mb-2 ml-1">Cycle Length (Members)</Text>
                  <Input placeholder="12" keyboardType="numeric" value={cycleLength} onChangeText={setCycleLength} />
               </View>

               <View>
                  <Text className="text-[#333333] font-bold text-xs uppercase mb-2 ml-1">Frequency</Text>
                  <View className="flex-row justify-between gap-4">
                     <TouchableOpacity
                        onPress={() => setFrequency('WEEKLY')}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${frequency === 'WEEKLY' ? 'border-[#0B3D2E] bg-[#Dbf1ea]' : 'border-[#EAE5D9] bg-white'}`}
                     >
                        <Text className={`font-extrabold ${frequency === 'WEEKLY' ? 'text-[#0B3D2E]' : 'text-[#A09C90]'}`}>Weekly</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        onPress={() => setFrequency('MONTHLY')}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${frequency === 'MONTHLY' ? 'border-[#B07722] bg-[#FDEBE1]' : 'border-[#EAE5D9] bg-white'}`}
                     >
                        <Text className={`font-extrabold ${frequency === 'MONTHLY' ? 'text-[#B07722]' : 'text-[#A09C90]'}`}>Monthly</Text>
                     </TouchableOpacity>
                  </View>
               </View>

               <View className="mt-2">
                  <Text className="text-[#333333] font-bold text-xs uppercase mb-2 ml-1">Visibility</Text>
                  <View className="flex-row justify-between gap-4">
                     <TouchableOpacity
                        onPress={() => setIsPrivate(false)}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${!isPrivate ? 'border-[#0B3D2E] bg-[#Dbf1ea]' : 'border-[#EAE5D9] bg-white'}`}
                     >
                        <Text className={`font-extrabold ${!isPrivate ? 'text-[#0B3D2E]' : 'text-[#A09C90]'}`}>Public</Text>
                     </TouchableOpacity>
                     <TouchableOpacity
                        onPress={() => setIsPrivate(true)}
                        className={`flex-1 p-4 rounded-xl border-2 items-center ${isPrivate ? 'border-[#333333] bg-[#EAE5D9]' : 'border-[#EAE5D9] bg-white'}`}
                     >
                        <View className="flex-row items-center">
                           <Ionicons name="lock-closed" size={14} color={isPrivate ? "#333333" : "#A09C90"} style={{ marginRight: 4 }} />
                           <Text className={`font-extrabold ${isPrivate ? 'text-[#333333]' : 'text-[#A09C90]'}`}>Private</Text>
                        </View>
                     </TouchableOpacity>
                  </View>
                  <Text className="text-[10px] text-[#6b665B] mt-2 ml-1 italic">
                     {isPrivate ? "Private groups are only visible to members you invite." : "Public groups appear in the 'Discovery' section for anyone to join."}
                  </Text>
               </View>
            </View>
         </ScrollView>

         <View className="p-6 pt-2">
            <Button title="Create Group" onPress={handleCreate} loading={loading} />
         </View>

         <SuccessModal
            visible={successModalVisible}
            message="You have successfully created the Njangi group!"
            onClose={() => {
               setSuccessModalVisible(false);
               router.replace('/dashboard');
            }}
         />
      </SafeAreaView>
   );
}
