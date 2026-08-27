from pathlib import Path
s=Path('index.html').read_text()
needles=['annualReportPrint(){','printAnnual','annualPdf','printing-annual','window.print()']
out=[]
for k in needles:
    pos=0
    while True:
        i=s.find(k,pos)
        if i<0: break
        out.append(f'===== {k} @ {i} =====\n'+s[max(0,i-900):i+9000])
        pos=i+len(k)
Path('annual-print-focus.txt').write_text('\n\n'.join(out))