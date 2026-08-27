from pathlib import Path
import subprocess, tempfile

html=Path('index.html').read_text(encoding='utf-8')
sw=Path('sw.js').read_text(encoding='utf-8')
checks={
'Dexie v4 payments store':"db.version(4).stores" in html and "payments:'++id,serviceId,providerId,date,method'" in html,
'payments loaded into app state':"payments:[]" in html and "this.payments=await db.payments.toArray()" in html,
'atomic per-service legacy migration':"db.transaction('rw',db.payments" in html and "db.payments.bulkAdd(rows)" in html and "db.payments.where('serviceId').equals(s.id).toArray()" in html,
'new payments written individually':"source:'manual'" in html and "await db.payments.add({serviceId:s.id" in html,
'receipt linked to exact payment':"paymentId:payment?.id||null" in html and "await db.payments.update(payment.id,{receiptId:id})" in html,
'deleting receipt preserves payment':"await db.payments.update(p.id,{receiptId:null})" in html,
'reports use payment ledger':"get reportDetailRows(){let rows=[]" in html and "this.payments.filter(p=>Number(p.serviceId)===Number(s.id))" in html,
'dashboard paid rows use ledger':"get yearlyPaymentRows(){let y=" in html and "return this.payments.filter" in html,
'backup format 3 includes payments':"backupFormat:3" in html and "payments:this.payments" in html,
'restore validates payments':"badPayment=payments.find" in html and "db.payments.bulkAdd(payments)" in html,
'clear-all clears payments':"await db.payments.clear()" in html,
'integrity audit compares ledger and paid total':"Histórico de pagamentos do lançamento" in html,
'cache v101 active':"recibocondo-v101-payment-ledger" in sw,
}
start=html.find("const db=new Dexie('ReciboCondoPrestadoresDB');")
end=html.find('</script>',start)
syntax=False
if start>=0 and end>start:
    with tempfile.NamedTemporaryFile('w',suffix='.js',delete=False,encoding='utf-8') as f:
        f.write(html[start:end]); name=f.name
    syntax=subprocess.run(['node','--check',name],capture_output=True,text=True).returncode==0
checks['JavaScript syntax valid']=syntax
lines=['ReciboCondo v101 verification','============================','']
for k,v in checks.items(): lines.append(('PASS' if v else 'FAIL')+' | '+k)
lines += ['',f"RESULT | {sum(checks.values())}/{len(checks)} checks passed"]
Path('tools/v101_verification.txt').write_text('\n'.join(lines)+'\n',encoding='utf-8')
print('\n'.join(lines))
if not all(checks.values()): raise SystemExit(1)
