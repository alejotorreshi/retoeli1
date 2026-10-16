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
    const ESTADOS = ['disponible', 'sin_clave', 'saldo_agotado', 'no_disponible', 'tope_diario'];
    const medir = (p) => p.evaluate(() => {
      const h = document.querySelector('header');
      const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1), right: +b.right.toFixed(1), bottom: +b.bottom.toFixed(1) }; };
      const cs = (e) => getComputedStyle(e);
      const inter = (a, b) => !!a && !!b && !(a.right <= b.x || b.right <= a.x || a.bottom <= b.y || b.bottom <= a.y);
      const marca = h.firstElementChild, meta = h.children[1];
      const img = marca.querySelector('img'), div = marca.querySelector('span[aria-hidden="true"]'), h1 = marca.querySelector('h1');
      const ri = r(img), rd = r(div), rt = r(h1);
      const titleRange = document.createRange(); titleRange.selectNodeContents(h1);
      const titleLines = new Set([...titleRange.getClientRects()].map((x) => Math.round(x.top))).size;
      const chip = (p) => { if (!p) return null; const tx = p.querySelector(':scope > span:not([aria-hidden])'); const tn = [...tx.childNodes].filter((n) => n.nodeType === 3).at(-1); const rg = document.createRange(); if (tn) rg.selectNodeContents(tn); const rr = tn ? rg.getBoundingClientRect() : null; const tr = tx.getBoundingClientRect(); const pre = tx.querySelector('span'); return { text: tn?.textContent, rect: r(p), sw: tx.scrollWidth, cw: tx.clientWidth, full: tx.scrollWidth <= tx.clientWidth && (!rr || rr.right <= tr.right + 0.5), textOverflow: cs(tx).textOverflow, prefijoOculto: pre ? (pre.getBoundingClientRect().width <= 1 || cs(pre).display === 'none') : null, prefijo: pre?.textContent }; };
      const ps = [...meta.querySelectorAll(':scope > p')];
      const fecha = ps[0], modelo = ps.length > 1 ? ps[1] : null;
      const btn = meta.querySelector('button');
      const kids = [...meta.children].map(r);
      const btnTxt = [...btn.querySelectorAll('span')].map((s) => ({ cls: s.className, display: cs(s).display, w: +s.getBoundingClientRect().width.toFixed(1), text: s.textContent }));
      return {
        diseno: document.querySelector('[data-diseno]')?.getAttribute('data-diseno'),
        header: r(h), img: ri, divisor: rd, title: rt, titleLineHeight: cs(h1).lineHeight, titleSize: cs(h1).fontSize, titleFont: cs(h1).fontFamily.split(',')[0], titleLines,
        line1Centers: [ri, rd, rt].map((x) => +(x.y + x.h / 2).toFixed(1)),
        line1OneRow: Math.max(...[ri, rd, rt].map((x) => x.y + x.h / 2)) - Math.min(...[ri, rd, rt].map((x) => x.y + x.h / 2)) <= 4,
        overlaps: { logoTitle: inter(ri, rt), logoDiv: inter(ri, rd), divTitle: inter(rd, rt), titleRightInHeader: rt.right <= r(h).right + 0.5 },
        line2Tops: kids.map((k) => k.y), line2OneRow: Math.max(...kids.map((k) => k.y)) < Math.min(...kids.map((k) => k.bottom)), line2Right: Math.max(...kids.map((k) => k.right)),
        fecha: chip(fecha), modelo: chip(modelo),
        boton: { rect: r(btn), disabled: btn.disabled, spans: btnTxt, svg: !!btn.querySelector('svg'), ariaLabel: btn.getAttribute('aria-label') },
        docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    R.angosto = {};
    let n = 40;
    for (const [w, hgt] of [[375, 667], [320, 568]]) {
      const r = R.angosto[w] = { estados: {} };
      const p = await newP(H, w, hgt, '10.6.0.' + (n++));
      let estado = 'disponible';
      await p.route('**/api/health', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, provider: 'falso', model: 'modelo-falso', llm: estado }) }));
      await login(p);
      for (const e of ESTADOS) {
        estado = e;
        await p.reload(); await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 10000 }); await p.waitForTimeout(1200);
        const m = await medir(p);
        r.estados[e] = m;
        if (e === 'disponible') r.shotDisp = await shot(p, 'T02', 'encabezado-' + w, { clip: { x: 0, y: 0, width: w, height: Math.ceil(m.header.h) + 2 } });
        if (w === 320 && e === 'sin_clave') r.shotSinClave = await shot(p, 'T02', 'encabezado-320-sin-clave', { clip: { x: 0, y: 0, width: w, height: Math.ceil(m.header.h) + 2 } });
        if (w === 375 && e === 'sin_clave') r.shotSinClave = await shot(p, 'T02', 'encabezado-375-sin-clave', { clip: { x: 0, y: 0, width: w, height: Math.ceil(m.header.h) + 2 } });
      }
      estado = 'disponible';
      await p.reload(); await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 10000 }); await p.waitForTimeout(800);
      const ns = p.getByRole('button', { name: 'Nueva sesión' });
      r.nsCount = await ns.count();
      r.nsName = await ns.evaluate((b) => b.textContent.trim());
      await ns.click();
      const dlg = p.getByRole('dialog');
      r.dialogo = await dlg.isVisible().catch(() => false);
      await p.waitForTimeout(300);
      r.focoDialogo = await p.evaluate(() => { const a = document.activeElement; return a ? a.tagName.toLowerCase() + ' "' + a.textContent.trim() + '"' : null; });
      await p.keyboard.press('Escape'); await p.waitForTimeout(400);
      r.cerradoEsc = !(await dlg.isVisible().catch(() => false));
      r.focoTrasEsc = await p.evaluate(() => { const a = document.activeElement; return a ? a.tagName.toLowerCase() + ' "' + a.textContent.trim() + '"' : null; });
      await send(p, 'procesa el caso co-industrias-delta QA-LENTO');
      await p.waitForTimeout(1500);
      r.nsDisabledEnTurno = await ns.isDisabled();
      r.nsShotTurno = w === 375 ? await shot(p, 'T02', 'nueva-sesion-deshabilitada-375', { clip: { x: 0, y: 0, width: w, height: 100 } }) : null;
      await p.getByRole('button', { name: 'Detener respuesta' }).click();
      await p.waitForTimeout(1500);
      r.nsEnabledTrasDetener = await ns.isEnabled();
      r.err = p._err;
    }
    R.ancho = {};
    for (const [w, hgt] of [[1280, 720], [800, 900]]) {
      for (const [lbl, base] of [['head', H], ['before', B]]) {
        const p = await newP(base, w, hgt, '10.6.0.' + (n++));
        await login(p);
        await p.waitForTimeout(800);
        const m = await p.evaluate(() => {
          const h = document.querySelector('header'); const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { x: +b.x.toFixed(1), y: +b.y.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }; };
          const btn = [...h.querySelectorAll('button')].find((b) => b.textContent.trim() === 'Nueva sesión');
          const ico = btn?.querySelector('svg');
          return { header: r(h), logo: r(h.querySelector('img')), title: r(h.querySelector('h1')), titleText: h.querySelector('h1')?.textContent, boton: r(btn), botonPadding: btn && getComputedStyle(btn).padding, iconoVisible: ico ? ico.getBoundingClientRect().width > 0 : null, textoBotonVisible: btn ? [...btn.querySelectorAll('span')].map((s) => getComputedStyle(s).display + ':' + s.getBoundingClientRect().width.toFixed(1)) : null, chips: [...h.querySelectorAll('p')].map((x) => r(x)), diseno: document.querySelector('[data-diseno]')?.getAttribute('data-diseno'), docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
        });
        const buf = await p.screenshot({ clip: { x: 0, y: 0, width: w, height: Math.ceil(m.header.h) } });
        await p.screenshot({ path: `${SHOTS}05r-testT02-encabezado-${w}-${lbl}.png`, clip: { x: 0, y: 0, width: w, height: Math.ceil(m.header.h) } });
        R.ancho[w + '-' + lbl] = m;
        if (w === 1280 && lbl === 'head') R._buf1280 = buf.toString('base64');
      }
    }
    {
      const p = await newP(H, 1280, 720, '10.6.0.' + (n++));
      await p.route('http://qa.local/old.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', path: '/Users/alejo/Developer/Alejo/reto-eli-1/.qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/05-testT12-vacio-2x2-1280.png' }));
      await p.route('http://qa.local/new.png', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: Buffer.from(R._buf1280, 'base64') }));
      await p.route('http://qa.local/', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<html><body></body></html>' }));
      await p.goto('http://qa.local/');
      R.pixelDiff1280 = await p.evaluate(async (hh) => {
        const load = (u) => new Promise((ok, ko) => { const i = new Image(); i.onload = () => ok(i); i.onerror = ko; i.src = u; });
        const [a, b] = await Promise.all([load('/old.png'), load('/new.png')]);
        const W = 1280, Hh = Math.min(hh, b.height);
        const get = (img) => { const c = document.createElement('canvas'); c.width = W; c.height = Hh; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, W, Hh).data; };
        const da = get(a), db = get(b);
        let diff = 0, maxd = 0; const cols = new Set();
        for (let i = 0; i < da.length; i += 4) { const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2])); if (d > 8) { diff++; cols.add(Math.floor((i / 4) % W / 40) * 40); } maxd = Math.max(maxd, d); }
        return { compared: `${W}x${Hh}`, oldSize: `${a.width}x${a.height}`, pixelsDiff: diff, maxChannelDelta: maxd, diffColumnsBuckets: [...cols].sort((x, y) => x - y).slice(0, 20) };
      }, Math.ceil(R.ancho['1280-head'].header.h));
    }
    delete R._buf1280;
  } catch (e) { R.fatal = cap(String(e.stack || e), 900); }
  for (const c of ctxs) await c.close().catch(() => {});
  return JSON.stringify(R, null, 1);
}
