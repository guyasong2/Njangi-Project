import React from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SuccessModalProps {
  visible: boolean;
  message: string;
  onClose: () => void;
}

export function SuccessModal({ visible, message, onClose }: SuccessModalProps) {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/50 px-6">
        <View className="bg-white w-full rounded-3xl p-8 items-center shadow-xl">
          <View className="w-20 h-20 bg-[#Dbf1ea] rounded-full items-center justify-center mb-6">
            <Ionicons name="checkmark" size={48} color="#0B3D2E" />
          </View>
          <Text className="text-2xl font-extrabold text-[#333333] mb-3 text-center">
            Success!
          </Text>
          <Text className="text-[#6b665B] text-center mb-8 text-base leading-relaxed">
            {message}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            className="w-full bg-[#0B3D2E] py-4 rounded-2xl items-center"
          >
            <Text className="text-white font-bold text-lg">Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
