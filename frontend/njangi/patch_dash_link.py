import re

with open('app/dashboard.tsx', 'r') as f:
    content = f.read()

# Replace the Next Payout view with a touchable opacity
payout_pattern = r"\{\/\* Next Payout - Snake Shape Avatars \*\/\}\s*<View className=\"flex-1 bg-\[\#FDEBE1\] rounded-3xl p-5 shadow-sm justify-between min-h-\[160px\] border border-\[\#FDEBE1\]\">"
new_payout = """{/* Next Payout - Snake Shape Avatars */}
           <TouchableOpacity 
              onPress={() => {
                 if (data?.memberships?.length > 0) {
                     router.push({ pathname: '/payout-queue', params: { groupId: data.memberships[0].id } });
                 }
              }}
              className="flex-1 bg-[#FDEBE1] rounded-3xl p-5 shadow-sm justify-between min-h-[160px] border border-[#FDEBE1]"
           >"""
content = re.sub(payout_pattern, new_payout, content)

# Replace the closing tag for the Next Payout block (it's immediately before the closing tag of the flex-row gap-4)
# The end of that block looks like:
#               <View className="items-center mt-2">
#                  <Text className="text-[#6b665B] font-bold text-[9px] uppercase">Withdrawal Queue</Text>
#               </View>
#            </View>
#         </View>
# 
#         {/* Active Groups */}
end_pattern = r"<\/View>\s*<\/View>\s*\{\/\* Active Groups \*\/\}"
new_end = """</View>
           </TouchableOpacity>
        </View>

        {/* Active Groups */}"""
content = re.sub(end_pattern, new_end, content)


with open('app/dashboard.tsx', 'w') as f:
    f.write(content)

