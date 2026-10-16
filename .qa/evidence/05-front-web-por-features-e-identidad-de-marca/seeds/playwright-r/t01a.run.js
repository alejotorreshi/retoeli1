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
  const measureHeader = (p) => p.evaluate(() => {
    const h = document.querySelector('header');
    const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: Math.round(b.x*10)/10, y: Math.round(b.y*10)/10, w: Math.round(b.width*10)/10, h: Math.round(b.height*10)/10, top: Math.round(b.top), bottom: Math.round(b.bottom), right: Math.round(b.right*10)/10 }; };
    const marca = h.firstElementChild, meta = h.children[1];
    const img = marca.querySelector('img'), div = marca.querySelector('[aria-hidden="true"]'), h1 = marca.querySelector('h1');
    const cs = (e) => getComputedStyle(e);
    const inter = (a, b) => !(a.right <= b.x || b.right <= a.x || a.bottom <= b.top || b.bottom <= a.top);
    const ri = r(img), rd = r(div), rt = r(h1);
    const kids = [...meta.children].map((k) => { const tx = k.querySelector('span[class*="texto"]'); const pre = tx?.firstElementChild; return { tag: k.tagName, text: k.innerText, rect: r(k), textoOverflow: tx ? { to: cs(tx).textOverflow, ws: cs(tx).whiteSpace, ov: cs(tx).overflow, sw: tx.scrollWidth, cw: tx.clientWidth } : null, prefijo: pre ? { display: cs(pre).display, w: pre.getBoundingClientRect().width, text: pre.textContent } : null }; });
    const tops = [...new Set(kids.map((k) => k.rect.top))];
    const lineH = parseFloat(cs(meta.children[0]).lineHeight);
    return {
      header: r(h), img: ri, imgHeight: ri.h, divisor: rd, title: rt,
      titleFont: cs(h1).fontFamily, titleSize: cs(h1).fontSize, titleText: h1.innerText,
      line1SameRow: Math.abs((ri.top + ri.bottom)/2 - (rt.top + rt.bottom)/2) <= 4 && Math.abs((rd.top + rd.bottom)/2 - (rt.top + rt.bottom)/2) <= 4 && rt.bottom <= r(meta).top + 1,
      logoTitleIntersect: inter(ri, rt), logoDivIntersect: inter(ri, rd), divTitleIntersect: inter(rd, rt),
      meta: r(meta), metaKids: kids, metaRowTops: tops, metaOneRow: tops.length === 1 || Math.max(...kids.map(k=>k.rect.top)) < Math.min(...kids.map(k=>k.rect.bottom)),
      title2lines: rt.h > parseFloat(cs(h1).lineHeight) * 1.5,
      docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
    R.vp = {};
    let n = 10;
    const nueva = async (p) => {
      await p.getByRole('button', { name: 'Nueva sesión' }).click();
      const d = p.getByRole('dialog'); await d.waitFor({ timeout: 4000 });
      await d.getByRole('button', { name: 'Empezar sesión nueva' }).click();
      await p.waitForTimeout(1500);
    };
    const sidOf = (p) => p.evaluate(() => (localStorage.getItem('registro-proveedor.sesion-id') || '').slice(0, 8));
    for (const [w, hgt] of [[1280, 720], [375, 667]]) {
      const r = R.vp[w] = {};
      const p = await newP(H, w, hgt, '10.6.0.' + (n++));
      await login(p);
      r.entrada = await zona(p);
      await p.waitForTimeout(1500);
      r.entrada2s = await zona(p);
      r.sid0 = await sidOf(p);
      r.entradaShot = await shot(p, 'T01a', 'vacio-entrada-' + w);
      await p.reload(); await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 10000 }); await p.waitForTimeout(1500);
      r.a_recargaSinTurnos = await zona(p); r.a_sid = await sidOf(p);
      await send(p, 'procesa el caso ec-corp-andina'); await waitIdle(p); await p.waitForTimeout(800);
      r.conTurno = await zona(p);
      await nueva(p);
      r.b_nuevaPegada = await zona(p); r.b_sid = await sidOf(p);
      if (w === 375) r.b_shot = await shot(p, 'T01a', 'vacio-tras-nueva-pegada-375');
      await p.reload(); await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 10000 }); await p.waitForTimeout(1500);
      r.a2_recargaNuevaSinTurnos = await zona(p); r.a2_sid = await sidOf(p);
      await send(p, 'procesa el caso ec-corp-andina'); await waitIdle(p); await p.waitForTimeout(500);
      await send(p, 'procesa el caso co-industrias-delta QA-LENTO');
      await p.waitForTimeout(2500);
      await p.evaluate(() => { const z = document.querySelector('section[aria-label="Conversación con el agente"]'); z.scrollTop = 0; z.dispatchEvent(new Event('scroll')); });
      await p.mouse.move(w / 2, hgt / 2); await p.mouse.wheel(0, -2000);
      await p.waitForTimeout(6000);
      r.lentoSubido = await zona(p);
      r.lentoShot = await shot(p, 'T01a', 'ir-al-final-lento-' + w);
      await waitIdle(p, 60000);
      r.lentoFin = await zona(p);
      await nueva(p);
      r.c_nuevaSubida = await zona(p); r.c_sid = await sidOf(p);
      r.c_shot = await shot(p, 'T01a', 'vacio-tras-nueva-subida-' + w);
      r.overflow = await overflow(p);
      r.err = p._err;
      r.log = p._log.filter((x) => x.includes('/api/')).map((x) => x.replace(/[0-9a-f-]{36}/, '<sid>'));
    }
    {
      const r = R.tarde = {};
      const p = await newP(H, 1280, 720, '10.6.0.' + (n++));
      await p.route('**/api/config', async (route) => { await new Promise((ok) => setTimeout(ok, 1500)); await route.continue(); });
      await login(p).catch((e) => { r.loginErr = cap(String(e), 200); });
      r.inmediato = await zona(p);
      await p.waitForTimeout(2500);
      r.tras2500 = await zona(p);
      await p.reload(); await p.waitForTimeout(800); r.recargaTemprana = await zona(p);
      await p.waitForTimeout(3000); r.recargaTras = await zona(p);
      r.err = p._err;
      r.log = p._log.filter((x) => x.includes('/api/')).map((x) => x.replace(/[0-9a-f-]{36}/, '<sid>'));
    }
  } catch (e) { R.fatal = cap(String(e.stack || e), 900); }
  for (const c of ctxs) await c.close().catch(() => {});
  return JSON.stringify(R, null, 1);
}
