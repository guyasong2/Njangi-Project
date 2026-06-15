import { useEffect } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TAB_BAR_WIDTH = width;
const TAB_WIDTH = TAB_BAR_WIDTH / 4;

export function BottomNav() {
  const router = useRouter();
  const currentPath = usePathname();
  
  const tabs = [
    { name: 'HOME', icon: 'home-outline', activeIcon: 'home', route: '/dashboard', color: '#0B3D2E' },
    { name: 'WALLET', icon: 'wallet-outline', activeIcon: 'wallet', route: '/wallet', color: '#B07722' },
    { name: 'GROUPS', icon: 'people-outline', activeIcon: 'people', route: '/groups', color: '#0B3D2E' },
    { name: 'PROFILE', icon: 'person-outline', activeIcon: 'person', route: '/profile', color: '#333333' }
  ];

  const activeIndex = tabs.findIndex(tab => 
    currentPath === tab.route || (tab.name === 'HOME' && currentPath === '/dashboard')
  );

  const translateX = useSharedValue(activeIndex * TAB_WIDTH);

  useEffect(() => {
    translateX.value = withSpring(activeIndex * TAB_WIDTH, {
      damping: 15,
      stiffness: 100,
    });
  }, [activeIndex, translateX]);

  const animatedPillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#F5F1E8',
      borderTopWidth: 1,
      borderTopColor: '#EAE5D9',
      height: 90,
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 20, // SafeArea spacing
      zIndex: 50,
    }}>
      {/* Animated Background Pill */}
      <Animated.View style={[
        {
          position: 'absolute',
          width: TAB_WIDTH - 20,
          height: 60,
          backgroundColor: '#Dbf1ea',
          borderRadius: 20,
          left: 10,
          top: 5,
        },
        animatedPillStyle
      ]} />

      {tabs.map((tab, index) => {
        const isActive = activeIndex === index;
        
        return (
          <TouchableOpacity 
            key={tab.name}
            onPress={() => router.replace(tab.route as any)}
            className="flex-1 items-center justify-center h-full"
            activeOpacity={0.7}
          >
            <View className="items-center justify-center">
              <Ionicons 
                 name={(isActive && tab.activeIcon ? tab.activeIcon : tab.icon) as any} 
                 size={22} 
                 color={isActive ? '#0B3D2E' : '#A09C90'} 
              />
              <Text 
                 className={`text-[9px] mt-1 font-black ${isActive ? 'text-[#0B3D2E]' : 'text-[#A09C90]'} tracking-widest`}
              >
                {tab.name}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
