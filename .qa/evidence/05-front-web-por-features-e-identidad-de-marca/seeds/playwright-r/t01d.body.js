    R.wr03 = {};
    let n = 20;
    for (const [w, hgt] of [[1280, 720], [375, 667]]) {
      const r = R.wr03[w] = { samples: [] };
      const p = await newP(H, w, hgt, '10.6.0.' + (n++));
      let accesoOk = false, fallos = 0;
      p.on('response', (res) => { if (res.url().includes('/api/acceso') && res.status() === 204) accesoOk = true; });
      await p.route('**/api/config', async (route) => {
        if (accesoOk && fallos < 1) { fallos++; await route.fulfill({ status: 500, contentType: 'application/json', body: '{"mensaje":"qa"}' }); return; }
        await route.continue();
      });
      await login(p).catch((e) => { r.loginErr = cap(String(e), 200); });
      const t0 = Date.now();
      while (Date.now() - t0 < 15000) {
        const z = await zona(p);
        const st = await p.evaluate(() => [...document.querySelectorAll('main [role=status]')].map((e) => e.innerText.trim()).filter(Boolean).join(' | ').slice(0, 90));
        const sig = JSON.stringify({ st: z.scrollTop, max: z.max, cards: z.caseCards, ir: z.irAlFinal, hIn: z.heading?.inViewport, status: st });
        if (r.samples.at(-1)?.sig !== sig) r.samples.push({ t: Date.now() - t0, sig });
        if (z.caseCards === 4 && Date.now() - t0 > 1500) { await p.waitForTimeout(1500); r.final = await zona(p); break; }
        await p.waitForTimeout(150);
      }
      r.fallosInyectados = fallos;
      r.shot = await shot(p, 'T01a', 'vacio-grilla-tardia-' + w);
      r.log = p._log.filter((x) => x.includes('/api/'));
    }
