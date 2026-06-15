import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { BottomNav } from '../src/components/ui/BottomNav';
import { apiClient } from '../src/api/client';

export default function GroupDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        setLoading(true);
        if (!id) {
           const dashRes: any = await apiClient.get('/auth/dashboard/');
           if (dashRes.memberships && dashRes.memberships.length > 0) {
              const firstGroupId = dashRes.memberships[0].id;
              const response = await apiClient.get(`/groups/${firstGroupId}/`);
              setGroup(response);
           }
        } else {
           const response = await apiClient.get(`/groups/${id}/`);
           setGroup(response);
           
           // Check if user is already a member by looking through memberships
           // In a real app, the API should return this info directly
           const dashRes: any = await apiClient.get('/auth/dashboard/');
           const isMem = dashRes.memberships?.find((m: any) => m.id.toString() === id.toString());
           if (isMem) setMembershipStatus('active');
        }
      } catch (err) {
        console.error("Failed to fetch group details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [id]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      const response: any = await apiClient.post(`/groups/${id}/join/`, {});
      setMembershipStatus('pending_next_cycle');
      alert(response.message || "You have successfully joined this group. Your participation will begin in the next cycle.");
    } catch (err: any) {
      alert(err.message || "Failed to join group.");
    } finally {
      setJoining(false);
    }
  };

  if (loading) {
     return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8', justifyContent: 'center', alignItems: 'center' }}>
           <ActivityIndicator size="large" color="#0B3D2E" />
        </SafeAreaView>
     )
  }

  if (!group) {
     return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8', justifyContent: 'center', alignItems: 'center' }}>
           <View className="items-center px-6">
              <Ionicons name="people-circle-outline" size={60} color="#Dbf1ea" className="mb-4" />
              <Text className="text-[#333333] font-bold text-lg mb-2">Group Not Found</Text>
              <TouchableOpacity onPress={() => router.replace('/dashboard')} className="bg-[#0B3D2E] px-8 py-4 rounded-full">
                 <Text className="text-white font-extrabold">Go Home</Text>
              </TouchableOpacity>
           </View>
        </SafeAreaView>
     )
  }

  const totalSavings = (group.contribution_amount * group.memberships?.length) || 0;
  const progressPercent = Math.round((group.memberships?.length / group.cycle_length) * 100) || 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        <ScrollView 
          className="flex-1 px-6 pt-4 relative" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        >
        
        {/* Header */}
         <View className="flex-row items-center justify-between mb-8">
            <TouchableOpacity 
               onPress={() => {
                  if (router.canGoBack()) {
                     router.back();
                  } else {
                     router.replace('/dashboard');
                  }
               }}
            >
              <Ionicons name="arrow-back" size={28} color="#0B3D2E" />
            </TouchableOpacity>
           <Text className="text-xl font-extrabold text-njangi-green tracking-tight">Njangi</Text>
           <TouchableOpacity>
             <Ionicons name="notifications-outline" size={24} color="#0B3D2E" />
           </TouchableOpacity>
        </View>

        {/* Hero Group Card */}
        <View className="w-full bg-[#0B3D2E] rounded-[30px] p-6 mb-4 shadow-md">
           <View className="flex-row justify-between items-start mb-4">
              <View className="bg-[#F5A623] px-3 py-1 rounded-full">
                 <Text className="text-[10px] font-black text-[#0B3D2E] tracking-widest uppercase">{membershipStatus === 'pending_next_cycle' ? 'PENDING' : 'ACTIVE'}</Text>
              </View>
              {group.is_private && <Ionicons name="lock-closed" size={16} color="white" />}
           </View>
           
           <Text className="text-white text-3xl font-extrabold leading-tight mb-2">{group.name}</Text>
           <Text className="text-white/70 font-medium text-xs mb-8">{group.memberships?.length} Members • {group.frequency}</Text>
           
           <View>
              <Text className="text-white/60 font-bold text-[10px] tracking-widest uppercase mb-1">TOTAL GROUP SAVINGS</Text>
              <View className="flex-row items-baseline">
                 <Text className="text-white text-[32px] font-black tracking-tighter">{totalSavings}</Text>
                 <Text className="text-[#F5A623] font-bold text-sm ml-2">XAF</Text>
              </View>
           </View>
        </View>

        {/* Membership Status Badge */}
        {membershipStatus === 'pending_next_cycle' && (
           <View className="bg-[#FDEBE1] border border-[#F5A623] rounded-2xl p-4 mb-6 flex-row items-center">
              <Ionicons name="time-outline" size={20} color="#B07722" />
              <Text className="text-[#B07722] font-bold text-xs ml-2 flex-1">You have joined for the next cycle. Participation starts soon!</Text>
           </View>
        )}

        {/* Description */}
        <View className="mb-6">
           <Text className="text-[#0B3D2E] font-extrabold text-[16px] mb-2">About this Community</Text>
           <Text className="text-[#6b665B] text-sm leading-relaxed">{group.description || "No description provided."}</Text>
        </View>

        {/* Rules */}
        <View className="mb-8">
           <Text className="text-[#0B3D2E] font-extrabold text-[16px] mb-2">Group Rules</Text>
           <View className="bg-white/50 rounded-2xl p-4 border border-[#EAE5D9]">
              <Text className="text-[#333333] text-xs leading-5">
                 {group.rules || "• Contribution is mandatory every cycle.\n• Next-cycle members cannot receive payouts until active.\n• Fraud or non-payment results in immediate removal."}
              </Text>
           </View>
        </View>

        {/* Cycle Progress */}
        <View className="mb-8">
           <View className="flex-row justify-between items-end mb-2">
              <View>
                 <Text className="text-[#0B3D2E] font-extrabold text-[16px]">Current Cycle Progress</Text>
                 <Text className="text-[#6b665B] font-medium text-xs mt-1">Cycle {group.current_cycle_number} • {group.memberships?.length} / {group.cycle_length} members</Text>
              </View>
              <Text className="text-[#B07722] font-black text-xl">{progressPercent}%</Text>
           </View>
           
           <View className="w-full h-3 bg-[#EAE5D9] rounded-full overflow-hidden">
              <View style={{ width: `${progressPercent}%` }} className="h-full bg-[#F5A623] rounded-full" />
           </View>
        </View>

        {/* Community Members Slice */}
        <View className="mb-8">
            <Text className="text-[#0B3D2E] font-extrabold text-[16px] mb-4">Community Members</Text>
            <View className="flex-row items-center gap-4">
               {group.memberships?.slice(0, 4).map((mem: any, idx: number) => (
                 <View key={mem.id} className="items-center">
                    <View className="relative border-2 border-[#0B3D2E] rounded-full w-12 h-12 bg-gray-200">
                       <Image source={{ uri: `https://i.pravatar.cc/150?u=${mem.user?.id || idx}` }} className="w-full h-full rounded-full" />
                    </View>
                    <Text className="text-[#333333] font-bold text-[10px] mt-2">{(mem.user?.username || mem.user?.full_name || 'Member').split(' ')[0]}</Text>
                    <Text className="text-[#A09C90] text-[8px]">{mem.user?.masked_phone || ''}</Text>
                 </View>
               ))}
               {group.memberships?.length > 4 && (
                 <View className="w-12 h-12 rounded-full bg-[#EAE5D9] items-center justify-center">
                    <Text className="text-[#0B3D2E] font-bold text-xs">+{group.memberships.length - 4}</Text>
                 </View>
               )}
            </View>
        </View>

        {/* Contribution History Tracking */}
        <View className="mb-8">
           <Text className="text-[#0B3D2E] font-extrabold text-[16px] mb-4">Your Contribution History</Text>
           {group.my_contributions && group.my_contributions.length > 0 ? (
              group.my_contributions.map((con: any) => (
                 <View key={con.id} className="w-full bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-[#EAE5D9]">
                    <View className={`w-10 h-10 rounded-full items-center justify-center ${con.is_verified ? 'bg-[#Dbf1ea]' : 'bg-[#FAF8F3]'}`}>
                       <Ionicons name={con.is_verified ? "checkmark-circle" : "time-outline"} size={20} color={con.is_verified ? "#0B3D2E" : "#F5A623"} />
                    </View>
                    <View className="flex-1 ml-4 py-1">
                       <Text className="text-[14px] font-bold text-[#333333]">Cycle {con.cycle_number} Contribution</Text>
                       <Text className="text-[11px] text-[#6b665B] mt-0.5">{new Date(con.date_paid).toLocaleDateString()}</Text>
                    </View>
                    <View className="items-end">
                       <Text className="text-[14px] font-black text-[#0B3D2E]">{con.amount} XAF</Text>
                       <Text className={`text-[10px] font-bold ${con.is_verified ? 'text-[#0B3D2E]' : 'text-[#B07722]'}`}>
                          {con.is_verified ? 'Verified' : 'Processing'}
                       </Text>
                    </View>
                 </View>
              ))
           ) : (
              <View className="bg-[#FAF8F3] rounded-2xl p-6 border border-dashed border-[#EAE5D9] items-center">
                 <Ionicons name="receipt-outline" size={32} color="#Dbf1ea" className="mb-2" />
                 <Text className="text-[#6b665B] text-xs font-medium">No contributions recorded for this circle yet.</Text>
              </View>
           )}
        </View>

        {/* Payout Order Preview */}
        <View className="mb-32">
           <Text className="text-[#0B3D2E] font-extrabold text-[16px] mb-4">Full Membership List</Text>
           {group.memberships?.sort((a: any, b: any) => a.payout_order - b.payout_order).map((mem: any) => (
             <View key={mem.id} className="w-full bg-white rounded-2xl p-4 mb-3 flex-row items-center border border-[#EAE5D9]">
                 <Text className="text-[#B07722] font-black w-8">#{mem.payout_order}</Text>
                 <View className="flex-1">
                    <Text className="text-[14px] font-bold text-[#333333]">{mem.user?.username || mem.user?.full_name || 'Member'}</Text>
                    <Text className="text-[10px] text-[#6b665B]">{mem.user?.masked_phone || ''}</Text>
                 </View>
                 {mem.status === 'PENDING_NEXT_CYCLE' && (
                    <View className="bg-gray-100 px-2 py-1 rounded">
                       <Text className="text-[10px] font-bold text-gray-500">Next Cycle</Text>
                    </View>
                 )}
             </View>
           ))}
        </View>
      </ScrollView>

      {/* Dynamic Action Button */}
      <View className="absolute bottom-[90px] w-full px-6 z-10 shadow-lg">
         {membershipStatus === 'active' ? (
            <TouchableOpacity 
               onPress={() => router.push(`/contribution/${group.id}`)}
               className="w-full bg-[#0B3D2E] rounded-full h-14 flex-row justify-center items-center"
            >
               <Ionicons name="cash-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
               <Text className="text-white font-extrabold text-[16px]">Make Contribution</Text>
            </TouchableOpacity>
         ) : membershipStatus === 'pending_next_cycle' ? (
            <View className="w-full bg-[#EAE5D9] rounded-full h-14 flex-row justify-center items-center">
               <Ionicons name="time-outline" size={20} color="#6b665B" style={{ marginRight: 8 }} />
               <Text className="text-[#6b665B] font-extrabold text-[16px]">Starts Next Cycle</Text>
            </View>
         ) : (
            <TouchableOpacity 
               onPress={handleJoin}
               disabled={joining || group.is_private || group.memberships?.length >= group.cycle_length}
               className={`w-full rounded-full h-14 flex-row justify-center items-center ${joining || group.is_private || group.memberships?.length >= group.cycle_length ? 'bg-gray-300' : 'bg-[#F5A623]'}`}
            >
               <Ionicons name="add-circle-outline" size={20} color={joining ? "#6b665B" : "#0B3D2E"} style={{ marginRight: 8 }} />
               <Text className={`font-extrabold text-[16px] ${joining ? 'text-[#6b665B]' : 'text-[#0B3D2E]'}`}>
                  {joining ? 'Joining...' : group.is_private ? 'Invite Only' : group.memberships?.length >= group.cycle_length ? 'Circle Full' : 'Join Next Cycle'}
               </Text>
            </TouchableOpacity>
         )}
      </View>
      </Animated.View>

      <BottomNav />
    </SafeAreaView>
  );
}
