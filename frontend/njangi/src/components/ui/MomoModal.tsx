import { View, Text, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable, Alert, Image } from 'react-native';
import { useState } from 'react';
import { apiClient } from '../../api/client';

export type MomoActionType = 'deposit' | 'send';

interface MomoModalProps {
  visible: boolean;
  onClose: () => void;
  actionType: MomoActionType;
}

export function MomoModal({ visible, onClose, actionType }: MomoModalProps) {
  const [selectedProvider, setSelectedProvider] = useState<'mtn' | 'orange' | null>(null);
  const [momoPhone, setMomoPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const momoProviders = [
    {
      id: 'mtn' as const,
      name: 'MTN MoMo',
      subtitle: 'Mobile Money',
      color: '#FFC107',
      darkColor: '#E6A800',
      textColor: '#1A1A1A',
      prefix: '+237 6XX',
      icon: <Image style={{ width: 48, height: 48, borderRadius: 12 }} source={require('../../../assets/images/logo/MTN.jpeg')} resizeMode="cover" />,
    },
    {
      id: 'orange' as const,
      name: 'Orange Money',
      subtitle: 'Mobile Money',
      color: '#FF6B00',
      darkColor: '#CC5500',
      textColor: '#FFFFFF',
      prefix: '+237 699',
      icon: <Image style={{ width: 48, height: 48, borderRadius: 12 }} source={require('../../../assets/images/logo/ORANGE.jpeg')} resizeMode="cover" />,
    },
  ];

  const handleTransaction = async () => {
    if (!selectedProvider) {
      Alert.alert('Select Provider', 'Please select MTN or Orange MoMo.');
      return;
    }
    if (!momoPhone || momoPhone.length < 9) {
      Alert.alert('Invalid Number', 'Please enter a valid 9-digit Cameroon MoMo number.');
      return;
    }
    if (!amount || parseFloat(amount) < 100) {
      Alert.alert('Invalid Amount', `Minimum ${actionType === 'deposit' ? 'deposit' : 'amount'} is 100 XAF.`);
      return;
    }
    setIsProcessing(true);
    try {
      // In a real app, 'send' might use /wallet/withdraw/ or /wallet/send/
      // Here we just use /wallet/deposit/ as requested by the original wallet.tsx structure,
      // or /wallet/withdraw/ for send. Let's use /wallet/deposit/ for both just to simulate since 
      // the backend only has deposit currently, or we can just blindly call /wallet/withdraw/ and let it 404 for now
      // Let's call /wallet/deposit/ for deposit, and /wallet/withdraw/ for send.
      const endpoint = actionType === 'deposit' ? '/wallet/deposit/' : '/wallet/withdraw/';
      
      await apiClient.post(endpoint, {
        amount: amount,
        provider: selectedProvider.toUpperCase(),
        phone: `+237${momoPhone}`,
      });
      
      const successMessage = actionType === 'deposit' 
        ? `A payment request of ${parseFloat(amount).toLocaleString()} XAF has been sent to your ${selectedProvider === 'mtn' ? 'MTN MoMo' : 'Orange Money'} number. Approve it on your phone.`
        : `A transfer of ${parseFloat(amount).toLocaleString()} XAF to your ${selectedProvider === 'mtn' ? 'MTN MoMo' : 'Orange Money'} number has been initiated.`;

      Alert.alert(
        `${actionType === 'deposit' ? 'Deposit Initiated!' : 'Send Initiated!'} 🎉`,
        successMessage,
        [{ text: 'OK', onPress: () => { 
          onClose(); 
          setSelectedProvider(null); 
          setMomoPhone(''); 
          setAmount(''); 
        }}]
      );
    } catch (err: any) {
      Alert.alert(`${actionType === 'deposit' ? 'Deposit' : 'Send'} Failed`, err.message || `Could not initiate ${actionType}.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const title = actionType === 'deposit' ? 'Deposit Funds' : 'Send Funds';
  const subtitle = actionType === 'deposit' 
    ? 'Choose your MoMo provider to top up your Njangi wallet'
    : 'Choose your MoMo provider to receive the funds';
  const actionText = actionType === 'deposit' ? 'Pay via' : 'Send via';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(11,61,46,0.5)' }}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}
      >
        <View style={{ backgroundColor: '#F5F1E8', borderTopLeftRadius: 36, borderTopRightRadius: 36, padding: 28, paddingBottom: 48 }}>
          {/* Handle bar */}
          <View style={{ width: 40, height: 4, backgroundColor: '#EAE5D9', borderRadius: 99, alignSelf: 'center', marginBottom: 24 }} />

          <Text style={{ fontSize: 20, fontWeight: '900', color: '#333333', marginBottom: 4 }}>{title}</Text>
          <Text style={{ fontSize: 12, color: '#6b665B', fontWeight: '600', marginBottom: 24 }}>{subtitle}</Text>

          {/* Provider Cards */}
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            {momoProviders.map((provider) => (
              <TouchableOpacity
                key={provider.id}
                onPress={() => setSelectedProvider(provider.id)}
                style={[
                  { flex: 1, borderRadius: 24, padding: 20, alignItems: 'center', borderWidth: 2.5 },
                  selectedProvider === provider.id
                    ? { backgroundColor: provider.color, borderColor: provider.darkColor }
                    : { backgroundColor: '#FFFFFF', borderColor: '#EAE5D9' }
                ]}
              >
                <View style={{ marginBottom: 8, height: 48, alignItems: 'center', justifyContent: 'center' }}>
                  {provider.icon}
                </View>
                <Text style={[
                  { fontSize: 13, fontWeight: '900', textAlign: 'center' },
                  { color: selectedProvider === provider.id ? provider.textColor : '#333333' }
                ]}>{provider.name}</Text>
                <Text style={[
                  { fontSize: 10, fontWeight: '700', marginTop: 2, textAlign: 'center' },
                  { color: selectedProvider === provider.id ? provider.textColor : '#A09C90' }
                ]}>{provider.subtitle}</Text>
                {selectedProvider === provider.id && (
                  <View style={{ marginTop: 8, backgroundColor: 'rgba(0,0,0,0.15)', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 2 }}>
                    <Text style={{ fontSize: 9, fontWeight: '900', color: provider.textColor, textTransform: 'uppercase' }}>Selected ✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Phone input */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#333333', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>MoMo Phone Number</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#EAE5D9', marginBottom: 16, overflow: 'hidden' }}>
            <View style={{ backgroundColor: '#F5F1E8', paddingHorizontal: 14, paddingVertical: 16, borderRightWidth: 1, borderRightColor: '#EAE5D9' }}>
              <Text style={{ fontWeight: '800', color: '#0B3D2E', fontSize: 13 }}>🇨🇲 +237</Text>
            </View>
            <TextInput
              style={{ flex: 1, paddingHorizontal: 14, fontSize: 15, fontWeight: '700', color: '#333333' }}
              placeholder="6XX XXX XXX"
              placeholderTextColor="#A09C90"
              keyboardType="phone-pad"
              maxLength={9}
              value={momoPhone}
              onChangeText={setMomoPhone}
            />
          </View>

          {/* Amount input */}
          <Text style={{ fontSize: 11, fontWeight: '800', color: '#333333', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 1 }}>Amount (XAF)</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1.5, borderColor: '#EAE5D9', marginBottom: 28, overflow: 'hidden' }}>
            <TextInput
              style={{ flex: 1, paddingHorizontal: 16, paddingVertical: 16, fontSize: 18, fontWeight: '900', color: '#333333' }}
              placeholder="0"
              placeholderTextColor="#A09C90"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={{ paddingHorizontal: 14 }}>
              <Text style={{ fontWeight: '900', color: '#0B3D2E', fontSize: 13 }}>XAF</Text>
            </View>
          </View>

          {/* Quick amount chips */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 28 }}>
            {['1000', '5000', '10000', '25000'].map((amt) => (
              <TouchableOpacity
                key={amt}
                onPress={() => setAmount(amt)}
                style={[
                  { flex: 1, paddingVertical: 8, borderRadius: 99, alignItems: 'center', borderWidth: 1.5 },
                  amount === amt
                    ? { backgroundColor: '#0B3D2E', borderColor: '#0B3D2E' }
                    : { backgroundColor: '#FFFFFF', borderColor: '#EAE5D9' }
                ]}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: amount === amt ? '#FFFFFF' : '#333333' }}>
                  {parseInt(amt).toLocaleString()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleTransaction}
            disabled={isProcessing}
            style={[
              { borderRadius: 20, height: 58, alignItems: 'center', justifyContent: 'center' },
              isProcessing ? { backgroundColor: '#A09C90' } : { backgroundColor: '#0B3D2E' }
            ]}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '900', fontSize: 16 }}>
              {isProcessing ? 'Processing request...' : `${actionText} ${selectedProvider === 'mtn' ? 'MTN MoMo' : selectedProvider === 'orange' ? 'Orange Money' : 'MoMo'}`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
