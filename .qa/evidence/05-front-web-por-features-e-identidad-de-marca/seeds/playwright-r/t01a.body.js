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
