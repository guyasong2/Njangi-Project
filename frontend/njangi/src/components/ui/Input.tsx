import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
}

export function Input({ label, error, prefix, ...props }: InputProps) {
  return (
    <View className="mb-6">
      {label && <Text className="text-sm text-njangi-gray mb-1.5 font-medium ml-2">{label}</Text>}
      <View className="flex-row items-center bg-[#EFEBE0] rounded-full px-5 py-4">
        {prefix && <View className="mr-3">{prefix}</View>}
        <TextInput 
          className="flex-1 text-base text-njangi-green font-medium p-0"
          placeholderTextColor="#A0A0A0"
          {...props}
        />
      </View>
      {error && <Text className="text-red-500 mt-2 ml-2 text-xs">{error}</Text>}
    </View>
  );
}
