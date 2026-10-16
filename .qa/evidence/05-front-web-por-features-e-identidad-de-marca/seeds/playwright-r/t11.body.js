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
