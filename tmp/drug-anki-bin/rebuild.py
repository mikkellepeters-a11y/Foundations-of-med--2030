from pathlib import Path
import base64, hashlib

parts=[]
for p in sorted(Path('tmp/drug-anki-bin').glob('part*.txt')):
    parts.append(p.read_text(encoding='ascii').strip())
raw=base64.b64decode(''.join(parts), validate=True)
sha=hashlib.sha256(raw).hexdigest()
expected='241504de7218c8b73979949f9f592d8382b19c4cfc49f51dc45bd0bdb7c9a8b4'
if sha != expected:
    raise SystemExit(f'SHA mismatch: {sha} != {expected}')
out=Path('weeks/drug-hub/downloads/Foundations_Pharmacology_Use_First_95.apkg')
out.parent.mkdir(parents=True, exist_ok=True)
out.write_bytes(raw)
print(f'Wrote {len(raw)} bytes; SHA-256 {sha}')
