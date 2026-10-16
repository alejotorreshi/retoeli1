async (page) => {
  const CFG = __CFG__;
  const SHOTS = '/Users/alejo/Developer/Alejo/reto-eli-1/.qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/';
  const san = (s) => String(s ?? '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/\+?\d[\d .-]{5,}\d/g, (m) => /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : '[num]').replace(/\s+/g, ' ').trim();
  const cap = (s, n = 900) => { const t = san(s); return t.length > n ? t.slice(0, n) + '…' : t; };
  const ctx = await page.context().browser().newContext({ viewport: { width: 1280, height: 720 }, extraHTTPHeaders: { 'X-Forwarded-For': CFG.xff } });
  const p = await ctx.newPage();
  const t0 = Date.now();
  const log = []; const consoleErr = [];
  let cur = 'boot';
  p.on('console', (m) => { if (m.type() === 'error') consoleErr.push(cur + ': ' + cap(m.text(), 160)); });
  p.on('pageerror', (e) => consoleErr.push(cur + ': pageerror ' + cap(String(e), 160)));
  p.on('request', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api') && r.method() === 'POST' && u.pathname === '/api/chat') { let b = {}; try { b = JSON.parse(r.postData() || '{}'); } catch {} log.push(`${cur}| +${((Date.now() - t0) / 1000).toFixed(1)}s POST /api/chat sid=${b.sessionId ? 'set' : 'null'} msg=${cap(b.message, 50)}`); } });
  p.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api') && !(r.request().method() === 'POST' && u.pathname === '/api/chat')) log.push(`${cur}| +${((Date.now() - t0) / 1000).toFixed(1)}s ${r.request().method()} ${u.pathname.replace(/[0-9a-f-]{36}/, '<sid>')} ${r.status()}`); });
  p.on('requestfailed', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api')) log.push(`${cur}| +${((Date.now() - t0) / 1000).toFixed(1)}s FAILED ${r.method()} ${u.pathname} ${r.failure()?.errorText}`); });
  const MSG = 'procesa el caso co-industrias-delta QA-LENTO';
  const sid = async () => p.evaluate(() => localStorage.getItem('registro-proveedor.sesion-id'));
  const sesion = async () => p.evaluate(async () => { const id = localStorage.getItem('registro-proveedor.sesion-id'); if (!id) return { id: null }; const r = await fetch('/api/sessions/' + id); const j = await r.json().catch(() => ({})); const flat = {}; for (const [k, v] of Object.entries(j)) flat[k] = Array.isArray(v) ? `[${v.length}]` : (v && typeof v === 'object') ? `{${Object.keys(v).join(',')}}` : v; return { status: r.status, ...flat }; });
  const estado = async () => p.evaluate(() => {
    const main = document.querySelector('main')?.innerText ?? '';
    const aside = document.querySelector('aside');
    const card = [...(aside?.querySelectorAll('li') ?? [])].find((li) => li.querySelector('h3')?.innerText.trim() === 'co-industrias-delta');
    const stages = card ? [...card.querySelectorAll('[aria-label^="Avance de"] [aria-label]')].map((e) => e.getAttribute('aria-label')).join('; ') : null;
    const files = card ? [...card.querySelectorAll('a[aria-label^="Descargar"]')].map((a) => a.getAttribute('aria-label').replace('Descargar ', '')) : [];
    const avisos = card ? [...card.querySelectorAll('[role=status]')].map((e) => e.innerText.trim()).filter(Boolean) : [];
    const btn = (n) => { const b = [...document.querySelectorAll('button')].find((x) => (x.getAttribute('aria-label') || x.innerText).trim() === n); return b ? (b.disabled ? 'disabled' : 'enabled') : 'absent'; };
    const items = [...(document.querySelector('[aria-label="Conversación con el agente"]')?.querySelectorAll(':scope ol > li, :scope ul > li') ?? [])].map((li) => li.innerText.replace(/\s+/g, ' ').trim().slice(0, 140));
    return {
      enCurso: (main.match(/En curso/g) || []).length, correctas: (main.match(/Correcta/g) || []).length, pensando: main.includes('Pensando'),
      detener: btn('Detener respuesta'), enviar: btn('Enviar mensaje'), nuevaSesion: btn('Nueva sesión'),
      composerDisabled: document.querySelector('textarea')?.disabled ?? null,
      alertas: [...document.querySelectorAll('[role=alert]')].map((e) => e.innerText.trim()).filter(Boolean),
      stagesDelta: stages, filesDelta: files, avisosDelta: avisos,
      timelineTail: items.slice(-4),
    };
  });
  const capt = async (label) => { const e = await estado(); e.sesion = await sesion(); for (const k of Object.keys(e)) if (typeof e[k] === 'string') e[k] = san(e[k]); e.timelineTail = e.timelineTail.map((x) => san(x)); return e; };
  const send = async () => { const box = p.getByRole('textbox', { name: 'Mensaje para el agente' }); await box.fill(MSG); await box.press('Enter'); };
  const disk = async () => p.evaluate(async () => { const r = await fetch('/api/casos/co-industrias-delta/archivos'); const t = await r.text(); let j; try { j = JSON.parse(t); } catch { return { status: r.status }; } const list = Array.isArray(j) ? j : (j.archivos ?? j.files ?? []); return { status: r.status, nombres: list.map((x) => x.nombre ?? x.ruta ?? x.name ?? JSON.stringify(x).slice(0, 40)) }; });
  const res = { cfg: CFG };

  cur = 'login';
  await p.goto(CFG.base + '/');
  await p.getByRole('textbox', { name: 'Código de acceso' }).fill('codigo-local-de-prueba');
  await p.getByRole('button', { name: 'Entrar al agente' }).click();
  await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 8000 });
  await p.waitForTimeout(500);
  res.discoAntes = await disk();

  cur = 'a-detener';
  await send();
  await p.waitForTimeout(6000);
  res.a_antes = await capt();
  await p.screenshot({ path: `${SHOTS}05-testT09a-${CFG.label}-stale-antes.png` });
  await p.getByRole('button', { name: 'Detener respuesta' }).click();
  await p.waitForTimeout(1500);
  res.a_tras1500 = await capt();
  res.a_foco = await p.evaluate(() => { const a = document.activeElement; return a ? `${a.tagName.toLowerCase()} "${(a.getAttribute('aria-label') || '').slice(0, 40)}"` : null; });
  await p.screenshot({ path: `${SHOTS}05-testT09a-${CFG.label}-stale-tras-detener.png` });
  await p.waitForTimeout(8000);
  res.a_tras9500 = await capt();
  res.a_disco = await disk();

  res.log = log; res.consoleErr = consoleErr; res.ms = Date.now() - t0;
  await ctx.close();
  return JSON.stringify(res);
}
