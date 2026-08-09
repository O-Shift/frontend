import os
import re
import sys
import shutil

def extract_selectors(css_content):
    # Quick and dirty way to get all CSS selectors
    # We remove comments first
    css_content = re.sub(r'/\*.*?\*/', '', css_content, flags=re.DOTALL)
    # Match everything before {
    matches = re.finditer(r'([^{}]+)\s*{', css_content)
    selectors = []
    for m in matches:
        sel = m.group(1).strip()
        # ignore @media, @keyframes, etc just for uniqueness checking
        if not sel.startswith('@'):
            selectors.extend([s.strip() for s in sel.split(',')])
    return set(selectors)

def merge_css(name):
    current_path = rf'C:\dev\oshift\frontend\src\app\{name}'
    redesign_path = rf'C:\Users\hp\Documents\antigravity\beautiful-volta\oshift\src\app\{name}'
    
    with open(current_path, 'r', encoding='utf-8') as f:
        cur_css = f.read()
    
    if not os.path.exists(redesign_path):
        print(f'{redesign_path} not found!')
        return
        
    with open(redesign_path, 'r', encoding='utf-8') as f:
        redes_css = f.read()

    cur_sels = extract_selectors(cur_css)
    redes_sels = extract_selectors(redes_css)
    
    missing_sels = cur_sels - redes_sels
    
    # We will just write a naive block copier for the missing selectors
    # It might grab some extra things if selectors are grouped, but it's safe
    print(f'Missing in {name}: {len(missing_sels)}')
    
    shutil.copyfile(redesign_path, current_path)
    
    with open(current_path, 'a', encoding='utf-8') as f:
        f.write('\n\n/* MERGED FROM CURRENT */\n\n')
        for sel in missing_sels:
            # simple regex to find the rule
            escaped = re.escape(sel)
            # Find the full block where this selector is declared
            pattern = re.compile(escaped + r'(?:,[^{}]*)?\s*{[^}]*}', re.MULTILINE)
            for match in pattern.finditer(cur_css):
                f.write(match.group(0) + '\n\n')

merge_css('light-overrides.css')
merge_css('auth.css')
merge_css('profile.css')
