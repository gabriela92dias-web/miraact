# -*- coding: utf-8 -*-
with open('app.js', 'r', encoding='utf-8', errors='replace') as f:
    s = f.read()
fixes = [
    ('\u00e2\u20ac\u201c', '\u2013'),
    ('\u00e2\u20ac\u201d', '\u2014'),
    ('\u00c3\u00a3', '\u00e3'),
    ('\u00c3\u00a1', '\u00e1'),
    ('di\u00c3\u00a1ria', 'di\u00e1ria'),
    ('hor\u00c3\u00a1rios', 'hor\u00e1rios'),
    ('dura\u00c3\u00a7\u00c3\u00a3o', 'dura\u00e7\u00e3o'),
]
for old, new in fixes:
    s = s.replace(old, new)
with open('app.js', 'w', encoding='utf-8', newline='') as f:
    f.write(s)
print('Done')
