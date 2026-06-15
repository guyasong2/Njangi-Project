import { View, Text, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Button } from '../src/components/ui/Button';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Onboarding() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
      <View className="flex-1 px-6 items-center pt-8 pb-4">
        {/* Header */}
        <Text className="text-[32px] font-extrabold text-njangi-green mb-6 sm:mb-10 text-center">Njangi</Text>

        {/* Main Visual Section */}
        <View className="relative w-full flex-1 max-h-[45vh] items-center justify-center mb-12">
          
          {/* Main Image - Removed border and background as requested */}
          <Image 
            source={require('../assets/images/onboarding-photo.png')}
            className="w-full h-full"
            resizeMode="contain"
          />

          {/* Active Tontines Glass Card - Responsive sizing */}
          <View className="absolute -bottom-8 w-11/12 max-w-[360px] min-w-[280px] rounded-[24px] p-4 overflow-hidden border border-white/60 shadow-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(12px)' }}> 
             <View className="relative z-10 w-full px-2 py-1">
               <View className="flex-row items-center mb-4">
                 <View className="flex-row">
                   <Image source={{ uri: 'https://i.pravatar.cc/100?img=1' }} className="w-10 h-10 rounded-full border-[3px] border-white" />
                   <Image source={{ uri: 'https://i.pravatar.cc/100?img=2' }} className="w-10 h-10 rounded-full border-[3px] border-white -ml-3" />
                   <Image source={{ uri: 'https://i.pravatar.cc/100?img=3' }} className="w-10 h-10 rounded-full border-[3px] border-white -ml-3" />
                   <View className="w-10 h-10 rounded-full border-[3px] border-white -ml-3 bg-[#AEEEC0] items-center justify-center shadow-sm">
                     <Text className="text-[11px] font-bold text-njangi-green">+12</Text>
                   </View>
                 </View>
               </View>
               
               <Text className="text-[13px] text-njangi-gray mb-2 font-semibold">Active Tontines</Text>
               
               <View className="w-full h-[8px] bg-[#E1D8C8] rounded-full mb-3 flex-row overflow-hidden shadow-inner">
                 <View className="h-full bg-njangi-orange w-[72%] rounded-full" />
               </View>
               
               <View className="flex-row justify-between items-center mt-1">
                 <Text className="text-[13px] font-extrabold text-[#A5681E]">FCFA 2,450,000</Text>
                 <Text className="text-[11px] font-medium text-[#6b665B]">Community Goal</Text>
               </View>
             </View>
          </View>
        </View>

        {/* Text Section */}
        <View className="items-center px-4 mb-4">
          <Text className="text-3xl sm:text-4xl font-extrabold text-njangi-green text-center leading-snug mb-3 tracking-tight">
            Grow Together with Njangi
          </Text>
          <Text className="text-sm sm:text-base leading-relaxed text-[#6b665B] text-center font-medium max-w-[320px]">
            The Digital Loom interweaves modern security with traditional community values. Join a trusted circle to build wealth, one stitch at a time.
          </Text>
        </View>

        {/* CTA Section */}
        <View className="w-full mt-4">
          <Button 
            title="Join the Community" 
            onPress={() => router.push('/auth-choice')} 
            variant="primary"
          />
        </View>

        {/* Footer */}
        <View className="items-center mt-8 mb-2">
          <View className="flex-row justify-center gap-7 mb-4">
            <MaterialCommunityIcons name="shield-check-outline" size={20} color="#888" />
            <MaterialCommunityIcons name="lock-outline" size={20} color="#888" />
            <MaterialCommunityIcons name="bank-outline" size={20} color="#888" />
          </View>
          <Text className="text-[8px] text-[#888] tracking-[1.5px] text-center uppercase font-bold px-4 leading-[12px]">
            REGULATED & SECURED BY BLOCKCHAIN TECHNOLOGY
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
