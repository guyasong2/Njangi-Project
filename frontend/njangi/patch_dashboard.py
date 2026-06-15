import re

with open('app/dashboard.tsx', 'r') as f:
    content = f.read()

# 1. Imports
content = content.replace("import { useState, useEffect } from 'react';", 
                          "import { useState, useEffect } from 'react';\nimport { MomoModal, MomoActionType } from '../src/components/ui/MomoModal';")

# 2. State
state_pattern = r"const \[loading, setLoading\] = useState\(true\);"
new_state = """const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalActionType, setModalActionType] = useState<MomoActionType>('deposit');"""
content = re.sub(state_pattern, new_state, content)

# 3. Buttons
buttons_pattern = r"<TouchableOpacity className=\"bg-\[\#F5A623\].*?</TouchableOpacity>.*?<TouchableOpacity className=\"bg-white/10.*?</TouchableOpacity>"
new_buttons = """<TouchableOpacity 
                 onPress={() => { setModalActionType('deposit'); setModalVisible(true); }}
                 className="bg-[#F5A623] px-6 py-3 rounded-full flex-row items-center">
                 <Ionicons name="add" size={18} color="#0B3D2E" />
                 <Text className="text-[#0B3D2E] font-bold ml-1">Add Money</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                 onPress={() => { setModalActionType('send'); setModalVisible(true); }}
                 className="bg-white/10 px-8 py-3 rounded-full flex-row items-center border border-white/20">
                 <Ionicons name="paper-plane-outline" size={18} color="#FFFFFF" />
                 <Text className="text-white font-bold ml-2">Send</Text>
              </TouchableOpacity>"""
content = re.sub(buttons_pattern, new_buttons, content, flags=re.DOTALL)

# 4. Modal insertion
nav_pattern = r"<BottomNav />\s*</SafeAreaView>"
new_nav = """<MomoModal 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        actionType={modalActionType} 
      />
      <BottomNav />
    </SafeAreaView>"""
content = re.sub(nav_pattern, new_nav, content)

with open('app/dashboard.tsx', 'w') as f:
    f.write(content)

