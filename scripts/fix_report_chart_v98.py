from pathlib import Path

p=Path('index.html')
s=p.read_text()
old="let months=[...new Set(this.reportRows.map(s=>s.reference))].sort(), er=document.getElementById('repChart');if(er){if(this.charts.rep){this.charts.rep.destroy();this.charts.rep=null}er.removeAttribute('height');er.removeAttribute('width');er.style.height='240px';er.style.maxHeight='240px';er.style.width='100%';this.charts.rep=new Chart(er,{type:'line',data:{labels:months.map(m=>this.month(m)),datasets:[{label:'Lançado',data:months.map(m=>this.reportRows.filter(s=>s.reference===m).reduce((a,s)=>a+Number(s.amount||0),0)),tension:.35},{label:'Pago',data:months.map(m=>this.reportRows.filter(s=>s.reference===m).reduce((a,s)=>a+Number(s.paidValue||0),0)),tension:.35}]},options:{responsive:true,maintainAspectRatio:false,resizeDelay:150,animation:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}})}}"
new="let launchMonths=this.reportRows.map(s=>String(s.serviceDate||'').slice(0,7)).filter(Boolean),paidMonths=this.reportDetailRows.filter(s=>Number(s.reportValue||0)>0).map(s=>String(s.paymentDate||'').slice(0,7)).filter(Boolean),months=[...new Set([...launchMonths,...paidMonths])].sort(), er=document.getElementById('repChart');if(er){if(this.charts.rep){this.charts.rep.destroy();this.charts.rep=null}er.removeAttribute('height');er.removeAttribute('width');er.style.height='240px';er.style.maxHeight='240px';er.style.width='100%';this.charts.rep=new Chart(er,{type:'line',data:{labels:months.map(m=>this.month(m)),datasets:[{label:'Lançado',data:months.map(m=>this.reportRows.filter(s=>String(s.serviceDate||'').slice(0,7)===m).reduce((a,s)=>a+Number(s.amount||0),0)),tension:.35},{label:'Pago',data:months.map(m=>this.reportDetailRows.filter(s=>String(s.paymentDate||'').slice(0,7)===m).reduce((a,s)=>a+Number(s.reportValue||0),0)),tension:.35}]},options:{responsive:true,maintainAspectRatio:false,resizeDelay:150,animation:false,plugins:{legend:{position:'bottom'}},scales:{y:{beginAtZero:true}}}})}}"
if old not in s:
    raise SystemExit('trecho do grafico nao encontrado')
s=s.replace(old,new,1)
p.write_text(s)

sw=Path('sw.js')
w=sw.read_text()
if 'recibocondo-v97-annual-payment-date' not in w:
    raise SystemExit('cache base inesperado')
w=w.replace('recibocondo-v97-annual-payment-date','recibocondo-v98-report-chart-payment-date')
sw.write_text(w)

assert 'paidMonths=this.reportDetailRows.filter' in s
assert "this.reportDetailRows.filter(s=>String(s.paymentDate||'').slice(0,7)===m)" in s
assert 'recibocondo-v98-report-chart-payment-date' in w
