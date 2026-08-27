from pathlib import Path
s=Path('index.html').read_text()
keys=['renderCharts','renderReportChart','monthlyHistory','charts.','new Chart','reportChart','dashboardChart']
out=[]
for k in keys:
    pos=0
    while True:
        i=s.find(k,pos)
        if i<0: break
        out.append(f'===== {k} @ {i} =====\n'+s[max(0,i-1800):i+5200])
        pos=i+len(k)
Path('chart-inspection.txt').write_text('\n\n'.join(out))