/**
 * packer.js - Auto-distribución eficiente de pantallas LED en el lienzo (px reales).
 * Empaquetado de rectángulos (MaxRects). Sin dependencias.
 */
(function (root) {
  "use strict";

  function intersects(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function contains(a, b) {
    return b.x >= a.x && b.y >= a.y && b.x + b.w <= a.x + a.w && b.y + b.h <= a.y + a.h;
  }

  function packOnce(items, binW, binH, heuristic, allowRotate) {
    let free = [{ x: 0, y: 0, w: binW, h: binH }];
    const placed = [];
    for (const it of items) {
      let best = null;
      for (const f of free) {
        const tries = allowRotate && it.w !== it.h ? 2 : 1;
        for (let r = 0; r < tries; r++) {
          const w = r ? it.h : it.w;
          const h = r ? it.w : it.h;
          if (w > f.w || h > f.h) continue;
          let s1, s2;
          if (heuristic === 0) {
            s1 = Math.min(f.w - w, f.h - h);
            s2 = Math.max(f.w - w, f.h - h);
          } else if (heuristic === 1) {
            s1 = f.w * f.h - w * h;
            s2 = Math.min(f.w - w, f.h - h);
          } else {
            s1 = f.y + h;
            s2 = f.x;
          }
          if (!best || s1 < best.s1 || (s1 === best.s1 && s2 < best.s2)) {
            best = { s1, s2, x: f.x, y: f.y, w, h, rot: r === 1 };
          }
        }
      }
      if (!best) return null;
      const p = { id: it.id, x: best.x, y: best.y, w: best.w, h: best.h, rot: best.rot, it };
      placed.push(p);

      const next = [];
      for (const f of free) {
        if (!intersects(f, p)) { next.push(f); continue; }
        if (p.x > f.x) next.push({ x: f.x, y: f.y, w: p.x - f.x, h: f.h });
        if (p.x + p.w < f.x + f.w) next.push({ x: p.x + p.w, y: f.y, w: f.x + f.w - (p.x + p.w), h: f.h });
        if (p.y > f.y) next.push({ x: f.x, y: f.y, w: f.w, h: p.y - f.y });
        if (p.y + p.h < f.y + f.h) next.push({ x: f.x, y: p.y + p.h, w: f.w, h: f.y + f.h - (p.y + p.h) });
      }
      free = next.filter((a, i) => !next.some((b, j) => i !== j && contains(b, a) && (!contains(a, b) || j < i)));
    }
    return placed;
  }

  function bbox(placed) {
    let w = 0, h = 0;
    for (const p of placed) {
      const rw = p.rot ? p.it.h0 : p.it.w0;
      const rh = p.rot ? p.it.w0 : p.it.h0;
      w = Math.max(w, p.x + rw);
      h = Math.max(h, p.y + rh);
    }
    return { w, h };
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function packScreens(screens, opts) {
    opts = Object.assign(
      { maxW: 3840, maxH: 2160, gap: 0, snap: 1, allowRotate: false, fixedWidth: null, timeBudgetMs: 600 },
      opts || {}
    );
    const snap = Math.max(1, Math.floor(opts.snap));
    const gap = Math.max(0, Math.floor(opts.gap));
    const up = (v) => Math.ceil(v / snap) * snap;

    const items = screens.map((s) => ({
      id: s.id, w0: s.w, h0: s.h, w: up(s.w + gap), h: up(s.h + gap)
    }));
    if (items.length === 0) return { ok: false, reason: "No hay pantallas." };

    const limitW = opts.fixedWidth ? opts.fixedWidth : opts.maxW;
    const tooBig = items.filter((i) => {
      const fit = (i.w0 <= limitW && i.h0 <= opts.maxH) ||
                  (opts.allowRotate && i.h0 <= limitW && i.w0 <= opts.maxH);
      return !fit;
    });
    if (tooBig.length) {
      return { ok: false, reason: "No entran en el lienzo máximo: " + tooBig.map((i) => i.id).join(", ") };
    }

    const binH = up(opts.maxH + gap);
    const maxWb = up(limitW + gap);
    const minW = Math.max(...items.map((i) => (opts.allowRotate ? Math.min(i.w, i.h) : i.w)));
    let widths = [];
    if (opts.fixedWidth) widths = [maxWb];
    else {
      const step = Math.max(snap, 64);
      for (let w = minW; w < maxWb; w += step) widths.push(w);
      widths.push(maxWb);
    }

    const sorters = [
      (a, b) => b.w * b.h - a.w * a.h,
      (a, b) => b.h - a.h || b.w - a.w,
      (a, b) => b.w - a.w || b.h - a.h,
      (a, b) => Math.max(b.w, b.h) - Math.max(a.w, a.h),
      (a, b) => b.w + b.h - (a.w + a.h)
    ];
    const orders = sorters.map((f) => items.slice().sort(f));

    const better = (a, b) => !b || a.area < b.area || (a.area === b.area && a.sum < b.sum);
    const evalLayout = (placed) => {
      const b = bbox(placed);
      if (b.w > opts.maxW || b.h > opts.maxH) return null;
      return { placed, bw: b.w, bh: b.h, area: b.w * b.h, sum: b.w + b.h };
    };

    let best = null;
    const perWidth = [];
    for (const W of widths) {
      let bw = null;
      for (const ord of orders) {
        for (let h = 0; h < 3; h++) {
          const placed = packOnce(ord, W, binH, h, opts.allowRotate);
          if (!placed) continue;
          const e = evalLayout(placed);
          if (!e) continue;
          if (better(e, bw)) bw = e;
          if (better(e, best)) best = e;
        }
      }
      if (bw) perWidth.push({ W, area: bw.area });
    }

    if (!best) {
      return {
        ok: false,
        reason: "No entran todas dentro del lienzo máximo con esa separación. " +
                "Probá con menos separación (gap), permitir girar pantallas o un lienzo máximo mayor."
      };
    }

    const t0 = Date.now();
    const rnd = mulberry32(12345);
    const top = perWidth.sort((a, b) => a.area - b.area).slice(0, 4).map((x) => x.W);
    let k = 0;
    while (Date.now() - t0 < opts.timeBudgetMs && items.length > 1) {
      const W = top[k++ % top.length];
      const ord = items.slice();
      for (let i = ord.length - 1; i > 0; i--) {
        const j = Math.floor(rnd() * (i + 1));
        [ord[i], ord[j]] = [ord[j], ord[i]];
      }
      for (let h = 0; h < 3; h++) {
        const placed = packOnce(ord, W, binH, h, opts.allowRotate);
        if (!placed) continue;
        const e = evalLayout(placed);
        if (e && better(e, best)) best = e;
      }
    }

    const placements = best.placed.map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      w: p.rot ? p.it.h0 : p.it.w0,
      h: p.rot ? p.it.w0 : p.it.h0,
      rotated: p.rot
    }));
    const usedPx = items.reduce((s, i) => s + i.w0 * i.h0, 0);
    const cw = up(best.bw) <= opts.maxW ? up(best.bw) : best.bw;
    const ch = up(best.bh) <= opts.maxH ? up(best.bh) : best.bh;
    return {
      ok: true,
      canvas: { width: cw, height: ch },
      placements,
      usedPx,
      efficiency: usedPx / (cw * ch)
    };
  }

  const api = { packScreens };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.LEDPacker = api;
})(typeof window !== "undefined" ? window : this);
