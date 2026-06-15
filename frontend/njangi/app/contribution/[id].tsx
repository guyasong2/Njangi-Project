import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../src/api/client';

export default function ContributionPaymentScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [paying, setPaying] = useState(false);
    const [paymentData, setPaymentData] = useState<any>(null);
    const [provider, setProvider] = useState<'MTN' | 'ORANGE'>('MTN');
    const [phoneNumber, setPhoneNumber] = useState('');

    useEffect(() => {
        fetchPendingContribution();
    }, [id]);

    const fetchPendingContribution = async () => {
        try {
            const data = await apiClient.get(`/groups/${id}/pending_contribution/`);
            setPaymentData(data);
        } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to load payment details.");
            router.back();
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!phoneNumber || phoneNumber.length < 9) {
            Alert.alert("Invalid Input", "Please enter a valid phone number.");
            return;
        }

        setPaying(true);
        try {
            // Simulate MoMo Webhook Payment
            await apiClient.post('/wallet/momo-webhook/', {
                contribution_id: paymentData.contribution_id,
                status: 'SUCCESSFUL',
                amount: paymentData.total_amount
            });

            Alert.alert("Success!", "Your contribution has been paid successfully.", [
                { text: "OK", onPress: () => router.push(`/group-details?id=${id}`) }
            ]);
        } catch (error: any) {
            Alert.alert("Payment Failed", error.message || "Something went wrong.");
        } finally {
            setPaying(false);
        }
    };

    if (loading || !paymentData) {
        return (
            <View className="flex-1 bg-[#FAF8F3] justify-center items-center">
                <ActivityIndicator size="large" color="#0B3D2E" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-[#FAF8F3]">
            {/* Header */}
            <View className="flex-row items-center justify-between px-6 pt-16 pb-4">
                <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white rounded-full items-center justify-center shadow-sm border border-[#EAE5D9]">
                    <Ionicons name="arrow-back" size={20} color="#0B3D2E" />
                </TouchableOpacity>
                <Text className="text-lg font-extrabold text-[#333333]">Make Contribution</Text>
                <View className="w-10 h-10" />
            </View>

            <View className="px-6 flex-1 pt-4">
                {/* Breakdown Card */}
                <View className="bg-white rounded-3xl p-6 shadow-sm border border-[#EAE5D9] mb-8">
                    <Text className="text-center font-bold text-[#6b665B] mb-2">{paymentData.group_name}</Text>
                    <Text className="text-center text-3xl font-black text-[#0B3D2E] mb-6">
                        {paymentData.total_amount.toLocaleString()} <Text className="text-lg">XAF</Text>
                    </Text>

                    <View className="border-t border-dashed border-[#EAE5D9] pt-4">
                        <View className="flex-row justify-between mb-3">
                            <Text className="font-medium text-[#6b665B]">Base Contribution</Text>
                            <Text className="font-bold text-[#333333]">{paymentData.base_amount.toLocaleString()} XAF</Text>
                        </View>
                        <View className="flex-row justify-between">
                            <Text className="font-medium text-[#6b665B]">Platform Fee (1%)</Text>
                            <Text className="font-bold text-[#F5A623]">{paymentData.fee.toLocaleString()} XAF</Text>
                        </View>
                    </View>
                </View>

                <Text className="text-sm font-extrabold text-[#333333] mb-4">Select Payment Method</Text>

                {/* MTN MoMo Option */}
                <TouchableOpacity 
                    onPress={() => setProvider('MTN')}
                    className={`flex-row items-center p-4 rounded-2xl border-2 mb-4 ${provider === 'MTN' ? 'border-[#FFCC00] bg-[#FFCC00]/10' : 'border-[#EAE5D9] bg-white'}`}
                >
                    <View className="w-12 h-12 rounded-full bg-[#FFCC00] items-center justify-center mr-4">
                        <Ionicons name="phone-portrait" size={24} color="#000" />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-[#333333] text-[16px]">MTN Mobile Money</Text>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${provider === 'MTN' ? 'border-[#FFCC00]' : 'border-[#EAE5D9]'}`}>
                        {provider === 'MTN' && <View className="w-3 h-3 rounded-full bg-[#FFCC00]" />}
                    </View>
                </TouchableOpacity>

                {/* Orange Money Option */}
                <TouchableOpacity 
                    onPress={() => setProvider('ORANGE')}
                    className={`flex-row items-center p-4 rounded-2xl border-2 mb-6 ${provider === 'ORANGE' ? 'border-[#FF7900] bg-[#FF7900]/10' : 'border-[#EAE5D9] bg-white'}`}
                >
                    <View className="w-12 h-12 rounded-full bg-[#FF7900] items-center justify-center mr-4">
                        <Ionicons name="phone-portrait" size={24} color="#FFF" />
                    </View>
                    <View className="flex-1">
                        <Text className="font-bold text-[#333333] text-[16px]">Orange Money</Text>
                    </View>
                    <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${provider === 'ORANGE' ? 'border-[#FF7900]' : 'border-[#EAE5D9]'}`}>
                        {provider === 'ORANGE' && <View className="w-3 h-3 rounded-full bg-[#FF7900]" />}
                    </View>
                </TouchableOpacity>

                {/* Phone Number Input */}
                <Text className="text-sm font-extrabold text-[#333333] mb-2">MoMo Phone Number</Text>
                <View className="bg-white rounded-2xl border border-[#EAE5D9] px-4 py-3 flex-row items-center mb-8">
                    <Text className="font-bold text-[#333333] mr-2">+237</Text>
                    <TextInput 
                        className="flex-1 font-bold text-[#333333] text-[16px]"
                        keyboardType="phone-pad"
                        placeholder="6XXXXXXXX"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        placeholderTextColor="#A09C90"
                    />
                </View>

                {/* Pay Button */}
                <TouchableOpacity 
                    onPress={handlePayment}
                    disabled={paying}
                    className={`w-full rounded-full h-14 flex-row justify-center items-center ${paying ? 'bg-[#0B3D2E]/70' : 'bg-[#0B3D2E]'}`}
                >
                    {paying ? (
                        <ActivityIndicator color="#FFF" />
                    ) : (
                        <Text className="text-white font-extrabold text-[16px]">Pay {paymentData.total_amount.toLocaleString()} XAF</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}
