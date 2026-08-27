from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8')
terms=['generateRecurrence(','generateAllRecurrencesForMonth','saveRecurrence(','recurrenceForm','nextBusiness','businessDay','dueDate']
out=[]
for term in terms:
    start=0
    for i in range(6):
        p=s.find(term,start)
        if p<0: break
        out.append(f'===== {term} @ {p} =====\n'+s[max(0,p-1800):p+5000])
        start=p+len(term)
Path('recurrence-inspection.txt').write_text('\n\n'.join(out),encoding='utf-8')
