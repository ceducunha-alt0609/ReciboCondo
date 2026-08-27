from pathlib import Path

p = Path('index.html')
text = p.read_text(encoding='utf-8')
keys = [
    "const db=new Dexie",
    "async load()",
    "auditDataIntegrity()",
    "get yearlyPaymentRows",
    "get reportRows",
    "get reportDetailRows",
    "backupStats()",
    "async saveService()",
    "async savePayment()",
    "async issueReceipt()",
    "async removePaymentInternal",
    "async removeReceiptInternal",
    "async backup()",
    "async restore(ev)",
    "async clearAllInternal()",
]
parts=[]
for key in keys:
    i=text.find(key)
    parts.append('\n\n===== '+key+' =====\n')
    if i<0:
        parts.append('NOT FOUND\n')
        continue
    start=max(0,i-700)
    end=min(len(text),i+5000)
    parts.append(text[start:end])
Path('tools/v101_inspection.txt').write_text(''.join(parts),encoding='utf-8')
print('inspection written', len(text))
