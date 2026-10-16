async (page) => {
  const SHOTS = '/Users/alejo/Developer/Alejo/reto-eli-1/.qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/';
  const CODE = 'codigo-local-de-prueba';
  const san = (s) => String(s ?? '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/\+?\d[\d .-]{5,}\d/g, (m) => /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : '[num]').replace(/\s+/g, ' ').trim();
  const cap = (s, n = 600) => { const t = san(s); return t.length > n ? t.slice(0, n) + '…' : t; };
  const ctxs = [];
  const newP = async (base, w, h, xff) => {
    const ctx = await page.context().browser().newContext({ viewport: { width: w, height: h }, extraHTTPHeaders: { 'X-Forwarded-For': xff } });
    ctxs.push(ctx);
    const p = await ctx.newPage();
    p._log = []; p._err = [];
    p.on('console', (m) => { if (m.type() === 'error') p._err.push(cap(m.text(), 200)); });
    p.on('pageerror', (e) => p._err.push('pageerror ' + cap(String(e), 200)));
    p.on('response', (r) => { const u = new URL(r.url()); p._log.push(`${r.request().method()} ${u.host === new URL(base).host ? '' : u.host}${u.pathname} ${r.status()}`); });
    p._base = base;
    return p;
  };
  const login = async (p) => {
    await p.goto(p._base + '/');
    const tb = p.getByRole('textbox', { name: 'Código de acceso' });
    await tb.waitFor({ timeout: 10000 });
    await tb.fill(CODE);
    await tb.press('Enter');
    await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 10000 });
    await p.waitForTimeout(600);
  };
  const send = async (p, msg) => {
    const tb = p.getByRole('textbox', { name: 'Mensaje para el agente' });
    await tb.fill(msg); await tb.press('Enter');
  };
  const waitIdle = async (p, ms = 60000) => {
    const stop = p.getByRole('button', { name: 'Detener respuesta' });
    await stop.waitFor({ state: 'visible', timeout: 5000 }).catch(() => {});
    await stop.waitFor({ state: 'hidden', timeout: ms });
    await p.waitForTimeout(500);
  };
  const shot = async (p, id, slug, opts = {}) => { const path = `${SHOTS}05r-test${id}-${slug}.png`; await p.screenshot({ path, ...opts }); return path.split('/').pop(); };
  const overflow = (p) => p.evaluate(() => ({ doc: document.documentElement.scrollWidth - document.documentElement.clientWidth, body: document.body.scrollWidth - document.body.clientWidth }));
  const R = {};
  try {
    const H = 'http://127.0.0.1:3133', B = 'http://127.0.0.1:3134', L = 'http://127.0.0.1:3135';
    const zona = (p) => p.evaluate(() => {
      const z = document.querySelector('section[aria-label="Conversación con el agente"]') || document.querySelector('main section');
      if (!z) return { zona: null };
      const h = [...document.querySelectorAll('h2,h1,h3')].find((e) => e.textContent.trim() === '¿Qué caso procesamos?');
      const zr = z.getBoundingClientRect();
      const hr = h ? h.getBoundingClientRect() : null;
      const ir = [...document.querySelectorAll('button')].filter((b) => (b.getAttribute('aria-label') || b.innerText).trim() === 'Ir al final');
      const cards = [...document.querySelectorAll('button')].filter((b) => /^Procesar caso/.test(b.getAttribute('aria-label') || '')).length;
      return { scrollTop: Math.round(z.scrollTop * 10) / 10, scrollHeight: z.scrollHeight, clientHeight: z.clientHeight, max: z.scrollHeight - z.clientHeight, atBottomGap: Math.round((z.scrollHeight - z.clientHeight - z.scrollTop) * 10) / 10, heading: hr ? { top: Math.round(hr.top), bottom: Math.round(hr.bottom), inViewport: hr.top >= 0 && hr.bottom <= innerHeight, inZona: hr.top >= zr.top - 0.5 && hr.bottom <= zr.bottom + 0.5 } : null, irAlFinal: ir.length, irAlFinalVisible: ir.some((b) => b.getBoundingClientRect().width > 0), caseCards: cards, zonaClass: z.className.split(' ').length };
    });
