  const COLOR_LIB = `
    window.__qa = window.__qa || {};
    __qa.parse = (c) => { const m = String(c).match(/rgba?\\(([^)]+)\\)/); if (!m) return null; const a = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 }; };
    __qa.lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
    __qa.ratio = (a, b) => { const l1 = __qa.lum(a), l2 = __qa.lum(b); return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100; };
    __qa.bg = (el) => { let e = el; while (e) { const c = __qa.parse(getComputedStyle(e).backgroundColor); if (c && c.a >= 0.99) return { color: getComputedStyle(e).backgroundColor, el: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') }; e = e.parentElement; } return { color: 'rgb(255, 255, 255)', el: 'canvas(default)' }; };
    __qa.tok = (n) => { const d = document.createElement('div'); d.style.color = 'var(' + n + ')'; document.body.appendChild(d); const c = getComputedStyle(d).color; d.remove(); return c; };
    __qa.desc = (e) => e.tagName.toLowerCase() + (e.getAttribute('role') ? '[' + e.getAttribute('role') + ']' : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + ' "' + (e.getAttribute('aria-label') || e.innerText || '').trim().slice(0, 40).replace(/\\s+/g, ' ') + '"';
  `;
  const colorLib = (p) => p.evaluate(COLOR_LIB);
