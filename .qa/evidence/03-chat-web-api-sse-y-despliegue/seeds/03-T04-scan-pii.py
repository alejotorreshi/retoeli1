import json, sys, os, re, glob
maestro_path, secret_path = sys.argv[1], sys.argv[2]
targets = sys.argv[3:]
PUBLIC = {"razon_social","tipo_sociedad","ciudad","departamento","pais","sitio_web","actividad_economica","ciiu_principal","ciiu_secundario","regimen_tributario","numero_empleados"}
def walk(o, pre=""):
    if isinstance(o, dict):
        for k, v in o.items(): yield from walk(v, pre + ("." if pre else "") + k)
    elif isinstance(o, list):
        for i, v in enumerate(o): yield from walk(v, f"{pre}[{i}]")
    else: yield pre, o
m = json.load(open(maestro_path))
needles = {}
for path, v in walk(m):
    if path in PUBLIC or isinstance(v, bool) or v is None: continue
    s = str(v)
    if len(s) < 6: continue
    if re.fullmatch(r"[A-Z]{3}|\d{4}|ahorros|corriente|NIT|CC|CE", s): continue
    needles[path] = [s]
    d = re.sub(r"\D", "", s)
    if len(d) >= 7 and d != s: needles[path].append(d)
secret = open(secret_path).read().strip()
special = {"SENTINEL_KEY": ["clave-falsa-qa-centinela"], "ACCESS_TOKEN_SECRET": [secret], "ACCESS_CODE": ["codigo-local-de-prueba"]}
def mask(s): return s[:2] + "…" + s[-2:] if len(s) > 6 else "…"
files = []
for t in targets:
    if os.path.isdir(t):
        for root, _, fs in os.walk(t):
            files += [os.path.join(root, f) for f in fs]
    else: files += glob.glob(t)
hits = []
for f in files:
    try: txt = open(f, "rb").read().decode("utf-8", "replace")
    except Exception: continue
    for path, ns in list(needles.items()) + list(special.items()):
        for n in ns:
            c = txt.count(n)
            if c: hits.append((f, path, mask(n) if path not in special else "<secret>", c))
for h in hits: print("HIT", os.path.relpath(h[0]), h[1], h[2], h[3])
print("files_scanned", len(files), "needles", sum(len(v) for v in needles.values()), "hits", len(hits))
