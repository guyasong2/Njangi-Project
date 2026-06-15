import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { apiClient } from '../src/api/client';

export default function PayoutQueue() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        if (groupId) {
          const response = await apiClient.get(`/groups/${groupId}/`);
          setGroup(response);
        }
      } catch (err) {
        console.error("Failed to fetch group details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

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
           <Text className="text-[#333333] font-bold">Group Not Found</Text>
           <TouchableOpacity onPress={() => router.back()} className="mt-4 bg-[#0B3D2E] px-6 py-2 rounded-full">
              <Text className="text-white font-bold">Go Back</Text>
           </TouchableOpacity>
        </SafeAreaView>
     )
  }

  const memberships = [...(group.memberships || [])].sort((a: any, b: any) => a.payout_order - b.payout_order);
  const currentCycle = group.current_cycle_number || 1;

  // Candy Crush layout variables
  const NODE_SIZE = 80;
  const ROW_HEIGHT = 120;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        
        {/* Header */}
        <View className="px-6 pt-4 flex-row items-center justify-between mb-4 z-10 bg-[#F5F1E8]">
           <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm">
             <Ionicons name="arrow-back" size={24} color="#0B3D2E" />
           </TouchableOpacity>
           <View className="items-center">
             <Text className="text-lg font-extrabold text-[#0B3D2E] tracking-tight">Payout Journey</Text>
             <Text className="text-xs font-bold text-[#A09C90]">{group.name}</Text>
           </View>
           <View className="w-10 h-10" />
        </View>

        <ScrollView 
          className="flex-1 px-6 relative" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150, paddingTop: 40 }}
        >
          <View style={{ alignItems: 'center', width: '100%', position: 'relative' }}>
             
             {/* Render the Avatars (Nodes) */}
             {memberships.map((mem: any, index: number) => {
                const offsetX = Math.sin(index * 1.5) * 80;
                const isCurrent = mem.payout_order === currentCycle;
                const isPast = mem.payout_order < currentCycle;
                
                // We use standard React Native components for animations since Reanimated requires specific setups for looping
                return (
                  <View 
                     key={mem.id} 
                     style={{ 
                        transform: [{ translateX: offsetX }],
                        marginTop: index === 0 ? 0 : ROW_HEIGHT - NODE_SIZE,
                        alignItems: 'center',
                        zIndex: 10
                     }}
                  >
                     {/* Label above node */}
                     <View className="mb-2 bg-white/80 px-3 py-1 rounded-full shadow-sm border border-[#EAE5D9]">
                        <Text className="text-[10px] font-black text-[#333333] uppercase">Level {mem.payout_order}</Text>
                     </View>

                     {/* The Node Avatar */}
                     <View 
                        style={{
                           width: NODE_SIZE,
                           height: NODE_SIZE,
                           borderRadius: NODE_SIZE / 2,
                           backgroundColor: isCurrent ? '#F5A623' : isPast ? '#0B3D2E' : '#FFFFFF',
                           padding: isCurrent ? 4 : 4,
                           elevation: isCurrent ? 10 : 2,
                           shadowColor: isCurrent ? '#F5A623' : '#000',
                           shadowOffset: { width: 0, height: 4 },
                           shadowOpacity: 0.3,
                           shadowRadius: 4,
                           alignItems: 'center',
                           justifyContent: 'center',
                           borderWidth: isPast ? 0 : 2,
                           borderColor: isCurrent ? '#F5A623' : '#EAE5D9'
                        }}
                     >
                        <Image 
                           source={{ uri: `https://i.pravatar.cc/150?u=${mem.user?.id || index}` }}
                           style={{ width: '100%', height: '100%', borderRadius: 99 }}
                        />

                        {/* Status Badges Overlay */}
                        {isCurrent && (
                           <View className="absolute -bottom-2 bg-[#F5A623] px-3 py-1 rounded-full border-2 border-white shadow-sm">
                              <Text className="text-[9px] font-black text-[#333333] uppercase tracking-widest">Eating Now</Text>
                           </View>
                        )}
                        {isPast && (
                           <View className="absolute -bottom-1 -right-1 bg-[#0B3D2E] w-6 h-6 rounded-full border-2 border-white items-center justify-center">
                              <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                           </View>
                        )}
                        {!isPast && !isCurrent && (
                           <View className="absolute -bottom-1 -right-1 bg-white w-6 h-6 rounded-full border-2 border-[#EAE5D9] items-center justify-center">
                              <Ionicons name="lock-closed" size={10} color="#A09C90" />
                           </View>
                        )}
                     </View>

                     {/* User Name */}
                     <Text className={`mt-2 font-extrabold text-[12px] ${isCurrent ? 'text-[#0B3D2E]' : 'text-[#6b665B]'}`}>
                        {(mem.user?.username || mem.user?.full_name || 'Member').split(' ')[0]}
                     </Text>
                  </View>
                );
             })}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
