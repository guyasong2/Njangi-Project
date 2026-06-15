import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { MomoModal, MomoActionType } from '../src/components/ui/MomoModal';
import { BottomNav } from '../src/components/ui/BottomNav';
import { apiClient } from '../src/api/client';
import { useUIStore } from '../src/store/uiStore';
import { useAuthStore } from '../src/store/useAuthStore';

export default function Dashboard() {
  const router = useRouter();
  const toggleSidebar = useUIStore(state => state.toggleSidebar);
  const storedDisplayName = useAuthStore(state => state.displayName);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActionType, setModalActionType] = useState<MomoActionType>('deposit');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiClient.get('/auth/dashboard/');
        setData(response);
      } catch (err: any) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
     return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8', justifyContent: 'center', alignItems: 'center' }}>
           <ActivityIndicator size="large" color="#0B3D2E" />
           <Text className="mt-4 text-[#0B3D2E] font-bold">Syncing Wallet...</Text>
        </SafeAreaView>
     )
  }

  // Derive first name: stored name → API name → fallback
  const rawName = storedDisplayName || data?.user?.name || 'Member';
  const firstName = rawName.split(' ')[0];

  // Determine if this is a brand-new user (no groups, no balance ever)
  const availableB = parseFloat(data?.wallet?.available_balance || '0');
  const lockedB = parseFloat(data?.wallet?.locked_balance || '0');
  const isNew = data?.memberships?.length === 0 && availableB === 0 && lockedB === 0;

  // Greeting line
  const greetingTitle = isNew
    ? `Welcome to Njangi, ${firstName}! 🌱`
    : `Welcome back, ${firstName}! 👋`;

  let dynamicMessage = 'Your community wealth is growing.';
  if (isNew) {
    dynamicMessage = 'Start your wealth journey by joining a tontine.';
  } else if (availableB > 50000) {
    dynamicMessage = 'Your wallet is thriving! Great job saving.';
  } else if (lockedB > 0) {
    dynamicMessage = 'Your locked savings are securing your future.';
  } else if (data?.memberships?.length > 2) {
    dynamicMessage = 'You are an active community leader.';
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>

        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
           <TouchableOpacity onPress={toggleSidebar}>
             <Ionicons name="menu" size={28} color="#0B3D2E" />
           </TouchableOpacity>
           <Text className="text-xl font-extrabold text-njangi-green tracking-tight">Njangi</Text>
           <TouchableOpacity>
             <Ionicons name="notifications-outline" size={24} color="#0B3D2E" />
           </TouchableOpacity>
        </View>

        {/* Greeting */}
        <View className="mb-6">
           <Text className="text-xl font-extrabold text-[#333333] mb-1">{greetingTitle}</Text>
           <Text className="text-sm font-medium text-[#6b665B]">{dynamicMessage}</Text>
        </View>

        {/* Wallet Hero Card */}
        <View className="w-full bg-[#0B3D2E] rounded-[30px] p-6 mb-6 shadow-md h-[180px] justify-between relative overflow-hidden">
           <View>
             <Text className="text-white/70 font-semibold text-xs tracking-wider mb-2 uppercase">Wallet Balance</Text>
             <View className="flex-row items-end">
                <Text className="text-[40px] font-black text-[#F5A623]">{data?.wallet?.available_balance || '0.00'}</Text>
                <Text className="text-white font-bold text-lg mb-2 ml-2">XAF</Text>
             </View>
           </View>

           <View className="flex-row items-center justify-between mt-auto">
              <TouchableOpacity 
                 onPress={() => { setModalActionType('deposit'); setModalVisible(true); }}
                 className="bg-[#F5A623] px-6 py-3 rounded-full flex-row items-center">
                 <Ionicons name="add" size={18} color="#0B3D2E" />
                 <Text className="text-[#0B3D2E] font-bold ml-1">Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                 onPress={() => { setModalActionType('send'); setModalVisible(true); }}
                 className="bg-white/10 px-8 py-3 rounded-full flex-row items-center border border-white/20">
                 <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                 <Text className="text-white font-bold ml-2">Send</Text>
              </TouchableOpacity>
           </View>
        </View>

        {/* Stat Cards */}
        <View className="flex-row justify-between mb-8 gap-4">
           {/* Locked Savings */}
           <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm justify-between min-h-[160px] border border-[#EAE5D9]">
              <View className="flex-row justify-between items-start mb-2">
                 <View className="w-10 h-10 bg-[#F5F1E8] rounded-full justify-center items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#B07722" />
                 </View>
                 <View className="bg-[#FDEBE1] px-2 py-1 rounded-md">
                    <Text className="text-[9px] font-bold text-[#B07722] uppercase">Escrow</Text>
                 </View>
              </View>
              <View>
                <Text className="text-[#6b665B] font-semibold text-[11px] mb-1">Locked Savings</Text>
                <Text className="text-[20px] font-extrabold text-[#333333] tracking-tight">{data?.wallet?.locked_balance || '0'} <Text className="text-[12px]">XAF</Text></Text>
                <Text className="text-[#A09C90] text-[9px] mt-1 font-medium">Releases on payout</Text>
              </View>
           </View>

           {/* Next Payout - Snake Shape Avatars */}
           <TouchableOpacity 
              onPress={() => {
                 if (data?.memberships?.length > 0) {
                     router.push({ pathname: '/payout-queue', params: { groupId: data.memberships[0].id } });
                 }
              }}
              className="flex-1 bg-[#FDEBE1] rounded-3xl p-5 shadow-sm justify-between min-h-[160px] border border-[#FDEBE1]"
           >
              <View className="flex-row justify-between items-start mb-2">
                 <Text className="text-[#333333] font-bold text-[11px] uppercase tracking-widest">Next Payout</Text>
              </View>
              
              <View className="flex-1 justify-center items-center">
                 <View className="flex-row items-center">
                    {(() => {
                       let upcomingPayouts = [];
                       if (data?.memberships?.length > 0) {
                           upcomingPayouts = [...(data.memberships[0].memberships || [])].sort((a: any, b: any) => a.payout_order - b.payout_order);
                       }
                       if (upcomingPayouts.length === 0) {
                           return <Text className="text-[#A09C90] text-xs font-bold text-center">No payouts scheduled</Text>;
                       }
                       return upcomingPayouts.slice(0, 5).map((mem: any, i: number) => {
                           // The Snake effect: overlapping and alternating translateY
                           const isUp = i % 2 === 0;
                           return (
                               <View 
                                   key={mem.id || i} 
                                   style={{ 
                                       marginLeft: i === 0 ? 0 : -14, 
                                       zIndex: 10 - i, 
                                       transform: [{ translateY: isUp ? -6 : 6 }] 
                                   }}
                               >
                                   <View className="bg-[#B07722] w-4 h-4 rounded-full absolute -top-1 -right-1 z-20 items-center justify-center border-2 border-[#FDEBE1]">
                                      <Text className="text-[7px] text-white font-black">{mem.payout_order}</Text>
                                   </View>
                                   <Image 
                                      source={{ uri: `https://i.pravatar.cc/150?u=${mem.user?.id || i}` }} 
                                      className="w-11 h-11 rounded-full border-2 border-[#FDEBE1]" 
                                   />
                               </View>
                           )
                       });
                    })()}
                 </View>
              </View>
              
              <View className="items-center mt-2">
                 <Text className="text-[#6b665B] font-bold text-[9px] uppercase">Withdrawal Queue</Text>
              </View>
           </TouchableOpacity>
        </View>

        {/* Active Groups */}
        <View className="flex-row items-center justify-between mb-4">
           <Text className="text-lg font-extrabold text-[#333333]">Active Groups</Text>
           <TouchableOpacity>
             <Text className="text-xs font-bold text-[#0B3D2E]">View All</Text>
           </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-8 min-h-[200px]" contentContainerStyle={{ paddingRight: 20 }}>
           
           {data?.memberships?.length === 0 ? (
              <View className="w-[300px] bg-white rounded-[30px] p-6 border-dashed border-2 border-[#EAE5D9] items-center justify-center mr-4">
                 <Ionicons name="people-circle-outline" size={48} color="#Dbf1ea" className="mb-2" />
                 <Text className="text-center font-bold text-[#333333] mb-1">No Active Tontines</Text>
                 <Text className="text-center text-xs text-[#6b665B] mb-4">Join a circle or create your own ecosystem to start saving!</Text>
                 <TouchableOpacity onPress={() => router.push('/create-group')} className="bg-[#0B3D2E] px-4 py-2 rounded-full">
                    <Text className="text-white font-bold text-xs">Create Group</Text>
                 </TouchableOpacity>
              </View>
           ) : (
              data?.memberships?.map((groupData: any, idx: number) => {
                 // Dynamic styling alternating based on index
                 const isFirst = idx % 2 === 0;
                 return (
                  <TouchableOpacity 
                     key={groupData.id}
                     onPress={() => router.push({ pathname: '/group-details', params: { id: groupData.id } })}
                     className="w-[200px] bg-white rounded-3xl p-5 mr-4 shadow-sm h-[200px] justify-between border border-[#FAF8F3]"
                  >
                     <View className="flex-row items-center justify-between mb-4">
                        <View className={`w-12 h-12 rounded-full items-center justify-center ${isFirst ? 'bg-[#Dbf1ea]' : 'bg-[#FDEBE1]'}`}>
                           <Ionicons name={isFirst ? "people" : "storefront"} size={24} color={isFirst ? "#0B3D2E" : "#B07722"} />
                        </View>
                        <View className={`px-2 py-1 rounded-md ${isFirst ? 'bg-[#FDEBE1]' : 'bg-[#EAE5D9]'}`}>
                           <Text className={`text-[10px] font-extrabold ${isFirst ? 'text-[#B07722]' : 'text-[#6b665B]'}`}>{groupData.frequency}</Text>
                        </View>
                     </View>
                     <View className="mb-2">
                        <Text className="text-[16px] font-extrabold text-[#333333] numberOfLines={1}">{groupData.name}</Text>
                        <Text className="text-[11px] font-medium text-[#6b665B] mt-1">{groupData.total_members} / {groupData.cycle_length} members</Text>
                     </View>
                     <View>
                        <View className="flex-row justify-between mb-1">
                           <Text className="text-[10px] font-bold text-[#333333]">Progress</Text>
                           <Text className="text-[10px] font-bold text-[#333333]">{Math.round((groupData.total_members / groupData.cycle_length) * 100)}%</Text>
                        </View>
                        <View className="w-full h-2 bg-[#EAE5D9] rounded-full overflow-hidden">
                           <View style={{ width: `${(groupData.total_members / groupData.cycle_length) * 100}%` }} className={`h-full rounded-full ${isFirst ? 'bg-[#B07722]' : 'bg-[#0B3D2E]'}`} />
                        </View>
                     </View>
                  </TouchableOpacity>
                 )
              })
           )}

           {/* Static Join Group Card at the end of the map */}
           {data?.memberships?.length > 0 && (
             <TouchableOpacity 
                onPress={() => router.push('/join-group')}
                className="w-[100px] rounded-3xl items-center justify-center border-2 border-dashed border-[#EAE5D9] h-[200px]"
             >
                <Ionicons name="link" size={24} color="#A09C90" className="mb-2" />
                <Text className="text-[#6b665B] font-bold text-xs text-center">Join{'\n'}Group</Text>
             </TouchableOpacity>
           )}
           
        </ScrollView>

        {/* Promo Card */}
        <View className="bg-[#FAF8F3] rounded-3xl p-6 mb-[100px] border border-[#EAE5D9] flex-row items-center justify-between">
           <View className="flex-1 pr-4">
              <Text className="text-sm font-extrabold text-[#333333] mb-1">Grow Together</Text>
              <Text className="text-[12px] font-medium text-[#6b665B] leading-relaxed">
                 Invite 3 friends to join a new tontine and earn a 2% contribution bonus this month.
              </Text>
           </View>
           <View className="w-12 h-12 border border-njangi-green/20 rounded-full items-center justify-center">
              <Ionicons name="leaf-outline" size={24} color="#0B3D2E" />
           </View>
        </View>

      </ScrollView>

      {/* Floating Action Button purely for composition */}
      <TouchableOpacity 
         onPress={() => router.push('/create-group')}
         className="absolute bottom-[90px] right-6 w-14 h-14 bg-[#0B3D2E] rounded-full items-center justify-center shadow-lg z-10"
      >
         <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      <MomoModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        actionType={modalActionType} 
      />
      <BottomNav />
    </SafeAreaView>
  );
}
