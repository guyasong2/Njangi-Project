import re

with open('app/dashboard.tsx', 'r') as f:
    content = f.read()

# Replace Next Payout block and Locked Savings block
stat_cards_pattern = r"\{\/\* Stat Cards \*\/\}.*?\{\/\* Active Groups \*\/\}"

new_stat_cards = """{/* Stat Cards */}
        <View className="flex-row justify-between mb-8 gap-4">
           {/* Locked Savings */}
           <View className="flex-1 bg-white rounded-3xl p-5 shadow-sm justify-between min-h-[160px] border border-[#EAE5D9]">
              <View className="flex-row justify-between items-start mb-2">
                 <View className="w-10 h-10 bg-[#F5F1E8] rounded-full justify-center items-center">
                    <Ionicons name="lock-closed-outline" size={20} color="#B07722" />
                 </View>
                 <View className="bg-[#FDEBE1] px-2 py-1 rounded-md">
                    <Text className="text-[9px] font-bold text-[#B07722] uppercase">Escrow</Text>
                 </View>
              </View>
              <View>
                <Text className="text-[#6b665B] font-semibold text-[11px] mb-1">Locked Savings</Text>
                <Text className="text-[20px] font-extrabold text-[#333333] tracking-tight">{data?.wallet?.locked_balance || '0'} <Text className="text-[12px]">XAF</Text></Text>
                <Text className="text-[#A09C90] text-[9px] mt-1 font-medium">Releases on payout</Text>
              </View>
           </View>

           {/* Next Payout - Snake Shape Avatars */}
           <View className="flex-1 bg-[#FDEBE1] rounded-3xl p-5 shadow-sm justify-between min-h-[160px] border border-[#FDEBE1]">
              <View className="flex-row justify-between items-start mb-2">
                 <Text className="text-[#333333] font-bold text-[11px] uppercase tracking-widest">Next Payout</Text>
              </View>
              
              <View className="flex-1 justify-center items-center">
                 <View className="flex-row items-center">
                    {(() => {
                       let upcomingPayouts = [];
                       if (data?.memberships?.length > 0) {
                           upcomingPayouts = [...(data.memberships[0].memberships || [])].sort((a: any, b: any) => a.payout_order - b.payout_order);
                       }
                       if (upcomingPayouts.length === 0) {
                           return <Text className="text-[#A09C90] text-xs font-bold text-center">No payouts scheduled</Text>;
                       }
                       return upcomingPayouts.slice(0, 5).map((mem: any, i: number) => {
                           // The Snake effect: overlapping and alternating translateY
                           const isUp = i % 2 === 0;
                           return (
                               <View 
                                   key={mem.id || i} 
                                   style={{ 
                                       marginLeft: i === 0 ? 0 : -14, 
                                       zIndex: 10 - i, 
                                       transform: [{ translateY: isUp ? -6 : 6 }] 
                                   }}
                               >
                                   <View className="bg-[#B07722] w-4 h-4 rounded-full absolute -top-1 -right-1 z-20 items-center justify-center border-2 border-[#FDEBE1]">
                                      <Text className="text-[7px] text-white font-black">{mem.payout_order}</Text>
                                   </View>
                                   <Image 
                                      source={{ uri: `https://i.pravatar.cc/150?u=${mem.user?.id || i}` }} 
                                      className="w-11 h-11 rounded-full border-2 border-[#FDEBE1]" 
                                   />
                               </View>
                           )
                       });
                    })()}
                 </View>
              </View>
              
              <View className="items-center mt-2">
                 <Text className="text-[#6b665B] font-bold text-[9px] uppercase">Withdrawal Queue</Text>
              </View>
           </View>
        </View>

        {/* Active Groups */}"""

content = re.sub(stat_cards_pattern, new_stat_cards, content, flags=re.DOTALL)

with open('app/dashboard.tsx', 'w') as f:
    f.write(content)

