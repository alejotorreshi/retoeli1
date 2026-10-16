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
