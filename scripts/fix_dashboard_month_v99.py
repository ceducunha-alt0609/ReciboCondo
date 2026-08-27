from pathlib import Path
p=Path('index.html'); s=p.read_text()
old="get dashboardCards(){let nowRef=new Date().toISOString().slice(0,7),year=this.yearlyRows,payments=this.yearlyPaymentRows"
new="get dashboardCards(){let now=new Date(),nowRef=String(this.dashboardYear||now.getFullYear())+'-'+String(now.getMonth()+1).padStart(2,'0'),year=this.yearlyRows,payments=this.yearlyPaymentRows"
if old not in s: raise SystemExit('dashboardCards base nao encontrada')
s=s.replace(old,new,1)
p.write_text(s)
sw=Path('sw.js'); w=sw.read_text()
if 'recibocondo-v98-report-chart-payment-date' not in w: raise SystemExit('cache base inesperado')
w=w.replace('recibocondo-v98-report-chart-payment-date','recibocondo-v99-dashboard-selected-year-month')
sw.write_text(w)
assert "nowRef=String(this.dashboardYear||now.getFullYear())" in s
assert 'recibocondo-v99-dashboard-selected-year-month' in w