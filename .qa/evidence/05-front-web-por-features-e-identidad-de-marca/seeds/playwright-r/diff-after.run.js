async (page) => {
  const CFG = { base: 'http://127.0.0.1:3133', w: 1280, h: 720, xff: '10.6.0.31', id: 'T01a', label: 'after', shots: false, errores: false };
  const SHOTS = '/Users/alejo/Developer/Alejo/reto-eli-1/.qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/';
  const san = (s) => String(s ?? '').replace(/[\w.+-]+@[\w-]+\.[\w.]+/g, '[email]').replace(/\+?\d[\d .-]{5,}\d/g, (m) => /^\d{4}-\d{2}-\d{2}$/.test(m) ? m : '[num]').replace(/\s+/g, ' ').trim();
  const cap = (s, n = 900) => { const t = san(s); return t.length > n ? t.slice(0, n) + '…' : t; };
  const ctx = await page.context().browser().newContext({ viewport: { width: CFG.w, height: CFG.h }, acceptDownloads: true, extraHTTPHeaders: CFG.xff ? { 'X-Forwarded-For': CFG.xff } : {} });
  const p = await ctx.newPage();
  const t0 = Date.now();
  const log = [];
  const consoleErr = [];
  const posts = [];
  p.on('console', (m) => { if (m.type() === 'error') consoleErr.push(cap(m.text(), 200)); });
  p.on('pageerror', (e) => consoleErr.push('pageerror ' + cap(String(e), 200)));
  p.on('request', (r) => {
    const u = new URL(r.url());
    if (!u.pathname.startsWith('/api')) return;
    if (r.method() === 'POST' && u.pathname === '/api/chat') {
      let b = {}; try { b = JSON.parse(r.postData() || '{}'); } catch {}
      posts.push({ t: Date.now() - t0, step: cur, message: cap(b.message, 80), accion: b.accion ?? null, keys: Object.keys(b).sort().join(',') });
    }
  });
  p.on('response', (r) => {
    const u = new URL(r.url());
    if (!u.pathname.startsWith('/api')) return;
    log.push(`${cur}| ${r.request().method()} ${u.pathname}${u.search ? '?' + u.searchParams.toString().replace(/=[^&]{20,}/g, '=…') : ''} ${r.status()}`);
  });
  let cur = 'boot';
  const res = { cfg: CFG, steps: {} };
  const lay = async () => p.evaluate(() => ({ docOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, bodyOverflow: document.body.scrollWidth - document.body.clientWidth }));
  const focus = async () => p.evaluate(() => { const a = document.activeElement; if (!a) return null; return `${a.tagName.toLowerCase()}${a.getAttribute('role') ? '[' + a.getAttribute('role') + ']' : ''} "${(a.getAttribute('aria-label') || a.textContent || a.id || '').trim().slice(0, 60)}"`; });
  const text = async (loc) => (await loc.count()) ? cap(await loc.first().innerText(), 1500) : null;
  const regions = async () => ({
    main: await text(p.getByRole('region', { name: 'Conversación con el agente' })),
    aside: await text(p.getByRole('complementary', { name: 'Casos de esta sesión' })),
    composer: (await p.getByRole('textbox', { name: 'Mensaje para el agente' }).count()) ? { enabled: await p.getByRole('textbox', { name: 'Mensaje para el agente' }).isEnabled() } : null,
  });
  const hasTabs = async () => (await p.getByRole('tablist').count()) > 0;
  const tab = async (name) => { if (await hasTabs()) { await p.getByRole('tab', { name }).click(); await p.waitForTimeout(250); } };
  const shot = async (slug) => { if (CFG.shots === true || (Array.isArray(CFG.shots) && CFG.shots.includes(slug))) { await p.screenshot({ path: `${SHOTS}05-test${CFG.id}-${CFG.label}-${slug}.png` }); } };
  const step = async (name, fn) => { cur = name; const s = { }; try { await fn(s); } catch (e) { s.error = cap(String(e), 300); } s.layout = await lay().catch(() => null); res.steps[name] = s; };
  const waitTurn = async (sampleFn) => {
    const samples = [];
    const stop = p.getByRole('button', { name: 'Detener respuesta' });
    await stop.waitFor({ state: 'visible', timeout: 4000 }).catch(() => {});
    const start = Date.now();
    let last = '';
    while (Date.now() - start < 40000) {
      const sig = await p.evaluate(() => {
        const main = document.querySelector('main')?.innerText ?? '';
        const stages = [...document.querySelectorAll('[aria-label^="Avance de"] [aria-label]')].map((e) => e.getAttribute('aria-label').replace(/^(\S+): /, '$1=')).join(';');
        const aside = document.querySelector('aside')?.innerText ?? '';
        return JSON.stringify({ correctas: (main.match(/Correcta/g) || []).length, enCurso: (main.match(/En curso/g) || []).length, pensando: main.includes('Pensando'), stages, reinicio: aside.includes('se reinició'), archivos: (aside.match(/Descargar/g) || []).length });
      });
      if (sig !== last) { samples.push(sig); last = sig; }
      if (!(await stop.isVisible().catch(() => false))) break;
      await p.waitForTimeout(120);
    }
    return { ms: Date.now() - start, samples };
  };

  await step('1-acceso', async (s) => {
    await p.goto(CFG.base + '/');
    await p.getByRole('textbox', { name: 'Código de acceso' }).waitFor();
    s.inicial = await text(p.locator('body'));
    s.focoInicial = await focus();
    await p.getByRole('textbox', { name: 'Código de acceso' }).fill('codigo-equivocado-qa');
    await p.getByRole('button', { name: 'Entrar al agente' }).click();
    await p.waitForTimeout(900);
    s.trasError = await text(p.locator('body'));
    s.campo = await p.getByRole('textbox', { name: 'Código de acceso' }).evaluate((el) => ({ invalid: el.getAttribute('aria-invalid'), describedby: (el.getAttribute('aria-describedby') || '').split(' ').map((id) => document.getElementById(id)?.innerText ?? '').join(' | '), value: el.value.length }));
    s.focoTrasError = await focus();
    await shot('acceso-error');
    await p.getByRole('textbox', { name: 'Código de acceso' }).fill('codigo-local-de-prueba');
    await p.getByRole('button', { name: 'Entrar al agente' }).click();
    await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 8000 });
    await p.waitForTimeout(700);
    s.focoTrasEntrar = await focus();
    s.cookies = (await ctx.cookies()).map((c) => `${c.name} httpOnly=${c.httpOnly} sameSite=${c.sameSite}`);
    s.localStorageKeys = await p.evaluate(() => Object.keys(localStorage));
  });

  await step('2-vacio', async (s) => {
    s.regions = await regions();
    s.controles = await p.getByRole('main').getByRole('button').evaluateAll((bs) => bs.map((b) => (b.getAttribute('aria-label') || b.innerText).trim() + (b.disabled ? ' [disabled]' : '')));
    s.header = await text(p.getByRole('banner'));
    await shot('vacio');
    await p.getByRole('button', { name: /^Demo/ }).click();
  });

  await step('3-turno', async (s) => {
    s.turn = await waitTurn();
    await p.waitForTimeout(600);
    s.regions = await regions();
    s.resultado = await text(p.getByRole('article').filter({ hasNotText: 'Confirmación requerida' }));
    s.focoFin = await focus();
    s.tabs = await p.getByRole('tab').evaluateAll((ts) => ts.map((t) => (t.getAttribute('aria-label') || t.innerText).trim() + (t.getAttribute('aria-selected') === 'true' ? ' [sel]' : '')));
    s.liveStatus = await p.evaluate(() => [...document.querySelectorAll('[role=status],[aria-live]')].map((e) => e.innerText.trim()).filter(Boolean).join(' | '));
  });

  await step('4-confirmacion', async (s) => {
    const card = p.getByRole('article', { name: /Confirmación requerida/ });
    s.cardVisible = await card.isVisible().catch(() => false);
    s.card = await text(card);
    s.botonesCard = s.cardVisible ? await card.getByRole('button').evaluateAll((bs) => bs.map((b) => b.innerText.trim())) : null;
    s.postsAntesDelClic = posts.map((x) => `${x.step}:${x.message}${x.accion ? ' accion=' + x.accion : ''}`);
    s.postEnvioAntesDelClic = posts.some((x) => /^S[ií], env[ií]a/.test(x.message) || x.accion);
    s.envioSimuladoAntes = await p.evaluate(async () => (await (await fetch('/api/casos/ec-corp-andina/archivos')).text()).includes('ENVIO-SIMULADO'));
    await shot('confirmacion');
    if (s.cardVisible) {
      await card.getByRole('button', { name: 'Confirmar envío simulado' }).click();
      s.postDelClic = posts.at(-1);
      s.turn = await waitTurn();
      await p.waitForTimeout(800);
      s.regions = await regions();
      s.envioSimuladoDespues = await p.evaluate(async () => (await (await fetch('/api/casos/ec-corp-andina/archivos')).text()).includes('ENVIO-SIMULADO'));
      s.focoFin = await focus();
    }
  });

  await step('5-panel', async (s) => {
    await tab('Casos y archivos');
    s.tabs = await p.getByRole('tab').evaluateAll((ts) => ts.map((t) => (t.getAttribute('aria-label') || t.innerText).trim() + (t.getAttribute('aria-selected') === 'true' ? ' [sel]' : '')));
    s.chatVisibleEnTabCasos = await p.getByRole('textbox', { name: 'Mensaje para el agente' }).isVisible().catch(() => false);
    const aside = p.getByRole('complementary', { name: 'Casos de esta sesión' });
    s.aside = await text(aside);
    s.archivos = await aside.getByRole('link').evaluateAll((ls) => ls.map((l) => l.getAttribute('aria-label') + ' -> ' + l.getAttribute('href')));
    s.botonesVer = await aside.getByRole('button').evaluateAll((bs) => bs.map((b) => (b.getAttribute('aria-label') || b.innerText).trim()));
    const link = aside.getByRole('link', { name: 'Descargar formulario.pdf' });
    if (await link.count()) {
      const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }), link.click()]);
      const st = await dl.createReadStream();
      const chunks = []; for await (const c of st) chunks.push(c);
      const a = Buffer.concat(chunks);
      const href = await link.getAttribute('href');
      const d = await p.evaluate(async ([h, b64]) => { const r = await fetch(h); const u = new Uint8Array(await r.arrayBuffer()); const bin = atob(b64); let eq = bin.length === u.length; for (let i = 0; eq && i < u.length; i++) if (bin.charCodeAt(i) !== u[i]) eq = false; return { status: r.status, type: r.headers.get('content-type'), disposition: r.headers.get('content-disposition'), bytes: u.length, iguales: eq }; }, [href, a.toString('base64')]);
      s.descarga = { nombre: dl.suggestedFilename(), bytes: a.length, direct: d, pdfMagic: a.subarray(0, 5).toString() };
    }
    const ver = aside.getByRole('button', { name: 'Ver formulario.pdf' });
    if (await ver.count()) {
      await ver.click();
      const dlg = p.getByRole('dialog');
      await dlg.waitFor({ timeout: 8000 });
      await p.waitForTimeout(900);
      const dt = await dlg.innerText();
      s.vistaPrevia = { nombre: await dlg.getAttribute('aria-label') || await dlg.evaluate((d) => document.getElementById(d.getAttribute('aria-labelledby') || '')?.innerText ?? ''), texto: cap(dt, 700), enmascarados: (dt.match(/[•*]{3,}/g) || []).length, foco: await focus() };
      await shot('vista-previa');
      await p.keyboard.press('Escape');
      await p.waitForTimeout(400);
      s.vistaPrevia.cerradoConEsc = (await p.getByRole('dialog').count()) === 0 || !(await p.getByRole('dialog').first().isVisible());
      s.vistaPrevia.focoTrasEsc = await focus();
    }
    await tab('Chat');
  });

  await step('6-nueva-sesion', async (s) => {
    s.sessionIdAntes = await p.evaluate(() => Object.entries(localStorage).map(([k, v]) => k + '=' + String(v).slice(0, 8)).join(';'));
    await p.getByRole('button', { name: 'Nueva sesión' }).click();
    const dlg = p.getByRole('dialog');
    await dlg.waitFor({ timeout: 4000 });
    s.dialogo = await text(dlg);
    s.focoDialogo = await focus();
    await shot('dialogo-nueva-sesion');
    await p.keyboard.press('Escape');
    await p.waitForTimeout(400);
    s.cerradoConEsc = !(await p.getByRole('dialog').isVisible().catch(() => false));
    s.focoTrasEsc = await focus();
    await p.getByRole('button', { name: 'Nueva sesión' }).click();
    await p.getByRole('dialog').getByRole('button', { name: 'Empezar sesión nueva' }).click();
    await p.waitForTimeout(1000);
    s.focoTrasConfirmar = await focus();
    s.sessionIdDespues = await p.evaluate(() => Object.entries(localStorage).map(([k, v]) => k + '=' + String(v).slice(0, 8)).join(';'));
    s.regions = await regions();
    const card = p.getByRole('button', { name: 'Procesar caso Corp Andina, Ecuador (ec-corp-andina)' });
    s.via = (await card.count()) ? 'tarjeta' : 'chip';
    if (s.via === 'tarjeta') await card.click(); else await p.getByRole('button', { name: /^Demo/ }).click();
    s.post = posts.at(-1);
    s.turn = await waitTurn();
    await p.waitForTimeout(600);
    s.resultado = await text(p.getByRole('article').filter({ hasNotText: 'Confirmación requerida' }));
  });

  if (CFG.errores) await step('7-error-500', async (s) => {
    const box = p.getByRole('textbox', { name: 'Mensaje para el agente' });
    await box.fill('procesa el caso ec-corp-andina QA-500');
    await box.press('Enter');
    s.turn = await waitTurn();
    await p.waitForTimeout(800);
    s.alertas = await p.getByRole('alert').evaluateAll((as) => as.map((a) => a.innerText.trim()));
    s.ultimo = await p.getByRole('region', { name: 'Conversación con el agente' }).getByRole('listitem').last().innerText().then((t) => cap(t, 400)).catch(() => null);
    s.composer = (await regions()).composer;
    s.botones = await p.getByRole('main').getByRole('button').evaluateAll((bs) => bs.map((b) => (b.getAttribute('aria-label') || b.innerText).trim() + (b.disabled ? ' [disabled]' : '')));
    await shot('error-500');
  });

  res.layoutFinal = await lay();
  res.log = log;
  res.posts = posts.map((x) => `${x.step}: [${x.keys}] ${x.message}${x.accion ? ' accion=' + JSON.stringify(x.accion) : ''}`);
  res.consoleErr = consoleErr;
  res.ms = Date.now() - t0;
  await ctx.close();
  for (const k of Object.keys(res.steps)) for (const kk of Object.keys(res.steps[k])) if (typeof res.steps[k][kk] === 'string') res.steps[k][kk] = san(res.steps[k][kk]);
  const st = res.steps; const pick = (o, ks) => Object.fromEntries(ks.map((k) => [k, o?.[k]]));
  return JSON.stringify({ log: res.log, posts: res.posts, consoleErr: res.consoleErr, layoutFinal: res.layoutFinal, ms: res.ms,
    acceso: pick(st['1-acceso'], ['error', 'focoTrasEntrar', 'campo']),
    vacio: pick(st['2-vacio'], ['error', 'controles']),
    turno: { error: st['3-turno']?.error, ms: st['3-turno']?.turn?.ms, last: st['3-turno']?.turn?.samples?.at(-1), resultado: st['3-turno']?.resultado, tabs: st['3-turno']?.tabs },
    conf: pick(st['4-confirmacion'], ['error', 'cardVisible', 'card', 'botonesCard', 'postEnvioAntesDelClic', 'envioSimuladoAntes', 'postDelClic', 'envioSimuladoDespues']),
    confFinMain: (st['4-confirmacion']?.regions?.main || '').slice(-500),
    panel: { error: st['5-panel']?.error, archivos: st['5-panel']?.archivos, descarga: st['5-panel']?.descarga && { nombre: st['5-panel'].descarga.nombre, iguales: st['5-panel'].descarga.direct?.iguales, magic: st['5-panel'].descarga.pdfMagic }, vp: st['5-panel']?.vistaPrevia && { enm: st['5-panel'].vistaPrevia.enmascarados, esc: st['5-panel'].vistaPrevia.cerradoConEsc } },
    nueva: pick(st['6-nueva-sesion'], ['error', 'focoDialogo', 'cerradoConEsc', 'focoTrasEsc', 'via', 'resultado']) });
}
