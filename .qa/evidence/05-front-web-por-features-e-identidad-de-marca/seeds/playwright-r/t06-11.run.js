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
  const SCAN = `(() => {
    const NEON = 'rgb(109, 253, 140)';
    const tokc = (n) => { const d = document.createElement('div'); d.style.color = 'var(' + n + ')'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    const TEAL = [tokc('--marca'), tokc('--marca-elevada'), tokc('--marca-hover')];
    const opaque = (c) => { const m = c.match(/rgba?\\(([^)]+)\\)/); if (!m) return false; const a = m[1].split(/[ ,\\/]+/).filter(Boolean); return a.length < 4 || Number(a[3]) >= 0.99; };
    const bgOf = (e) => { while (e && e.nodeType === 1) { const c = getComputedStyle(e).backgroundColor; if (opaque(c)) return { c, el: e.tagName.toLowerCase() + '.' + String(e.className?.baseVal ?? e.className).split(' ')[0] }; e = e.parentElement; } return { c: 'rgb(255, 255, 255)', el: 'canvas' }; };
    const desc = (e) => e.tagName.toLowerCase() + '.' + String(e.className?.baseVal ?? e.className).split(' ')[0] + ' "' + (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 30) + '"';
    const vis = (e) => { const r = e.getBoundingClientRect(); if (r.width === 0 && r.height === 0) return false; const cs = getComputedStyle(e); return cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0; };
    const hits = [];
    for (const e of document.querySelectorAll('body *')) {
      if (!vis(e)) continue;
      const cs = getComputedStyle(e);
      const props = [];
      const hasText = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (cs.color === NEON && (hasText || e.tagName === 'svg' || e.closest('svg'))) props.push('color');
      for (const s of ['Top', 'Right', 'Bottom', 'Left']) if (cs['border' + s + 'Color'] === NEON && parseFloat(cs['border' + s + 'Width']) > 0 && cs['border' + s + 'Style'] !== 'none') { props.push('border'); break; }
      if (cs.outlineColor === NEON && cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) props.push('outline');
      if (cs.backgroundColor === NEON) props.push('background');
      if (cs.boxShadow && cs.boxShadow.includes(NEON)) props.push('box-shadow');
      if (cs.textDecorationLine !== 'none' && cs.textDecorationColor === NEON) props.push('text-decoration');
      if (e.closest('svg') && (cs.fill === NEON || cs.stroke === NEON)) props.push('svg-paint');
      if (!props.length) continue;
      const surround = props.every((p) => p === 'color' || p === 'svg-paint') ? bgOf(e) : bgOf(e.parentElement);
      hits.push({ el: desc(e), props: [...new Set(props)].join('+'), surround: surround.c, surroundEl: surround.el, onTeal: TEAL.includes(surround.c) });
    }
    const a = document.activeElement;
    return { hits, active: a && a !== document.body ? desc(a) : null, activeOutline: a ? { color: getComputedStyle(a).outlineColor, style: getComputedStyle(a).outlineStyle, width: getComputedStyle(a).outlineWidth, inCard: !!a.closest('form') } : null, acento: tokc('--acento'), teal: TEAL };
  })()`;
  const ALL = new Map();
  const record = (state, res) => { for (const h of res.hits) { const k = h.el + '|' + h.props + '|' + h.surround; if (!ALL.has(k)) ALL.set(k, { ...h, firstState: state }); } };
  const tabWalk = async (p, state, max = 60, stopWhen) => {
    const focusLog = [];
    record(state + ':idle', await p.evaluate(SCAN));
    const seen = new Set();
    for (let i = 0; i < max; i++) {
      await p.keyboard.press('Tab');
      await p.waitForTimeout(60);
      const res = await p.evaluate(SCAN);
      record(state + ':tab' + i, res);
      if (!res.active) { focusLog.push('(body)'); continue; }
      focusLog.push({ el: res.active, outline: res.activeOutline });
      if (seen.has(res.active) && i > 3 && res.active === focusLog[0]?.el) break;
      seen.add(res.active);
      if (stopWhen && stopWhen(res)) break;
    }
    return focusLog;
  };
    const scanHdr = (p) => p.evaluate(() => {
      const h = document.querySelector('header');
      if (!h) return { header: false, body: document.body.innerText.trim().slice(0, 60) };
      const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && cs.clipPath !== 'inset(50%)'; };
      const empty = [...h.querySelectorAll('*')].filter((e) => vis(e) && !e.closest('svg') && !['IMG', 'svg', 'path'].includes(e.tagName) && !e.querySelector('img,svg') && e.textContent.trim() === '' && !(e.getAttribute('aria-hidden') === 'true' && e.parentElement === h.firstElementChild)).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height));
      const seps = [...h.querySelectorAll('*')].filter((e) => vis(e) && e.children.length === 0 && /^[·|•\-–]$/.test(e.textContent.trim())).length;
      const kids = [...h.children[1].children].map((k) => { const r = k.getBoundingClientRect(); return { t: k.textContent.trim().slice(0, 30), x: Math.round(r.x), right: Math.round(r.right) }; });
      const gaps = kids.slice(1).map((k, i) => k.x - kids[i].right);
      return { header: true, text: h.innerText.replace(/\s+/g, ' ').trim(), empty, seps, gaps };
    });
    R.t06 = {};
    let n = 70;
    for (const variant of ['ambos', 'solo-salud']) for (const [w, hgt] of [[1280, 720], [375, 667]]) {
      const r = R.t06[variant + '-' + w] = {};
      const p = await newP(H, w, hgt, '10.6.0.' + (n++));
      await login(p);
      await p.route('**/api/health', async (route) => { await new Promise((ok) => setTimeout(ok, 8000)); await route.continue().catch(() => {}); });
      if (variant === 'ambos') await p.route('**/api/config', async (route) => { await new Promise((ok) => setTimeout(ok, 8000)); await route.continue().catch(() => {}); });
      await p.reload({ waitUntil: 'domcontentloaded' });
      await p.waitForTimeout(1500); r.t1500 = await scanHdr(p);
      await p.waitForTimeout(3000); r.t4500 = await scanHdr(p);
      if ((variant === 'ambos' && w === 375) || variant === 'solo-salud') r.shot = await shot(p, 'T06', `${variant}-pendiente-${w}`, { clip: { x: 0, y: 0, width: w, height: w === 375 ? 140 : 100 } });
      await p.waitForTimeout(6000); r.resuelto = await scanHdr(p);
      r.err = p._err.filter((x) => !x.includes('401'));
    }
    R.t07 = {};
    for (const [w, hgt] of [[320, 568], [1280, 720]]) {
      const p = await newP(L, w, hgt, '10.6.0.' + (n++));
      await login(p); await p.waitForTimeout(800);
      R.t07[w] = await p.evaluate(() => {
        const h = document.querySelector('header'); const ps = [...h.children[1].querySelectorAll(':scope > p')]; const m = ps[1];
        const tx = m.querySelector(':scope > span:not([aria-hidden])'); const pre = tx.querySelector('span'); const cs = getComputedStyle(tx);
        const kids = [...h.children[1].children].map((k) => k.getBoundingClientRect());
        return { prefijoLen: pre.textContent.length, prefijoClase: pre.className || null, prefijoAncho: +pre.getBoundingClientRect().width.toFixed(1), prefijoOculto: pre.getBoundingClientRect().width <= 1 || getComputedStyle(pre).display === 'none', visibleLabel: [...tx.childNodes].filter((x) => x.nodeType === 3).map((x) => x.textContent).join(''), textOverflow: cs.textOverflow, whiteSpace: cs.whiteSpace, overflow: cs.overflow, sw: tx.scrollWidth, cw: tx.clientWidth, chipW: +m.getBoundingClientRect().width.toFixed(1), line2OneRow: Math.max(...kids.map((k) => k.top)) < Math.min(...kids.map((k) => k.bottom)), headerH: h.getBoundingClientRect().height, titleH: h.querySelector('h1').getBoundingClientRect().height, docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      if (w === 320) R.t07.shot = await shot(p, 'T07', 'modelo-largo-320', { clip: { x: 0, y: 0, width: 320, height: 90 } });
    }
    R.t11 = {};
    let m = 90;
    {
      const p = await newP(H, 375, 667, '10.6.0.' + (m++));
      await p.goto(H + '/'); await p.getByRole('textbox', { name: 'Código de acceso' }).waitFor();
      R.t12acceso = await shot(p, 'T12', 'acceso-375');
      const focusLog = await tabWalk(p, 'acceso-375', 8);
      R.t11.accesoFoco = focusLog.map((f) => typeof f === 'string' ? f : { el: f.el, color: f.outline.color, style: f.outline.style, inCard: f.outline.inCard });
      R.t11.acento = (await p.evaluate(SCAN)).acento;
      await p.close();
    }
    for (const [w, hgt] of [[375, 667], [320, 568], [1280, 720]]) {
      const p = await newP(H, w, hgt, '10.6.0.' + (m++));
      await login(p); await p.waitForTimeout(500);
      await p.evaluate(() => document.activeElement?.blur());
      const ns = p.getByRole('button', { name: 'Nueva sesión' });
      await ns.focus(); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab');
      const nsFocus = await p.evaluate(() => { const b = document.activeElement; const cs = getComputedStyle(b); const bg = (e) => { while (e) { const c = getComputedStyle(e).backgroundColor; if (!/rgba\(0, 0, 0, 0\)|transparent/.test(c)) return c; e = e.parentElement; } return null; }; return { el: b.textContent.trim(), focusVisible: b.matches(':focus-visible'), outline: cs.outlineColor + ' ' + cs.outlineStyle + ' ' + cs.outlineWidth, border: cs.borderTopColor + ' ' + cs.borderTopWidth, color: cs.color, bgBehind: bg(b.parentElement), bgSelf: cs.backgroundColor }; });
      await ns.hover(); await p.waitForTimeout(250);
      const nsHover = await p.evaluate(() => { const b = [...document.querySelectorAll('header button')][0]; const cs = getComputedStyle(b); return { border: cs.borderTopColor, color: cs.color, bg: cs.backgroundColor }; });
      await p.mouse.move(1, hgt - 1);
      const walk = await tabWalk(p, 'chat-' + w, 25);
      R.t11['chat-' + w] = { nsFocus, nsHover, focos: walk.filter((f) => typeof f !== 'string').map((f) => f.el + ' :: ' + f.outline.color).slice(0, 25) };
      if (w === 1280) {
        R.t12 = await p.evaluate(async () => {
          const grid = [...document.querySelectorAll('button')].find((b) => /^Procesar caso/.test(b.getAttribute('aria-label') || ''))?.parentElement;
          const g = grid?.tagName === 'LI' ? grid.parentElement : grid;
          const fav = document.querySelector('link[rel~="icon"]')?.getAttribute('href');
          const fr = fav ? await fetch(fav) : null;
          await document.fonts.ready;
          return { title: document.title, favicon: fav, faviconStatus: fr?.status, gridCols: g ? getComputedStyle(g).gridTemplateColumns : null, fonts: [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family + ' ' + f.weight), thirdParty: performance.getEntriesByType('resource').map((e) => new URL(e.name).host).filter((h) => h !== location.host) };
        });
      }
      if (w === 375) R.t12grid375 = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /^Procesar caso/.test(x.getAttribute('aria-label') || '')); let g = b?.parentElement; if (g?.tagName === 'LI') g = g.parentElement; return g ? getComputedStyle(g).gridTemplateColumns : null; });
    }
    R.t11.neonHits = [...ALL.values()].map((h) => `${h.el} [${h.props}] on ${h.surround} (${h.surroundEl}) teal=${h.onTeal} first=${h.firstState}`);
    R.t11.neonOffTeal = [...ALL.values()].filter((h) => !h.onTeal).length;
  } catch (e) { R.fatal = cap(String(e.stack || e), 900); }
  for (const c of ctxs) await c.close().catch(() => {});
  return JSON.stringify(R, null, 1);
}
