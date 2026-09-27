from pathlib import Path

FILES = [
    'week3_case_quiz_30.html','week4_case_quiz_27.html','week5_case_quiz_19.html',
    'week6_case_quiz_33.html','week7_case_quiz_35.html','week8_case_quiz_27.html','week9_case_quiz_28.html'
]
MARKER='cbl-supabase.js'
INJECT='''\n<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>\n<script src="cbl-supabase.js"></script>\n'''
REQUIRED = ['const QUESTIONS=', 'QUIZ_KEY', 'FLAG_KEY', 'let flags=', 'function showResults()', 'function resetState()', 'data-flag-q']
for name in FILES:
    path=Path('weeks/cbl')/name
    text=path.read_text(encoding='utf-8')
    missing=[token for token in REQUIRED if token not in text]
    if missing:
        raise RuntimeError(f'{name}: legacy integration contract missing {missing}')
    if MARKER in text:
        print(f'{name}: already integrated and contract validated')
        continue
    if '</body>' not in text:
        raise RuntimeError(f'{name}: missing </body>')
    text=text.replace('</body>',INJECT+'</body>',1)
    path.write_text(text,encoding='utf-8')
    print(f'{name}: integrated and contract validated')
