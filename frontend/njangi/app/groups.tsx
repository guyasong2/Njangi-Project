import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { BottomNav } from '../src/components/ui/BottomNav';
import { apiClient } from '../src/api/client';
import { useUIStore } from '../src/store/uiStore';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function GroupsScreen() {
   const router = useRouter();
   const { toggleSidebar } = useUIStore();
   const [data, setData] = useState<any>(null);
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      const fetchGroupsData = async () => {
         try {
            const response = await apiClient.get('/auth/dashboard/');
            setData(response);
         } catch (err: any) {
            console.error('Failed to fetch groups data:', err);
         } finally {
            setLoading(false);
         }
      };
      fetchGroupsData();
   }, []);

   if (loading) {
      return (
         <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#0B3D2E" />
         </SafeAreaView>
      )
   }

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
         <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
            <ScrollView 
               className="flex-1 px-6 pt-4" 
               showsVerticalScrollIndicator={false}
               contentContainerStyle={{ paddingBottom: 150 }}
            >
               {/* Header */}
               <View className="flex-row items-center justify-between mb-8">
                  <TouchableOpacity onPress={toggleSidebar}>
                     <Ionicons name="menu" size={28} color="#0B3D2E" />
                  </TouchableOpacity>
                  <Text className="text-xl font-extrabold text-[#0B3D2E] tracking-tight">Groups</Text>
                  <TouchableOpacity>
                     <Ionicons name="notifications-outline" size={24} color="#0B3D2E" />
                  </TouchableOpacity>
               </View>

               {/* Discovery Section */}
               <View className="mb-8">
                  <View className="flex-row items-center justify-between mb-4">
                     <Text className="text-lg font-extrabold text-[#333333]">Discover Circles</Text>
                  </View>

                  {data?.discovery_groups?.length > 0 ? (
                     <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                        {data.discovery_groups.map((group: any) => (
                           <TouchableOpacity
                              key={group.id}
                              onPress={() => router.push({ pathname: '/group-details', params: { id: group.id } })}
                              className="w-[200px] bg-[#E2F0EA] rounded-[30px] p-5 mr-4 shadow-sm h-[180px] justify-between border border-[#FAF8F3]"
                           >
                              <View className="flex-row items-center justify-between">
                                 <View className="w-10 h-10 rounded-full bg-white/50 items-center justify-center">
                                    <Ionicons name="compass-outline" size={20} color="#0B3D2E" />
                                 </View>
                                 <View className="bg-[#0B3D2E] px-2 py-1 rounded-md">
                                    <Text className="text-[10px] font-bold text-white uppercase">{group.frequency}</Text>
                                 </View>
                              </View>
                              <View>
                                 <Text className="text-[16px] font-extrabold text-[#333333]" numberOfLines={1}>{group.name}</Text>
                                 <Text className="text-[12px] font-bold text-[#0B3D2E] mt-1">{group.contribution_amount} XAF / cycle</Text>
                              </View>
                           </TouchableOpacity>
                        ))}
                     </ScrollView>
                  ) : (
                     <View className="bg-white/50 p-6 rounded-3xl border border-dashed border-[#EAE5D9] items-center">
                        <Text className="text-[#6b665B] font-medium text-center italic">No new public circles found at the moment.</Text>
                     </View>
                  )}
               </View>

               {/* My Memberships */}
               <View className="mb-6">
                  <Text className="text-lg font-extrabold text-[#333333] mb-4">Your Active Njangis</Text>
                  {data?.memberships?.map((group: any, idx: number) => (
                     <TouchableOpacity
                        key={group.id}
                        onPress={() => router.push({ pathname: '/group-details', params: { id: group.id } })}
                        className="bg-white rounded-[25px] p-5 mb-4 shadow-sm border border-[#FAF8F3] flex-row items-center"
                     >
                        <View className={`w-14 h-14 rounded-2xl items-center justify-center ${idx % 2 === 0 ? 'bg-[#Dbf1ea]' : 'bg-[#FDEBE1]'}`}>
                           <Ionicons name={idx % 2 === 0 ? "people" : "storefront"} size={24} color={idx % 2 === 0 ? "#0B3D2E" : "#B07722"} />
                        </View>
                        <View className="flex-1 ml-4">
                           <Text className="text-[16px] font-bold text-[#333333]">{group.name}</Text>
                           <Text className="text-[12px] text-[#6b665B] mt-1">{group.total_members} members • {group.frequency}</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#EAE5D9" />
                     </TouchableOpacity>
                  ))}

                  {data?.memberships?.length === 0 && (
                     <View className="items-center py-10">
                        <Ionicons name="people-outline" size={48} color="#EAE5D9" />
                        <Text className="text-[#A09C90] font-bold mt-4">You haven&apos;t joined any groups yet.</Text>
                     </View>
                  )}
               </View>

               <View className="h-20" />
            </ScrollView>
         </Animated.View>
         <BottomNav />
      </SafeAreaView>
   );
}
