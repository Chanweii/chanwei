import os
import re

html_files = [
    'cultureroute.html',
    'index.html',
    'about.html',
    'energysaver.html',
    'workshop.html'
]

total_matches = 0

regex1 = re.compile(r'([\u4e00-\u9fa5])\s+([a-zA-Z0-9%])')
regex2 = re.compile(r'([a-zA-Z0-9%])\s+([\u4e00-\u9fa5])')

for file in html_files:
    file_path = os.path.join(os.getcwd(), file)
    if not os.path.exists(file_path):
        continue
        
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Split by tags to only check text nodes
    text_nodes = []
    is_inside_tag = False
    current_text = ""
    
    for char in content:
        if char == '<':
            is_inside_tag = True
            if current_text:
                text_nodes.append(current_text)
                current_text = ""
        elif char == '>':
            is_inside_tag = False
        elif not is_inside_tag:
            current_text += char
            
    if current_text:
        text_nodes.append(current_text)
        
    file_matches = 0
    for text in text_nodes:
        file_matches += len(regex1.findall(text))
        file_matches += len(regex2.findall(text))
        
    print(f"{file}: {file_matches} potential matches")
    total_matches += file_matches

print(f"Total: {total_matches} potential matches")
