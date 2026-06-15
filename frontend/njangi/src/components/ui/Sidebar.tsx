import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Pressable, StyleSheet, Image } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/useAuthStore';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

export const Sidebar = () => {
  const router = useRouter();
  const { isSidebarOpen, closeSidebar } = useUIStore();
  const logout = useAuthStore(state => state.logout);
  const displayName = useAuthStore(state => state.displayName);
  const photoUrl = useAuthStore(state => state.photoUrl);
  const firstName = (displayName || 'Member').split(' ')[0];
  const translateX = useSharedValue(-SIDEBAR_WIDTH);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (isSidebarOpen) {
      translateX.value = withSpring(0, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(1, { duration: 300 });
    } else {
      translateX.value = withSpring(-SIDEBAR_WIDTH, { damping: 20, stiffness: 90 });
      opacity.value = withTiming(0, { duration: 300 });
    }
  }, [isSidebarOpen, opacity, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    display: opacity.value > 0 ? 'flex' : 'none',
  }));

  const menuItems = [
    { title: 'My Details', icon: 'person-outline', route: '/profile' },
    { title: 'Wallet Activity', icon: 'wallet-outline', route: '/wallet' },
    { title: 'Community Groups', icon: 'people-outline', route: '/groups' },
    { title: 'Security Settings', icon: 'lock-closed-outline', route: '/(settings)' }, // Placeholder route
    { title: 'Help & Support', icon: 'help-circle-outline', route: '/(support)' }, // Placeholder route
  ];

  const handleNavigate = (route: string) => {
    closeSidebar();
    router.push(route as any);
  };

  const handleLogout = () => {
    closeSidebar();
    logout();
    router.replace('/auth-choice');
  };

  return (
    <>
      {/* Backdrop */}
      <Animated.View 
        pointerEvents={isSidebarOpen ? 'auto' : 'none'}
        style={[styles.backdrop, backdropStyle]}
      >
        <Pressable style={styles.flex1} onPress={closeSidebar} />
      </Animated.View>

      {/* Sidebar Content */}
      <Animated.View 
        pointerEvents={isSidebarOpen ? 'auto' : 'none'}
        style={[styles.sidebar, animatedStyle]}
      >
        <SafeAreaView style={styles.flex1} edges={['top', 'bottom']}>
          <View className="p-8">
            <View className="flex-row items-center justify-between mb-10">
              <Text className="text-2xl font-black text-[#0B3D2E] tracking-tighter">Njangi</Text>
              <TouchableOpacity onPress={closeSidebar}>
                <Ionicons name="close" size={28} color="#0B3D2E" />
              </TouchableOpacity>
            </View>

            {/* Profile Summary */}
            <View className="bg-[#EAE5D9]/40 p-5 rounded-[30px] mb-8 border border-[#EAE5D9] flex-row items-center">
              <View className="w-12 h-12 rounded-full overflow-hidden border-2 border-white mr-4">
                <Image
                  source={
                    photoUrl
                      ? { uri: photoUrl }
                      : require('../../../assets/images/pp.png')
                  }
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-black text-[#6b665B] uppercase tracking-widest mb-0.5">Authenticated as</Text>
                <Text className="text-base font-black text-[#333333]">{firstName}</Text>
                <View className="flex-row items-center mt-1">
                  <Ionicons name="shield-checkmark" size={12} color="#F5A623" />
                  <Text className="text-[10px] font-bold text-[#F5A623] ml-1 uppercase">Top Contributor</Text>
                </View>
              </View>
            </View>

            {/* Navigation Menu */}
            <View className="gap-y-2">
              {menuItems.map((item, idx) => (
                <TouchableOpacity 
                  key={idx} 
                  onPress={() => handleNavigate(item.route)}
                  className="flex-row items-center p-4 rounded-2xl active:bg-[#EAE5D9]/20"
                >
                  <View className="w-10 h-10 bg-white rounded-xl items-center justify-center mr-4 shadow-xs border border-[#FAF8F3]">
                    <Ionicons name={item.icon as any} size={20} color="#0B3D2E" />
                  </View>
                  <Text className="text-[15px] font-bold text-[#333333]">{item.title}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bottom Section */}
            <View className="mt-auto pt-10">
              <TouchableOpacity 
                onPress={handleLogout}
                className="flex-row items-center p-4 rounded-2xl bg-rose-50 border border-rose-100"
              >
                <Ionicons name="log-out-outline" size={20} color="#EF4444" />
                <Text className="text-[15px] font-bold text-[#EF4444] ml-4">Sign Out</Text>
              </TouchableOpacity>
              <Text className="text-center text-[10px] font-bold text-[#A09C90] mt-8 uppercase tracking-widest">
                Njangi v1.0.4-premium
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  flex1: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(11, 61, 46, 0.4)',
    zIndex: 99,
  },
  sidebar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: SIDEBAR_WIDTH,
    backgroundColor: '#F5F1E8',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
});
