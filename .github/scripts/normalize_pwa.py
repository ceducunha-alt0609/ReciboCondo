from pathlib import Path
import re, json

p = Path("index.html")
s = p.read_text(encoding="utf-8")
fence = chr(96) * 3

stripped = s.lstrip("\ufeff \t\r\n")
if stripped.startswith(fence):
    pos = s.find(fence)
    end = pos + 3
    while end < len(s) and s[end] in "\r\n":
        end += 1
    s = s[:pos] + s[end:]

tail = s.rstrip()
if tail.endswith(fence):
    last = tail.rfind(fence)
    s = tail[:last].rstrip() + "\n"

s = re.sub(
    r'<link\s+rel=["\']manifest["\'][^>]*>',
    '<link rel="manifest" href="/ReciboCondo/manifest.json?v=173" />',
    s,
    count=1,
    flags=re.I,
)

for pattern in [
    r'\s*<link\s+rel=["\']icon["\']\s+href=["\']favicon\.ico["\']\s*/?>',
    r'\s*<link\s+rel=["\']icon["\'][^>]*icon-32\.png[^>]*>',
    r'\s*<link\s+rel=["\']icon["\'][^>]*icon-192\.png[^>]*>',
    r'\s*<link\s+rel=["\']apple-touch-icon["\'][^>]*>',
]:
    s = re.sub(pattern, "", s, flags=re.I)

marker = '<link rel="manifest" href="/ReciboCondo/manifest.json?v=173" />'
icons = """
  <link rel="icon" type="image/png" sizes="192x192" href="/ReciboCondo/assets/icons/recibocondo-pwa-192-v172.png?v=173" />
  <link rel="icon" type="image/png" sizes="512x512" href="/ReciboCondo/assets/icons/recibocondo-pwa-512-v172.png?v=173" />
  <link rel="apple-touch-icon" href="/ReciboCondo/assets/icons/recibocondo-pwa-192-v172.png?v=173" />"""
if marker in s:
    s = s.replace(marker, marker + icons, 1)

p.write_text(s, encoding="utf-8")

mp = Path("manifest.json")
d = json.loads(mp.read_text(encoding="utf-8"))
d["id"] = "/ReciboCondo/"
d["start_url"] = "/ReciboCondo/"
d["scope"] = "/ReciboCondo/"
d["icons"] = [
    {"src":"/ReciboCondo/assets/icons/recibocondo-pwa-192-v172.png?v=173","sizes":"192x192","type":"image/png","purpose":"any"},
    {"src":"/ReciboCondo/assets/icons/recibocondo-pwa-512-v172.png?v=173","sizes":"512x512","type":"image/png","purpose":"any"},
    {"src":"/ReciboCondo/assets/icons/recibocondo-maskable-192-v172.png?v=173","sizes":"192x192","type":"image/png","purpose":"maskable"},
    {"src":"/ReciboCondo/assets/icons/recibocondo-maskable-512-v172.png?v=173","sizes":"512x512","type":"image/png","purpose":"maskable"},
]
mp.write_text(json.dumps(d, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

sw = Path("sw.js")
ss = sw.read_text(encoding="utf-8")
ss = re.sub(r"const CACHE_NAME = 'recibocondo-[^']+';", "const CACHE_NAME = 'recibocondo-v173-normalized-pwa-identity';", ss, count=1)
sw.write_text(ss, encoding="utf-8")

assert s.lstrip().lower().startswith("<!doctype html>")
assert '/ReciboCondo/manifest.json?v=173' in s
assert 'recibocondo-pwa-192-v172.png?v=173' in s
print("PWA identity normalized.")
