import re

with open('app/wallet.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView, Platform, Pressable, Alert, Image } from 'react-native';", 
                          "import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';\nimport { MomoModal, MomoActionType } from '../src/components/ui/MomoModal';")

# 2. State
state_pattern = r"// Deposit modal state.*?const \[depositing, setDepositing\] = useState\(false\);"
new_state = """// Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActionType, setModalActionType] = useState<MomoActionType>('deposit');"""
content = re.sub(state_pattern, new_state, content, flags=re.DOTALL)

# 3. Remove momoProviders and handleDeposit
helpers_pattern = r"const momoProviders = \[.*?const handleDeposit = async \(\) => \{.*?finally \{\s*setDepositing\(false\);\s*\}\s*\};\s*"
content = re.sub(helpers_pattern, "", content, flags=re.DOTALL)

# 4. Buttons
buttons_pattern = r"\[\s*\{\s*title:\s*'Deposit',[^\]]*\]\.map"
new_buttons = """[
              { title: 'Deposit', icon: 'add-circle', color: '#0B3D2E', bgColor: '#Dbf1ea', onPress: () => { setModalActionType('deposit'); setModalVisible(true); } },
              { title: 'Send', icon: 'paper-plane', color: '#0B3D2E', bgColor: '#EAE5D9', onPress: () => { setModalActionType('send'); setModalVisible(true); } },
              { title: 'Withdraw', icon: 'arrow-up-circle', color: '#EF4444', bgColor: '#FEE2E2', onPress: () => { setModalActionType('send'); setModalVisible(true); } }
            ].map"""
content = re.sub(buttons_pattern, new_buttons, content, flags=re.DOTALL)

# 5. Modal replacement
modal_pattern = r"\{\/\* ── Deposit MoMo Modal ───────────────────────────────────────── \*\/\}.*?<\/Modal>"
new_modal = """{/* ── Transaction Modal ───────────────────────────────────────── */}
      <MomoModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        actionType={modalActionType} 
      />"""
content = re.sub(modal_pattern, new_modal, content, flags=re.DOTALL)

with open('app/wallet.tsx', 'w') as f:
    f.write(content)

