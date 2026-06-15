import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiClient } from '../src/api/client';

export default function Notifications() {
   const router = useRouter();
   const [notifications, setNotifications] = useState<any[]>([]);
   const [loading, setLoading] = useState(true);
   const [refreshing, setRefreshing] = useState(false);

   const fetchNotifications = async () => {
      try {
         const res = await apiClient.get('/notifications/');
         const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);
         setNotifications(data);
      } catch (err) {
         console.error('Failed to fetch notifications', err);
      } finally {
         setLoading(false);
         setRefreshing(false);
      }
   };

   useEffect(() => {
      fetchNotifications();
   }, []);

   const onRefresh = () => {
      setRefreshing(true);
      fetchNotifications();
   };

   const markAsRead = async (id: number) => {
      try {
         await apiClient.post(`/notifications/${id}/mark_read/`);
         setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      } catch (err) {
         console.error('Failed to mark read', err);
      }
   };

   const getIconName = (type: string) => {
      switch (type) {
         case 'JOIN': return 'people';
         case 'CREATE': return 'add-circle';
         case 'DEPOSIT': return 'wallet';
         case 'ANNOUNCEMENT': return 'megaphone';
         default: return 'notifications';
      }
   };

   return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F1E8' }}>
         <View className="flex-row items-center px-6 py-4 border-b border-[#EAE5D9]">
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
            <Text className="text-lg font-extrabold text-[#333333] ml-4">Notifications</Text>
         </View>

         <ScrollView 
            className="flex-1 px-6 pt-4"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
         >
            {loading ? (
               <Text className="text-center mt-10 text-[#A09C90]">Loading...</Text>
            ) : (!notifications || notifications.length === 0) ? (
               <View className="items-center justify-center mt-20">
                  <Ionicons name="notifications-off-outline" size={64} color="#A09C90" />
                  <Text className="text-[#A09C90] mt-4 font-bold">No notifications yet</Text>
               </View>
            ) : (
               (notifications || []).map(notif => (
                  <TouchableOpacity 
                     key={notif.id} 
                     onPress={() => markAsRead(notif.id)}
                     className={`flex-row p-4 mb-4 rounded-2xl ${notif.is_read ? 'bg-white' : 'bg-[#Dbf1ea]'}`}
                  >
                     <View className="w-12 h-12 bg-[#EAE5D9] rounded-full items-center justify-center mr-4">
                        <Ionicons name={getIconName(notif.type) as any} size={24} color="#0B3D2E" />
                     </View>
                     <View className="flex-1">
                        <Text className="font-extrabold text-[#333333] text-base mb-1">{notif.title}</Text>
                        <Text className="text-[#6b665B] text-sm">{notif.message}</Text>
                        <Text className="text-[#A09C90] text-xs mt-2">
                           {new Date(notif.created_at).toLocaleDateString()}
                        </Text>
                     </View>
                     {!notif.is_read && (
                        <View className="w-3 h-3 rounded-full bg-[#B07722] ml-2 mt-2" />
                     )}
                  </TouchableOpacity>
               ))
            )}
         </ScrollView>
      </SafeAreaView>
   );
}
