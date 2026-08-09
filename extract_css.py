import re
import sys
import shutil

sys.stdout.reconfigure(encoding='utf-8')

with open(r'C:\dev\oshift\frontend\src\app\globals.css', 'r', encoding='utf-8') as f:
    css = f.read()

def get_rule(selector):
    # This matches selectors more safely
    escaped = re.escape(selector)
    pattern = re.compile(escaped + r'\s*{[^}]*}', re.MULTILINE)
    match = pattern.search(css)
    if match:
        return match.group(0)
    return f'/* NOT FOUND: {selector} */'

selectors = [
    '.chat-window', '.chat-header', '.chat-header-actions', '.chat-header-btn', '.chat-header-btn:hover', 
    '.chat-title-group', '.chat-title-group img', '.chat-title-group span', 
    '.chat-body', '.chat-body::-webkit-scrollbar', '.chat-body::-webkit-scrollbar-thumb', 
    '.chat-bubble', '.chat-bubble.user-bubble', '.chat-bubble.assistant-bubble', '.chat-bubble.error-bubble', 
    '.chat-message-wrapper', '.chat-message-wrapper.user', '.chat-message-wrapper.assistant', 
    '.chat-avatar-icon', '.chat-avatar-icon.user-avatar', '.chat-avatar-icon.assistant-avatar', '.chat-avatar-icon.assistant-avatar img', 
    '.command-wrapper.show-wrapper .chat-window', 
    '.typing-indicator', '.typing-dot', '.typing-dot:nth-child(1)', '.typing-dot:nth-child(2)', '.typing-dot:nth-child(3)', 
    '@keyframes typingPulse', '@keyframes skeletonPulseLight', 
    '.card-left', '.card-right', '.deck-front', 
    '.main-content:active', 'body:has(.auth-root)', '[data-theme="light"] body.is-thinking-active .skeleton-target::after'
]

# Write out the new globals.css by copying redesign first
shutil.copyfile(r'C:\Users\hp\Documents\antigravity\beautiful-volta\oshift\src\app\globals.css', r'C:\dev\oshift\frontend\src\app\globals.css')

with open(r'C:\dev\oshift\frontend\src\app\globals.css', 'a', encoding='utf-8') as f:
    f.write('\n\n/* MERGED FROM CURRENT */\n\n')
    for s in selectors:
        if s.startswith('@keyframes'):
            pattern = re.compile(re.escape(s) + r'\s*{(?:[^{}]*{[^}]*}[^{}]*)*\s*}', re.MULTILINE)
            m = pattern.search(css)
            f.write((m.group(0) if m else f'/* NOT FOUND: {s} */') + '\n\n')
        else:
            f.write(get_rule(s) + '\n\n')
