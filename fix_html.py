# -*- coding: utf-8 -*-
with open('integracao-funcional.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove style block
start = content.find('    <style>')
end = content.find('</style>') + len('</style>')
if start != -1 and end > start:
    content = content[:start] + content[end:]

# Replace script block
script_start = content.find('    <script>')
script_end = content.rfind('</script>') + len('</script>')
if script_start != -1 and script_end > script_start:
    content = content[:script_start] + '    <script src="app.js"></script>\n' + content[script_end:]

with open('integracao-funcional.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('OK')
