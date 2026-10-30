// zumbis-arte.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-arte.js).
(function (global) {
  'use strict';
  const D = global.AndreyZumbisDados;
  if (!D) return;
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash(x, y, s) {
    let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul((s || 0) + 1, 1442695041) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  function makeCanvas(w, h) { const c = global.document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function hashCanvas(c) {
    const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
    const u = new Uint32Array(d.buffer, d.byteOffset, d.length >> 2);
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0; i < u.length; i++) { const k = u[i]; h1 = Math.imul(h1 ^ k, 2654435761); h2 = Math.imul(h2 ^ k, 1597334677); }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return ('0000000' + (h2 >>> 0).toString(16)).slice(-8) + ('0000000' + (h1 >>> 0).toString(16)).slice(-8) + ':' + c.width + 'x' + c.height;
  }
  const K_OUT = '#0a0b10';
  const PLAYER_PAL = {
    k: K_OUT, c: '#e8692e', C: '#a8441b', h: '#2a1a12', s: '#e3a679', S: '#b77650', e: '#1a1010',
    y: '#f2c14e', Y: '#c4902c', b: '#3a5688', B: '#26395c'
  };
  const ZPAL = {
    normal:   { k: K_OUT, g: '#86b450', G: '#5f8a36', r: '#ff5a3c', m: '#3a1410', t: '#6f7d8f', T: '#4c5666', p: '#5b4631', P: '#3e3021' },
    corredor: { k: K_OUT, g: '#bccb9e', G: '#909f78', r: '#ff2d2d', m: '#3a1410', t: '#b03a3a', T: '#7c2626', p: '#2d3652', P: '#1e253a' },
    grandao:  { k: K_OUT, g: '#5f8d3a', G: '#456b28', r: '#ffcc33', m: '#2a0e0a', o: '#6a4c94', O: '#47336a', p: '#3b3b46', P: '#26262e' }
  };
  const EYE_GLOW = { normal: '#ff6a48', corredor: '#ff3b30', grandao: '#ffd23c' };
  const PLAYER_TPL = {
    down: [
      '..kkkkkk..',
      '.kcccccck.',
      '.kcCCCCck.',
      '.khsssshk.',
      '.ksessesk.',
      '..kssssk..',
      '.kkyyyykk.',
      'ksyyyyyysk',
      'ksyyYYyysk',
      'kkyyyyyykk',
      '.kbbbbbbk.',
      '.kbbkkbbk.',
      '.kbk..kbk.',
      '.kkk..kkk.'
    ],
    downLegs: [
      ['.kbbkkbbk.', '.kbk..kkk.', '.kkk......'],
      ['.kbbkkbbk.', '.kkk..kbk.', '......kkk.']
    ],
    up: [
      '..kkkkkk..',
      '.kcccccck.',
      '.kcccccck.',
      '.khhhhhhk.',
      '.khhhhhhk.',
      '..kSSSSk..',
      '.kkyyyykk.',
      'ksyyyyyysk',
      'ksyyyyyysk',
      'kkYYYYYYkk',
      '.kbbbbbbk.',
      '.kbbkkbbk.',
      '.kbk..kbk.',
      '.kkk..kkk.'
    ],
    side: [
      '..kkkkk...',
      '.kccccck..',
      '.kcccccCCk',
      '.khhsssk..',
      '.khssesk..',
      '..kssSk...',
      '..kyyyyk..',
      '..kyyyysk.',
      '..kyyYYk..',
      '..kYYYYk..',
      '...kbbk...',
      '...kbbk...',
      '...kbbk...',
      '...kkkk...'
    ],
    sideLegs: [
      ['..kbkkbk..', '.kbk..kbk.', '.kk....kk.'],
      ['...kbbk...', '...kbbk...', '...kkkk...']
    ]
  };
  const ZOMBIE_TPL = {
    down: [
      '...kkkk...',
      '..kggggk..',
      '.kggggggk.',
      '.kgrggrgk.',
      '.kggggggk.',
      '.kggmmggk.',
      'kkttttttkk',
      'ktGttttGtk',
      'kttttTtttk',
      '.kttTtttk.',
      '.kppppppk.',
      '.kppkkppk.',
      '.kpk..kpk.',
      '.kkk..kkk.'
    ],
    downLegs: [
      ['.kppkkppk.', '.kpk..kkk.', '.kkk......'],
      ['.kppkkppk.', '.kkk..kpk.', '......kkk.']
    ],
    side: [
      '..kkkk....',
      '.kggggk...',
      '.kgggggk..',
      '.kggggrk..',
      '.kggggmk..',
      '..kgggk...',
      '.kttttkkkk',
      '.kttttGGGk',
      '.ktTttkkk.',
      '.kttttk...',
      '..kppk....',
      '..kppk....',
      '..kppk....',
      '..kkkk....'
    ],
    sideLegs: [
      ['..kppk....', '.kpkkpk...', '.kk..kk...'],
      ['..kppk....', '..kppk....', '..kkkk....']
    ],
    backSwap: { r: 'g', m: 'g', G: 't' }
  };
  const BRUTE_TPL = {
    down: [
      '....kkkkkk....',
      '...kggggggk...',
      '..kggggggggk..',
      '..kgrggggrgk..',
      '..kggggggggk..',
      '..kggmmmmggk..',
      '.kkkggggggkkk.',
      'kgooooooooooGk',
      'kgooOooooOooGk',
      'kgoooooooooogk',
      'kkooooooooookk',
      '.kooOOOOOOook.',
      '.kooookkooook.',
      '.kpppk..kpppk.',
      '.kpppk..kpppk.',
      '.kpppk..kpppk.',
      '.kkkkk..kkkkk.'
    ],
    downLegs: [
      ['.kpppk..kpppk.', '.kpppk..kkkkk.', '.kkkkk........'],
      ['.kpppk..kpppk.', '.kkkkk..kpppk.', '........kkkkk.']
    ],
    side: [
      '...kkkkkk.....',
      '..kggggggk....',
      '..kgggggggk...',
      '..kggggggrk...',
      '..kgggggmmk...',
      '...kggggggk...',
      '.kkoooookkkkk.',
      'koooooooGGGGk.',
      'koooOooookkkk.',
      'kooooooook....',
      'koooooOook....',
      'kkoooooookk...',
      '.kooooooook...',
      '..kpppkpppk...',
      '..kpppkpppk...',
      '..kpppkpppk...',
      '..kkkkkkkkk...'
    ],
    sideLegs: [
      ['.kpppk.kpppk..', 'kpppk...kpppk.', 'kkkkk...kkkkk.'],
      ['..kpppkpppk...', '..kpppkpppk...', '..kkkkkkkkk...']
    ],
    backSwap: { r: 'g', m: 'g', G: 'o' }
  };
  const AMMO_TPL = [
    '.kkkkkkkk.',
    'kykykykyyk',
    'kaaaaaaaak',
    'kaAAAAAAak',
    'kaaaaaaaak',
    'kkkkkkkkkk'
  ];
  const AMMO_PAL = { k: K_OUT, y: '#ffe27a', a: '#5d6b2e', A: '#c9b458' };
  const COFFEE_TPL = [
    '.kkkkk...',
    'kCCCCCkk.',
    'kwwwwwk.k',
    'kwwwwwkkk',
    '.kwwwk...',
    'kkkkkkkk.',
    '.kWWWWWk.',
    '..kkkkk..'
  ];
  const COFFEE_PAL = { k: K_OUT, C: '#4a2a16', w: '#f1ece0', W: '#cfc8b8' };
  const HEART_TPL = [
    '.kk...kk.',
    'krrk.krrk',
    'krRrkrrrk',
    'krrrrrrrk',
    '.krrrrrk.',
    '..krrrk..',
    '...krk...',
    '....k....'
  ];
  const BULLET_TPL = [
    '..k..',
    '.kyk.',
    'kyYyk',
    'kyyyk',
    'koook',
    'koook',
    'koook',
    'kOOOk',
    'kkkkk'
  ];
  const PUDDLE_TPL = [
    '..ggggg..',
    '.gGgggGg.',
    'gggGggggg',
    '.ggggggg.'
  ];
  const ARMA_PAL = { k: K_OUT, m: '#2b2f38', M: '#9aa3b2', w: '#6b4b30', W: '#9a6a3c', S: '#aab3c0', L: '#e6edf5' };
  const ARMA_TPL = {
    pistolinha: ['..kkkkkkk.', '.kmMMMMMMk', '.kmmmmmmmk', '.kkwwkkkk.', '..kwwk....', '..kkkk....'],
    facao: ['.........kkkkkk.', '...kk..kkLLLLLLk', '.kkwwkkSSSSSSSSk', 'kwwWwwkkkkkkkkk.', '.kwwwwk.........', '..kkkk..........']
  };
  const PEQUI_PAL = { k: K_OUT, y: '#f2c230', Y: '#fff1a8', o: '#c98a1c', g: '#5f8a36' };
  const PEQUI_TPL = {
    1: ['.g..', 'kgk.', 'yYyk', 'yyok', '.kk.'],
    2: ['..g..', '.kgk.', 'kyYyk', 'kyyyk', 'kyyok', '.kkk.'],
    5: ['...gg...', '..kgk...', '.kyYkkk.', 'kyYyyYyk', 'kyyykyok', '.kyokyok', '..kk.kk.'],
    10: ['....gg....', '...kggk...', '.kkyYkkkk.', 'kyYyykyYyk', 'kyyyokyyok', '.kkyYkyokk', 'kyyyokkk..', '.kkkk.....'],
    hud: ['...g...', '..kgk..', '.kyYyk.', 'kyYyyyk', 'kyyyyok', '.kyyok.', '..kkk..']
  };
  const BALINHA_TPL = ['.k.', 'kyk', 'kyk', 'kok', 'kkk'];
  function paint(rows, pal, swap) {
    let w = 0;
    rows.forEach(function (r) { w = Math.max(w, r.length); });
    const c = makeCanvas(w, rows.length);
    const g = c.getContext('2d');
    rows.forEach(function (r, y) {
      for (let x = 0; x < r.length; x++) {
        let ch = r[x];
        if (swap && swap[ch]) ch = swap[ch];
        if (ch === '.' || !pal[ch]) continue;
        g.fillStyle = pal[ch];
        g.fillRect(x, y, 1, 1);
      }
    });
    return c;
  }
  function flipped(src) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.translate(src.width, 0); g.scale(-1, 1); g.drawImage(src, 0, 0);
    return c;
  }
  function silhouette(src, color) {
    const c = makeCanvas(src.width, src.height);
    const g = c.getContext('2d');
    g.drawImage(src, 0, 0);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    return c;
  }
  function withLegs(rows, legs) { return rows.slice(0, rows.length - legs.length).concat(legs); }
  function eyesOf(rows, w, mirror) {
    const out = [];
    rows.forEach(function (r, y) { for (let x = 0; x < r.length; x++) if (r[x] === 'r') out.push([mirror ? w - 1 - x : x, y]); });
    return out;
  }
  function buildSet(tpl, pal) {
    const up = tpl.up || tpl.down;
    const swap = tpl.up ? null : tpl.backSwap;
    const set = { down: [], up: [], right: [], left: [], white: {}, eyes: {} };
    const downRows = [tpl.down, withLegs(tpl.down, tpl.downLegs[0]), withLegs(tpl.down, tpl.downLegs[1])];
    const upRows = [up, withLegs(up, tpl.downLegs[0]), withLegs(up, tpl.downLegs[1])];
    const sideRows = [tpl.side, withLegs(tpl.side, tpl.sideLegs[0]), withLegs(tpl.side, tpl.sideLegs[1])];
    downRows.forEach(function (r) { set.down.push(paint(r, pal)); });
    upRows.forEach(function (r) { set.up.push(paint(r, pal, swap)); });
    sideRows.forEach(function (r) { const s = paint(r, pal); set.right.push(s); set.left.push(flipped(s)); });
    ['down', 'up', 'right', 'left'].forEach(function (d) { set.white[d] = set[d].map(function (s) { return silhouette(s, '#ffffff'); }); });
    const sw = set.right[0].width;
    set.eyes.down = eyesOf(tpl.down, 0, false);
    set.eyes.up = [];
    set.eyes.right = eyesOf(tpl.side, sw, false);
    set.eyes.left = eyesOf(tpl.side, sw, true);
    set.w = set.down[0].width; set.h = set.down[0].height;
    return set;
  }
  function hexRgb(hex) { const h = hex.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function distSeg(px, py, a, b) {
    const vx = b[0] - a[0], vy = b[1] - a[1];
    const t = clamp(((px - a[0]) * vx + (py - a[1]) * vy) / (vx * vx + vy * vy), 0, 1);
    const dx = px - (a[0] + vx * t), dy = py - (a[1] + vy * t);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function paintBackground(F) {
    const VW = D.TELA.w, VH = D.TELA.h, SKY_H = F.ceu, FENCE_Y = F.cerca, PORCH_Y = F.varanda, PATH = F.trilha, GAPS = F.porteiras;
    function inGap(x) { for (let i = 0; i < GAPS.length; i++) if (x >= GAPS[i][0] && x <= GAPS[i][1]) return true; return false; }
    const c = makeCanvas(VW, VH);
    const g = c.getContext('2d');
    const img = g.createImageData(VW, VH);
    const d = img.data;
    const grass = ['#35532f', '#3c5c34', '#2f4a2a', '#43643a', '#3a5732'].map(hexRgb);
    const dirt = ['#7c4027', '#8a4a2d', '#6c3621', '#94532f'].map(hexRgb);
    const skyTop = hexRgb('#070c22'), skyBot = hexRgb('#1d2b54');
    for (let y = 0; y < VH; y++) {
      for (let x = 0; x < VW; x++) {
        let col;
        if (y < SKY_H) {
          const t = y / (SKY_H - 1);
          col = [0, 1, 2].map(function (i) { return Math.round(skyTop[i] + (skyBot[i] - skyTop[i]) * t); });
        } else {
          const n = hash(x, y, 1);
          col = grass[n < 0.45 ? 0 : n < 0.7 ? 1 : n < 0.86 ? 2 : n < 0.95 ? 4 : 3];
          let md = 99;
          for (let i = 0; i < PATH.length - 1; i++) md = Math.min(md, distSeg(x, y, PATH[i], PATH[i + 1]));
          const w = 5.2 + Math.sin(y * 0.21) * 0.9 + hash(x >> 1, y >> 1, 2) * 1.2;
          if (md < w || (md < w + 1.6 && hash(x, y, 3) > 0.55)) {
            const m = hash(x, y, 4);
            col = dirt[m < 0.5 ? 0 : m < 0.78 ? 1 : m < 0.93 ? 2 : 3];
          }
        }
        const o = (y * VW + x) * 4;
        d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    function px(x, y, color) { g.fillStyle = color; g.fillRect(x, y, 1, 1); }
    for (let x = 0; x < VW; x++) {
      const hgt = 2 + Math.round(1.5 + Math.sin(x * 0.045) * 1.5 + Math.sin(x * 0.13 + 1) * 0.8 + hash(x, 0, 5) * 0.8);
      g.fillStyle = '#0d1527';
      g.fillRect(x, SKY_H - hgt, 1, hgt);
    }
    [[20, 3], [106, 5], [118, 7], [236, 4]].forEach(function (b) {
      const bx = b[0], top = b[1];
      g.fillStyle = '#080d1b';
      g.fillRect(bx, top, 1, SKY_H - top);
      const fr = [[-1, 0], [-0.75, -0.6], [-0.35, -0.95], [0.35, -0.95], [0.75, -0.6], [1, 0], [-0.9, 0.35], [0.9, 0.35]];
      fr.forEach(function (f) {
        for (let i = 1; i <= 6; i++) {
          const fx = Math.round(bx + f[0] * i), fy = Math.round(top + f[1] * i * 0.7 + (i * i) * 0.06);
          if (fy >= 0) px(fx, fy, '#080d1b');
        }
      });
    });
    for (let i = 0; i < 150; i++) {
      const x = Math.floor(hash(i, 7, 6) * VW), y = SKY_H + 2 + Math.floor(hash(i, 9, 6) * (PORCH_Y - SKY_H - 4));
      const k = hash(i, 11, 6);
      if (k < 0.72) {
        const cc = k < 0.4 ? '#6f8a46' : k < 0.6 ? '#8a9a4e' : '#56733c';
        px(x, y, cc); px(x - 1, y - 1, cc); px(x + 1, y - 1, cc); px(x, y - 2, cc);
      } else if (k < 0.85) {
        px(x, y, k < 0.8 ? '#e8d07a' : '#d78fb0'); px(x, y + 1, '#4d6b36');
      } else {
        px(x, y, '#5c6168'); px(x + 1, y, '#474b52'); px(x, y - 1, '#71767e');
      }
    }
    for (let x = 0; x < VW; x++) {
      if (inGap(x)) continue;
      px(x, FENCE_Y - 9, '#7a5838'); px(x, FENCE_Y - 8, '#4a3220');
      px(x, FENCE_Y - 5, '#7a5838'); px(x, FENCE_Y - 4, '#4a3220');
      px(x, FENCE_Y - 2, 'rgba(0,0,0,0.25)');
    }
    for (let x = 2; x < VW; x += 14) {
      if (inGap(x) || inGap(x + 2)) continue;
      g.fillStyle = K_OUT; g.fillRect(x - 1, FENCE_Y - 13, 5, 13);
      g.fillStyle = '#5e422b'; g.fillRect(x, FENCE_Y - 12, 3, 12);
      g.fillStyle = '#7f5e3e'; g.fillRect(x, FENCE_Y - 12, 1, 12);
      g.fillStyle = '#9a7650'; g.fillRect(x, FENCE_Y - 12, 3, 1);
    }
    GAPS.forEach(function (gp) {
      [gp[0] - 1, gp[1] - 2].forEach(function (x) {
        g.fillStyle = K_OUT; g.fillRect(x - 1, FENCE_Y - 15, 5, 15);
        g.fillStyle = '#5a3e27'; g.fillRect(x, FENCE_Y - 14, 3, 14);
        g.fillStyle = '#7f5e3e'; g.fillRect(x, FENCE_Y - 14, 1, 14);
      });
    });
    for (let i = 0; i < 14; i++) { px(GAPS[0][0] + 3 + i, FENCE_Y - 1 - Math.round(i * 0.55), '#6b4b30'); px(GAPS[0][0] + 3 + i, FENCE_Y - Math.round(i * 0.55), '#3a2818'); }
    g.fillStyle = '#6b4b30'; g.fillRect(GAPS[1][0] + 5, FENCE_Y + 3, 12, 2);
    g.fillStyle = '#3a2818'; g.fillRect(GAPS[1][0] + 5, FENCE_Y + 5, 12, 1);
    g.fillStyle = '#2a1c12'; g.fillRect(0, PORCH_Y - 1, VW, 1);
    g.fillStyle = '#7a5636'; g.fillRect(0, PORCH_Y, VW, 1);
    for (let y = PORCH_Y + 1; y < VH; y++) {
      g.fillStyle = (y - PORCH_Y) % 4 === 0 ? '#47301f' : '#5e4029';
      g.fillRect(0, y, VW, 1);
    }
    for (let i = 0; i < 40; i++) {
      const x = Math.floor(hash(i, 3, 8) * VW), y = PORCH_Y + 1 + Math.floor(hash(i, 5, 8) * 12);
      if ((y - PORCH_Y) % 4) px(x, y, '#4f3622');
    }
    g.fillStyle = '#7d3326'; g.fillRect(110, PORCH_Y + 4, 20, 7);
    g.fillStyle = '#9a4532'; g.fillRect(111, PORCH_Y + 5, 18, 5);
    [12, 240].forEach(function (x) {
      g.fillStyle = K_OUT; g.fillRect(x - 1, PORCH_Y + 2, 6, 11);
      g.fillStyle = '#6a4a2e'; g.fillRect(x, PORCH_Y + 3, 4, 9);
      g.fillStyle = '#8a6844'; g.fillRect(x, PORCH_Y + 3, 1, 9);
    });
    return c;
  }
  function paintSky(F) {
    const VW = D.TELA.w, VH = D.TELA.h, SKY_H = F.ceu;
    const c = makeCanvas(VW, VH);
    const g = c.getContext('2d');
    for (let i = 0; i < 34; i++) {
      const x = Math.floor(hash(i, 1, 9) * VW), y = Math.floor(hash(i, 2, 9) * (SKY_H - 5));
      g.fillStyle = hash(i, 3, 9) < 0.3 ? '#e8ecff' : '#8f9ac0';
      g.fillRect(x, y, 1, 1);
    }
    const mx = 176, my = 8, mr = 6;
    for (let y = -mr - 2; y <= mr + 2; y++) {
      for (let x = -mr - 2; x <= mr + 2; x++) {
        const dd = Math.sqrt(x * x + y * y);
        if (dd <= mr) {
          const crater = (x === -2 && y === -1) || (x === 2 && y === 2) || (x === 1 && y === -3) || (x === -3 && y === 3);
          g.fillStyle = crater ? '#cfc8ac' : (x + y > 4 ? '#e2dcc0' : '#f6f1da');
          g.fillRect(mx + x, my + y, 1, 1);
        } else if (dd <= mr + 1.6) {
          g.fillStyle = 'rgba(220,226,255,0.22)';
          g.fillRect(mx + x, my + y, 1, 1);
        }
      }
    }
    return c;
  }
  function blobSprite(w, h, inside, color) {
    const c = makeCanvas(w, h);
    const g = c.getContext('2d');
    const mask = [];
    for (let y = 0; y < h; y++) { mask.push([]); for (let x = 0; x < w; x++) mask[y].push(!!inside(x, y)); }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (mask[y][x]) { g.fillStyle = color(x, y); g.fillRect(x, y, 1, 1); continue; }
        const near = (y > 0 && mask[y - 1][x]) || (y < h - 1 && mask[y + 1][x]) || (x > 0 && mask[y][x - 1]) || (x < w - 1 && mask[y][x + 1]);
        if (near) { g.fillStyle = K_OUT; g.fillRect(x, y, 1, 1); }
      }
    }
    return c;
  }
  function paintPequi() {
    const circles = [[17, 11, 10.5], [8, 14, 7], [26, 14, 7], [12, 6, 6], [22, 6, 6]];
    function inCanopy(x, y) { for (let i = 0; i < circles.length; i++) { const c = circles[i]; if ((x - c[0]) * (x - c[0]) + (y - c[1]) * (y - c[1]) <= c[2] * c[2]) return true; } return false; }
    function inTrunk(x, y) {
      if (y < 17 || y > 34) return false;
      const cx = 17 + Math.round(Math.sin(y * 0.35) * 1.2);
      if (x >= cx - 1 && x <= cx + 1) return true;
      if (y >= 31 && x >= cx - 2 && x <= cx + 2) return true;
      return y >= 19 && y <= 22 && x === cx + 2 + (22 - y);
    }
    return blobSprite(35, 36, function (x, y) { return inCanopy(x, y) || inTrunk(x, y); }, function (x, y) {
      if (inCanopy(x, y)) {
        const n = hash(x, y, 21);
        if (n > 0.965 && y > 4) return '#d6c64a';
        const lit = (x - 12) * -0.6 + (y - 6) * -1;
        if (lit > 4 || n > 0.82) return '#4f8a3c';
        if (lit < -9 || n < 0.12) return '#22421f';
        return '#356b2e';
      }
      return hash(x, y, 22) > 0.6 ? '#7b5a3a' : '#5a3f27';
    });
  }
  function paintPoste() {
    const c = makeCanvas(11, 34);
    const g = c.getContext('2d');
    g.fillStyle = K_OUT; g.fillRect(3, 4, 4, 30); g.fillRect(1, 3, 9, 3); g.fillRect(6, 5, 4, 5);
    g.fillStyle = '#5e4630'; g.fillRect(4, 5, 2, 28);
    g.fillStyle = '#7d6044'; g.fillRect(4, 5, 1, 28);
    g.fillStyle = '#6b5238'; g.fillRect(2, 4, 7, 1);
    g.fillStyle = '#c9c3b0'; g.fillRect(7, 6, 2, 2);
    g.fillStyle = '#fff2b8'; g.fillRect(7, 8, 2, 1);
    return c;
  }
  function paintCupim() {
    return blobSprite(15, 16, function (x, y) {
      const cx = 7, top = 2 + Math.abs(x - cx) * 1.3 - (x === 5 || x === 9 ? 2 : 0);
      return y >= top && y <= 14 && x >= 1 && x <= 13 && Math.abs(x - cx) <= 6 - (y < 6 ? 2 : 0);
    }, function (x, y) {
      const n = hash(x, y, 31);
      if (x < 6 && n > 0.3) return '#b06a3e';
      if (n > 0.8) return '#c37a48';
      return n < 0.25 ? '#6e3a22' : '#8f5230';
    });
  }
  function paintToco() {
    return blobSprite(11, 9, function (x, y) { return x >= 1 && x <= 9 && y >= 1 && y <= 7 && !(y === 1 && (x === 1 || x === 9)); }, function (x, y) {
      if (y <= 3) return (x + y) % 3 === 0 ? '#a7865c' : '#c4a274';
      return hash(x, y, 41) > 0.5 ? '#5e4430' : '#4a3424';
    });
  }
  function lightSprite(r, rgb, a0, a1) {
    const c = makeCanvas(r * 2, r * 2);
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(r, r, 0, r, r, r);
    gr.addColorStop(0, 'rgba(' + rgb + ',' + a0 + ')');
    gr.addColorStop(0.5, 'rgba(' + rgb + ',' + a1 + ')');
    gr.addColorStop(1, 'rgba(' + rgb + ',0)');
    g.fillStyle = gr; g.fillRect(0, 0, r * 2, r * 2);
    return c;
  }
  function paintAmbient(F) {
    const VW = D.TELA.w, VH = D.TELA.h, SKY_H = F.ceu, FENCE_Y = F.cerca;
    const amb = makeCanvas(VW, VH);
    const g = amb.getContext('2d');
    const gr = g.createLinearGradient(0, 0, 0, FENCE_Y + 10);
    gr.addColorStop(0, 'rgb(170,178,215)');
    gr.addColorStop(SKY_H / (FENCE_Y + 10), 'rgb(104,114,160)');
    gr.addColorStop(1, 'rgb(40,48,84)');
    g.fillStyle = gr; g.fillRect(0, 0, VW, VH);
    g.globalCompositeOperation = 'lighter';
    const win = lightSprite(50, '255,184,108', 0.85, 0.35);
    g.drawImage(win, 120 - 50, VH + 8 - 50);
    g.drawImage(lightSprite(26, '255,184,108', 0.5, 0.2), 30 - 26, VH + 4 - 26);
    g.drawImage(lightSprite(26, '255,184,108', 0.5, 0.2), 214 - 26, VH + 4 - 26);
    return amb;
  }
  const PINTORES = {
    quintal: function (F) {
      return {
        bg: paintBackground(F), sky: paintSky(F), ambient: paintAmbient(F),
        luzes: F.luzes.map(function (l) { return lightSprite(l.r, l.rgb, l.a0, l.a1); })
      };
    }
  };
  const CENAS = {};
  function cenario(F) {
    if (CENAS[F.id]) return CENAS[F.id];
    const p = PINTORES[F.id];
    if (!p) throw new Error('NOITE DOS ZUMBIS: a fase ' + F.id + ' não tem pintor em zumbis-arte.js.');
    CENAS[F.id] = p(F);
    return CENAS[F.id];
  }
  let ART = null;
  function sprites() {
    if (ART) return ART;
    ART = {
      player: buildSet(PLAYER_TPL, PLAYER_PAL),
      normal: buildSet(ZOMBIE_TPL, ZPAL.normal),
      corredor: buildSet(ZOMBIE_TPL, ZPAL.corredor),
      grandao: buildSet(BRUTE_TPL, ZPAL.grandao),
      ammo: paint(AMMO_TPL, AMMO_PAL),
      coffee: paint(COFFEE_TPL, COFFEE_PAL),
      heart: paint(HEART_TPL, { k: K_OUT, r: '#e3413a', R: '#ff9a8a' }),
      heartOff: paint(HEART_TPL, { k: K_OUT, r: '#2a2f3a', R: '#3a404d' }),
      bullet: paint(BULLET_TPL, { k: K_OUT, y: '#ffe27a', Y: '#fffbe0', o: '#d9a640', O: '#9c7426' }),
      bulletOff: paint(BULLET_TPL, { k: K_OUT, y: '#3a3f4b', Y: '#4a505d', o: '#2a2e38', O: '#20232b' }),
      puddle: paint(PUDDLE_TPL, { g: '#2c4a1c', G: '#3f6a26' }),
      obst: {
        pequi: { spr: paintPequi(), ax: 17, ay: 35 },
        poste: { spr: paintPoste(), ax: 5, ay: 33 },
        cupim: { spr: paintCupim(), ax: 7, ay: 15 },
        toco: { spr: paintToco(), ax: 5, ay: 8 }
      },
      aura: lightSprite(18, '214,210,196', 0.6, 0.28),
      itemGlow: lightSprite(10, '255,236,160', 0.75, 0.3),
      flash: lightSprite(22, '255,226,150', 1, 0.45)
    };
    ART.armas = {};
    Object.keys(ARMA_TPL).forEach(function (k) { ART.armas[k] = paint(ARMA_TPL[k], ARMA_PAL); });
    ART.pequi = {};
    Object.keys(PEQUI_TPL).forEach(function (k) { ART.pequi[k] = paint(PEQUI_TPL[k], PEQUI_PAL); });
    ART.balinha = paint(BALINHA_TPL, { k: K_OUT, y: '#ffe27a', o: '#d9a640' });
    ART.balinhaOff = paint(BALINHA_TPL, { k: K_OUT, y: '#3a3f4b', o: '#2a2e38' });
    const p = ART.player;
    p.amarelo = {};
    ['down', 'up', 'right', 'left'].forEach(function (d) { p.amarelo[d] = p[d].map(function (s) { return silhouette(s, '#ffd36e'); }); });
    return ART;
  }
  global.AndreyZumbisArte = {
    versao: 2,
    sprites: sprites,
    cenario: cenario,
    K_OUT: K_OUT,
    EYE_GLOW: EYE_GLOW,
    hashCanvas: hashCanvas
  };
})(typeof window !== 'undefined' ? window : this);
