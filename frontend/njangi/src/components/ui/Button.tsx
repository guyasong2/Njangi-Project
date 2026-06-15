import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline';
  loading?: boolean;
}

export function Button({ title, onPress, variant = 'primary', loading }: ButtonProps) {
  const baseClasses = "rounded-[28px] py-[18px] items-center justify-center";
  const variants = {
    primary: "bg-njangi-green",
    secondary: "bg-njangi-lightGreen",
    outline: "border border-njangi-gray bg-transparent"
  };
  const textVariants = {
    primary: "text-white font-bold text-base",
    secondary: "text-njangi-green font-bold text-base",
    outline: "text-njangi-gray font-bold text-base"
  };

  return (
    <TouchableOpacity 
      onPress={onPress} 
      className={`${baseClasses} ${variants[variant]}`}
      disabled={loading}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? 'white' : '#0B3D2E'}/> : <Text className={textVariants[variant]}>{title}</Text>}
    </TouchableOpacity>
  );
}
