from pathlib import Path
s=Path('index.html').read_text(encoding='utf-8')
terms=['async saveRecurrence','async generateRecurrence','async generateAllRecurrencesForMonth','recurrenceMonthKey','recurrenceDueDate','get dayPendingRecurrences']
out=[]
for term in terms:
 p=s.find(term)
 if p>=0:
  chunk=s[p:p+7000]
  chunk=chunk.replace('},', '},\n').replace('){','){\n').replace(';',';\n')
  out.append(f'===== {term} @ {p} =====\n'+chunk)
Path('recurrence-inspection.txt').write_text('\n\n'.join(out),encoding='utf-8')
