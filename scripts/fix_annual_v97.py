from pathlib import Path

p = Path('index.html')
s = p.read_text()
start = s.index('  get yearlyRows(){')
end = s.index('  get topProviders(){', start)

new = r'''  get yearlyRows(){let y=String(this.dashboardYear||new Date().getFullYear());return this.services.filter(s=>String(s.serviceDate||'').startsWith(y))},
  get yearlyPaymentRows(){let y=String(this.dashboardYear||new Date().getFullYear()),rows=[];this.receipts.forEach(r=>{let d=String(r.paymentDate||r.date||'');if(!d.startsWith(y))return;let svc=this.services.find(x=>Number(x.id)===Number(r.serviceId));rows.push({providerId:r.providerId??svc?.providerId,category:r.category||svc?.category||'Outros',paymentDate:d,total:Number(r.total||0)})});this.services.forEach(svc=>{let paid=Number(svc.paidValue||0);if(paid<=0)return;let linked=this.receipts.filter(r=>Number(r.serviceId)===Number(svc.id)),issued=linked.reduce((a,r)=>a+Number(r.total||0),0),pending=Math.max(0,paid-issued),d=String(svc.paymentDate||'');if(pending>0&&d.startsWith(y))rows.push({providerId:svc.providerId,category:svc.category,paymentDate:d,total:pending})});return rows},
  get dashboardCards(){let nowRef=new Date().toISOString().slice(0,7),year=this.yearlyRows,payments=this.yearlyPaymentRows,monthPayments=payments.filter(r=>String(r.paymentDate||'').slice(0,7)===nowRef),paidYear=payments.reduce((a,r)=>a+Number(r.total||0),0),paidMonth=monthPayments.reduce((a,r)=>a+Number(r.total||0),0),countMonth=monthPayments.length,open=year.reduce((a,s)=>a+this.balance(s),0),top=this.annualCategorySummary[0],topYear=this.annualTopProviders.slice(0,3).map(p=>p.name+' • '+this.money(p.total)),topMonth=Object.values(monthPayments.reduce((m,r)=>{let id=String(r.providerId??'');if(!m[id])m[id]={name:this.providerName(r.providerId),total:0};m[id].total+=Number(r.total||0);return m},{})).sort((a,b)=>b.total-a.total).slice(0,3).map(p=>p.name+' • '+this.money(p.total)),openTop=this.topOpenNames(year),catTop=this.annualCategorySummary.slice(0,3).map(c=>c.category+' • '+this.money(c.total)),activeCats=[...new Set(this.providers.map(p=>p.category).filter(Boolean))].slice(0,4),receiptsMonth=this.receipts.filter(r=>String(r.paymentDate||r.date||'').slice(0,7)===nowRef).length;return[
    {label:'Pago no ano',value:this.money(paidYear),hint:String(this.dashboardYear),icon:'wallet-cards',color:'text-rc-600',tooltipTitle:'Resumo anual',tooltipMain:this.money(paidYear),tooltipTag:'Ano '+this.dashboardYear,tooltip:['Total efetivamente pago no ano selecionado.','Top recebimentos: '+(topYear.length?topYear.join(' | '):'sem pagamentos lançados.'),'Use para comparar o volume anual com o relatório anual premium.']},
    {label:'Pago no mês',value:this.money(paidMonth),hint:this.month(nowRef),icon:'circle-dollar-sign',color:'text-emerald-600',tooltipTitle:'Resumo do mês',tooltipMain:this.money(paidMonth),tooltipTag:'Mês atual',tooltip:['Mês de referência: '+this.month(nowRef)+'.','Quem recebeu: '+(topMonth.length?topMonth.join(' | '):'sem pagamentos neste mês.'),'Ajuda a conferir rapidamente o fechamento mensal.']},
    {label:'Pagamentos no mês',value:countMonth,hint:'registros pagos',icon:'receipt-text',color:'text-blue-600',tooltipTitle:'Movimento mensal',tooltipMain:countMonth+' pagamento(s)',tooltipTag:'Recibos '+receiptsMonth,tooltip:['Valor médio por pagamento: '+this.money(countMonth?paidMonth/countMonth:0)+'.','Recibos emitidos no mês: '+receiptsMonth+'.','Bom para conferir se todos os pagamentos pagos já têm recibo.']},
    {label:'Prestadores ativos',value:this.providers.length,hint:'cadastrados',icon:'users',color:'text-rc-600',tooltipTitle:'Base de prestadores',tooltipMain:this.providers.length+' cadastro(s)',tooltipTag:'Cadastros',tooltip:['Categorias em uso: '+(activeCats.length?activeCats.join(', '):'nenhuma categoria cadastrada.'),'Use para localizar quem presta serviço recorrente ou avulso.','Dica: mantenha PIX, WhatsApp e categoria sempre atualizados.']},
    {label:'Em aberto no ano',value:this.money(open),hint:'lançamentos do ano',icon:'triangle-alert',color:'text-red-600',tooltipTitle:'Pendências do ano',tooltipMain:this.money(open),tooltipTag:'Atenção',tooltip:['Saldo atual dos lançamentos feitos no ano e ainda não quitados.','Maiores pendências: '+(openTop.length?openTop.join(' | '):'nenhuma pendência no ano.'),'Depois de pagar, registre o pagamento antes de emitir o recibo.']},
    {label:'Maior categoria',value:top?top.category:'-',hint:top?this.money(top.total):'sem dados',icon:'trophy',color:'text-yellow-600',tooltipTitle:'Categoria líder',tooltipMain:top?top.category:'Sem dados',tooltipTag:top?this.money(top.total):'Sem dados',tooltip:['Categoria com maior volume pago no ano.','Ranking: '+(catTop.length?catTop.join(' | '):'sem categorias pagas no ano.'),'Ajuda a identificar onde o condomínio mais gastou.']}
  ]},
  get annualTotals(){let paid=this.yearlyPaymentRows.reduce((a,r)=>a+Number(r.total||0),0),open=this.yearlyRows.reduce((a,s)=>a+this.balance(s),0),count=this.yearlyPaymentRows.length;return{paid,open,count}},
  get monthlyHistory(){let labels=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];return labels.map((label,i)=>{let key=String(this.dashboardYear)+'-'+String(i+1).padStart(2,'0'),payments=this.yearlyPaymentRows.filter(r=>String(r.paymentDate||'').slice(0,7)===key),services=this.yearlyRows.filter(s=>String(s.serviceDate||'').slice(0,7)===key),paid=payments.reduce((a,r)=>a+Number(r.total||0),0),open=services.reduce((a,s)=>a+this.balance(s),0),map={};payments.forEach(r=>{map[r.category]=(map[r.category]||0)+Number(r.total||0)});let top=Object.entries(map).sort((a,b)=>b[1]-a[1])[0];return{key,label,count:payments.length,paid,open,topCategory:top?top[0]:'-'}})},
  get annualTopProviders(){let map={};this.yearlyPaymentRows.forEach(r=>{let id=r.providerId,p=this.providers.find(x=>Number(x.id)===Number(id))||{};if(!map[id])map[id]={id,name:p.name||'-',category:p.category||r.category,count:0,total:0,open:0};map[id].count++;map[id].total+=Number(r.total||0)});this.yearlyRows.forEach(s=>{let id=s.providerId,p=this.providers.find(x=>Number(x.id)===Number(id))||{};if(!map[id])map[id]={id,name:p.name||'-',category:p.category||s.category,count:0,total:0,open:0};map[id].open+=this.balance(s)});return Object.values(map).filter(x=>x.total>0||x.open>0).sort((a,b)=>b.total-a.total).slice(0,10)},
  get annualCategorySummary(){let rows=this.yearlyPaymentRows,total=rows.reduce((a,r)=>a+Number(r.total||0),0)||1;return this.categories.map(category=>{let val=rows.filter(r=>r.category===category).reduce((a,r)=>a+Number(r.total||0),0);return{category,total:val,percent:Math.min(100,Math.round(val/total*100))}}).filter(x=>x.total>0).sort((a,b)=>b.total-a.total)},
'''

s = s[:start] + new + s[end:]
s = s.replace('<div class="report-kpi"><p class="label">Total pago</p><p class="value green" x-text="money(annualTotals.paid)"></p></div>', '<div class="report-kpi"><p class="label">Pago no ano</p><p class="value green" x-text="money(annualTotals.paid)"></p></div>', 1)
s = s.replace('<div class="report-kpi"><p class="label">Em aberto</p><p class="value red" x-text="money(annualTotals.open)"></p></div>', '<div class="report-kpi"><p class="label">Em aberto dos lançamentos</p><p class="value red" x-text="money(annualTotals.open)"></p></div>', 1)
p.write_text(s)

sw = Path('sw.js')
w = sw.read_text()
if 'recibocondo-v96-report-payment-date' not in w:
    raise SystemExit('cache base inesperado')
w = w.replace('recibocondo-v96-report-payment-date', 'recibocondo-v97-annual-payment-date')
sw.write_text(w)

assert 'get yearlyPaymentRows()' in s
assert 'get annualTotals(){let paid=this.yearlyPaymentRows.reduce' in s
assert 'payments=this.yearlyPaymentRows.filter' in s
assert 'Pago no ano</p><p class="value green" x-text="money(annualTotals.paid)' in s
assert 'recibocondo-v97-annual-payment-date' in w
