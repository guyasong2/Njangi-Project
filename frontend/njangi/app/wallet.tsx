import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MomoModal, MomoActionType } from '../src/components/ui/MomoModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
// useRouter removed - not currently used in this screen
import { useState, useEffect } from 'react';
import { BottomNav } from '../src/components/ui/BottomNav';
import { apiClient } from '../src/api/client';
import { useUIStore } from '../src/store/uiStore';
import Animated, { FadeIn } from 'react-native-reanimated';

export default function Wallet() {
  const { toggleSidebar } = useUIStore();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActionType, setModalActionType] = useState<MomoActionType>('deposit');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const response = await apiClient.get('/wallet/');
        setWallet(response);
      } catch (err: any) {
        console.error('Failed to fetch wallet:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0B3D2E" />
      </SafeAreaView>
    );
  }

  const availableBalance = parseFloat(wallet?.available_balance || '0').toLocaleString();
  const lockedBalance = parseFloat(wallet?.locked_balance || '0').toLocaleString();
  const totalBalance = (parseFloat(wallet?.available_balance || '0') + parseFloat(wallet?.locked_balance || '0')).toLocaleString();

  // Dynamic tier based on total wallet value
  const rawTotal = parseFloat(wallet?.available_balance || '0') + parseFloat(wallet?.locked_balance || '0');
  const walletTier = rawTotal >= 1_000_000 ? 'Tier 3' : rawTotal >= 100_000 ? 'Tier 2' : 'Tier 1';

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'DEPOSIT': return { name: 'arrow-down-circle', color: '#10B981', bgColor: '#Dbf1ea' };
      case 'WITHDRAW': return { name: 'arrow-up-circle', color: '#EF4444', bgColor: '#FEE2E2' };
      case 'PAYOUT_AVAILABLE':
      case 'PAYOUT_LOCKED': return { name: 'star', color: '#F5A623', bgColor: '#FEF3C7' };
      default: return { name: 'swap-horizontal', color: '#0B3D2E', bgColor: '#F5F1E8' };
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <Animated.View entering={FadeIn.duration(400)} style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 150 }}
        >

          {/* Header */}
          <View className="px-6 pt-4 flex-row items-center justify-between mb-8">
            <TouchableOpacity onPress={toggleSidebar}>
              <Ionicons name="menu" size={28} color="#0B3D2E" />
            </TouchableOpacity>
            <Text className="text-xl font-extrabold text-[#0B3D2E] tracking-tight">Wallet</Text>
            <TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/notifications')} className="relative">
                 <Ionicons name="notifications-outline" size={24} color="#0B3D2E" />
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Hero Balance Card - Premium Gradient Look */}
          <View className="px-6 mb-8">
            <View className="w-full bg-[#0B3D2E] rounded-[40px] p-8 shadow-2xl relative overflow-hidden h-[220px] justify-between">
              {/* Decorative floating elements as seen in Dashboard */}
              <View className="absolute top-[-30px] right-[-30px] w-48 h-48 bg-white/5 rounded-full" />
              <View className="absolute bottom-[-50px] left-[-20px] w-40 h-40 bg-[#F5A623]/10 rounded-full" />

              <View>
                <Text className="text-white/70 font-bold text-xs tracking-widest mb-3 uppercase">Combined wealth</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-[44px] font-black text-[#F5A623] tracking-tighter">{totalBalance}</Text>
                  <Text className="text-white font-bold text-lg ml-2 opacity-80">XAF</Text>
                </View>
              </View>

              {/* Sub-Actions inside Card */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Ionicons name="shield-checkmark" size={16} color="#F5A623" />
                  <Text className="text-white/80 text-[10px] font-bold ml-1 uppercase tracking-tight">Security Guaranteed</Text>
                </View>
                <View className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
                  <Text className="text-white font-black text-[10px] uppercase">{walletTier} Ledger</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Dual Mode Balance Split */}
          <View className="px-6 mb-10">
            <View className="flex-row gap-4">
              {/* Available Funds */}
              <View className="flex-1 bg-white rounded-[35px] p-6 shadow-sm border border-[#EAE5D9] relative overflow-hidden">
                <View className="absolute top-[-20px] left-[-20px] w-16 h-16 bg-[#Dbf1ea]/40 rounded-full" />
                <View className="w-10 h-10 bg-[#Dbf1ea] rounded-2xl items-center justify-center mb-4">

                </View>
                <Text className="text-[10px] font-black text-[#6b665B] uppercase mb-1 tracking-widest">Available</Text>
                <Text className="text-[20px] font-black text-[#333333] tracking-tight">{availableBalance}</Text>
                <Text className="text-[9px] font-bold text-[#0B3D2E] mt-1">Liquid Assets</Text>
              </View>

              {/* Locked Savings */}
              <View className="flex-1 bg-[#FDEBE1] rounded-[35px] p-6 shadow-sm border border-[#FDEB E1] relative overflow-hidden">
                <View className="absolute bottom-[-20px] right-[-20px] w-16 h-16 bg-[#B07722]/10 rounded-full" />
                <View className="w-10 h-10 bg-white rounded-2xl items-center justify-center mb-4 shadow-xs">
                  <Ionicons name="lock-closed" size={20} color="#B07722" />
                </View>
                <Text className="text-[10px] font-black text-[#6b665B] uppercase mb-1 tracking-widest">In Cycle</Text>
                <Text className="text-[20px] font-black text-[#333333] tracking-tight">{lockedBalance}</Text>
                <Text className="text-[9px] font-bold text-[#B07722] mt-1">Locked Escrow</Text>
              </View>
            </View>
          </View>

          {/* Polished Action Buttons */}
          <View className="px-6 flex-row justify-between mb-10 gap-x-2">
            {[
              { title: 'Deposit', icon: 'add-circle', color: '#0B3D2E', bgColor: '#Dbf1ea', onPress: () => { setModalActionType('deposit'); setModalVisible(true); } },
              { title: 'Send', icon: 'paper-plane', color: '#0B3D2E', bgColor: '#EAE5D9', onPress: () => { setModalActionType('send'); setModalVisible(true); } },
              { title: 'Withdraw', icon: 'arrow-up-circle', color: '#EF4444', bgColor: '#FEE2E2', onPress: () => { setModalActionType('send'); setModalVisible(true); } }
            ].map((btn, idx) => (
              <View key={idx} className="items-center flex-1">
                <TouchableOpacity
                  onPress={btn.onPress}
                  className="w-full h-14 bg-white rounded-3xl items-center justify-center mb-2 border border-[#EAE5D9] shadow-sm"
                >
                  <Ionicons name={btn.icon as any} size={24} color={btn.color} />
                </TouchableOpacity>
                <Text className="text-[10px] font-black text-[#333333] uppercase">{btn.title}</Text>
              </View>
            ))}
          </View>

          {/* Transaction History - Premium List Design */}
          <View className="flex-1 bg-white rounded-t-[45px] p-8 pb-[120px] border-t border-[#EAE5D9] shadow-2xl">
            <View className="flex-row items-center justify-between mb-8">
              <Text className="text-xl font-black text-[#333333] tracking-tight">Recent Activity</Text>
              <TouchableOpacity className="bg-[#FAF8F3] px-4 py-2 rounded-full border border-[#EAE5D9]">
                <Text className="text-[11px] font-black text-[#0B3D2E]">See All</Text>
              </TouchableOpacity>
            </View>

            {wallet?.recent_transactions?.length > 0 ? (
              wallet.recent_transactions.map((txn: any) => {
                const iconStyle = getTransactionIcon(txn.transaction_type);
                const isCredit = parseFloat(txn.amount) > 0;

                return (
                  <TouchableOpacity
                    key={txn.id}
                    className="flex-row items-center mb-6 bg-[#FAF8F3]/50 p-4 rounded-3xl border border-[#FAF8F3]"
                  >
                    <View
                      style={{ backgroundColor: iconStyle.bgColor }}
                      className="w-14 h-14 rounded-2xl items-center justify-center mr-4"
                    >
                      <Ionicons name={iconStyle.name as any} size={26} color={iconStyle.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-bold text-[15px] text-[#333333] mb-1" numberOfLines={1}>
                        {txn.description || txn.transaction_type_display}
                      </Text>
                      <Text className="text-[11px] font-bold text-[#A09C90] uppercase tracking-tighter">
                        {new Date(txn.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-lg font-black tracking-tighter ${isCredit ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        {isCredit ? '+' : ''}{parseFloat(txn.amount).toLocaleString()}
                      </Text>
                      <Text className="text-[9px] font-black text-[#A09C90] tracking-widest uppercase">XAF</Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            ) : (
              <View className="py-20 items-center justify-center">
                <View className="w-24 h-24 bg-[#F5F1E8] rounded-full items-center justify-center mb-4 border-2 border-dashed border-[#EAE5D9]">
                  <Ionicons name="receipt-outline" size={40} color="#A09C90" />
                </View>
                <Text className="text-[#A09C90] font-black text-sm uppercase tracking-widest">No Activity Yet</Text>
                <Text className="text-[#A09C90] text-xs font-medium mt-1">Join a group to start saving</Text>
              </View>
            )}
          </View>

        </ScrollView>

      </Animated.View>

      {/* ── Transaction Modal ───────────────────────────────────────── */}
      <MomoModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        actionType={modalActionType} 
      />

      <BottomNav />
    </SafeAreaView>
  );
}
