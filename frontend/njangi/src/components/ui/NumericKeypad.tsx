import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface KeypadProps {
  onPressNum: (num: string) => void;
  onDelete: () => void;
}

export function NumericKeypad({ onPressNum, onDelete }: KeypadProps) {
  const numbers = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', 'del']
  ];

  return (
    <View className="w-full px-6 mb-4">
      {numbers.map((row, i) => (
        <View key={i} className="flex-row justify-between mb-2">
          {row.map((btn, j) => (
            <TouchableOpacity 
              key={j}
              disabled={btn === ''}
              onPress={() => btn === 'del' ? onDelete() : onPressNum(btn)}
              className="w-24 h-20 items-center justify-center bg-transparent"
              style={{ opacity: btn === '' ? 0 : 1 }}
            >
              {btn === 'del' ? (
                <Ionicons name="backspace-outline" size={24} color="#0B3D2E" />
              ) : (
                <Text className="text-[28px] font-bold text-njangi-green">{btn}</Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      ))}
    </View>
  );
}
