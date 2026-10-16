async (page) => {
  const CFG = __CFG__;
  const SHOTS = '/Users/alejo/Developer/Alejo/reto-eli-1/.qa/evidence/05-front-web-por-features-e-identidad-de-marca/screenshots/';
  const san = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
  const ctx = await page.context().browser().newContext({ viewport: { width: 1280, height: 720 }, extraHTTPHeaders: { 'X-Forwarded-For': CFG.xff } });
  const p = await ctx.newPage();
  const log = []; const consoleErr = [];
  let cur = 'login';
  p.on('console', (m) => { if (m.type() === 'error') consoleErr.push(cur + ': ' + san(m.text()).slice(0, 160)); });
  p.on('response', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/api')) log.push(`${cur}| ${r.request().method()} ${u.pathname.replace(/[0-9a-f-]{36}/, '<sid>')} ${r.status()}`); });
  const estado = async () => p.evaluate(() => {
    const btns = [...document.querySelectorAll('main button, header button')].map((b) => (b.getAttribute('aria-label') || b.innerText).trim() + (b.disabled ? ' [disabled]' : ''));
    return {
      header: document.querySelector('header')?.innerText.replace(/\s+/g, ' ').trim(),
      alertas: [...document.querySelectorAll('[role=alert]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean),
      status: [...document.querySelectorAll('[role=status]')].map((e) => e.innerText.replace(/\s+/g, ' ').trim()).filter(Boolean),
      composerDisabled: document.querySelector('textarea')?.disabled ?? null,
      composerHint: [...document.querySelectorAll('main p')].map((e) => e.innerText.trim()).filter((t) => /Enter|pausa|saldo|Uso de la sesión/.test(t)),
      botones: btns,
    };
  });
  const res = { cfg: CFG };
  await p.goto(CFG.base + '/');
  await p.getByRole('textbox', { name: 'Código de acceso' }).fill('codigo-local-de-prueba');
  await p.getByRole('button', { name: 'Entrar al agente' }).click();
  await p.getByRole('textbox', { name: 'Mensaje para el agente' }).waitFor({ timeout: 8000 });
  await p.waitForTimeout(800);
  res.inicio = await estado();
  cur = 'enviar';
  const box = p.getByRole('textbox', { name: 'Mensaje para el agente' });
  await box.fill(CFG.msg);
  await box.press('Enter');
  await p.getByRole('button', { name: 'Detener respuesta' }).waitFor({ state: 'visible', timeout: 3000 }).catch(() => {});
  await p.getByRole('button', { name: 'Detener respuesta' }).waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(1500);
  res.tras = await estado();
  if (CFG.shot) await p.screenshot({ path: `${SHOTS}05-testT01a-${CFG.label}-error-402.png` });
  cur = 'recarga';
  await p.reload();
  await p.waitForTimeout(2500);
  res.recarga = await estado();
  res.log = log; res.consoleErr = consoleErr;
  await ctx.close();
  return JSON.stringify(res);
}
