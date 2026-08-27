from pathlib import Path
p=Path('tools/v101_patch.py')
s=p.read_text(encoding='utf-8')
old="s2,n=re.subn(pattern,repl,s,count=1,flags=flags)"
new="s2,n=re.subn(pattern,lambda m: repl,s,count=1,flags=flags)"
if s.count(old)!=1:
    raise SystemExit(f'expected one substitution helper, got {s.count(old)}')
p.write_text(s.replace(old,new,1),encoding='utf-8')
print('fixed replacement escaping')
