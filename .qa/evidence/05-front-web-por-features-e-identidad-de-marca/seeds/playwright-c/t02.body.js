    R.vp = {};
    let n = 20;
    for (const [w, hgt] of [[375, 667], [320, 568]]) {
      const p = await newP('http://127.0.0.1:3123', w, hgt, '10.5.0.' + (n++));
      await login(p);
      await p.waitForTimeout(800);
      R.vp[w] = await measureHeader(p);
      R.vp[w].shot = await shot(p, 'T02', 'encabezado-' + w, { clip: { x: 0, y: 0, width: w, height: Math.ceil(R.vp[w].header.h) + 4 } });
      R.vp[w].shotFull = await shot(p, 'T02', 'pantalla-' + w);
      R.vp[w].err = p._err;
    }
