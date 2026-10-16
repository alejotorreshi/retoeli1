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
