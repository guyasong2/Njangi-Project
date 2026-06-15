import re

with open('/home/reconraven/Documents/Njangi/frontend/njangi/app/payout-queue.tsx', 'r') as f:
    content = f.read()

# Remove the line drawing block
line_pattern = r"\{\/\* Render connecting lines in the background \*\/\}.*?\{\/\* Render the Avatars \(Nodes\) \*\/\}"
content = re.sub(line_pattern, "{/* Render the Avatars (Nodes) */}", content, flags=re.DOTALL)

with open('/home/reconraven/Documents/Njangi/frontend/njangi/app/payout-queue.tsx', 'w') as f:
    f.write(content)

