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
