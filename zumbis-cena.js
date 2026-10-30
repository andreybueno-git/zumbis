// zumbis-cena.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-cena.js).
(function (global) {
  'use strict';
  function criar(o) {
    const S = o.S, A = o.A, C = o.C, b = o.b, lc = o.lc, lm = o.lm;
    const D = S.D, VW = D.TELA.w, VH = D.TELA.h;
    const K_OUT = o.Arte.K_OUT, EYE_GLOW = o.Arte.EYE_GLOW;
    function walkFrame(moving, walkT) { return moving ? (Math.floor(walkT) % 2 === 0 ? 1 : 2) : 0; }
    function drawWorld(demo) {
      const sx = S.shakeT > 0 && !S.reduced ? Math.round(Math.sin(S.time * 90) * 1.4) : 0;
      const sy = S.shakeT > 0 && !S.reduced ? Math.round(Math.cos(S.time * 77) * 1.2) : 0;
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.globalCompositeOperation = 'source-over';
      b.globalAlpha = 1;
      b.fillStyle = '#05070c'; b.fillRect(0, 0, VW, VH);
      b.setTransform(1, 0, 0, 1, sx, sy);
      b.drawImage(C.bg, 0, 0);
      const zs = demo ? demo.zombies : S.zombies;
      const pl = demo ? demo.player : S.player;
      S.decals.forEach(function (d) {
        b.globalAlpha = d.t > 6 ? Math.max(0, 1 - (d.t - 6) / 3) : 1;
        b.drawImage(A.puddle, Math.round(d.x - 4), Math.round(d.y - 2));
        if (d.big) b.drawImage(A.puddle, Math.round(d.x - 1), Math.round(d.y - 1));
      });
      b.globalAlpha = 1;
      const items = [];
      S.obst.forEach(function (o) { items.push({ y: o.y, k: 'o', o: o }); });
      S.pickups.forEach(function (p) { if (!demo) items.push({ y: p.y, k: 'p', o: p }); });
      zs.forEach(function (z) { items.push({ y: z.y, k: 'z', o: z }); });
      items.push({ y: pl.y + 0.1, k: 'j', o: pl });
      items.sort(function (a, c) { return a.y - c.y; });
      items.forEach(function (it) {
        if (it.k === 'o') drawObstacle(it.o, pl);
        else if (it.k === 'p') drawPickup(it.o);
        else if (it.k === 'z') drawZombie(it.o);
        else drawPlayer(it.o, !!demo);
      });
      b.globalAlpha = 1;
      S.parts.forEach(function (q) { b.fillStyle = q.c; b.fillRect(Math.round(q.x), Math.round(q.y), 1, 1); });
      buildLight(pl, demo, sx, sy);
      b.setTransform(1, 0, 0, 1, 0, 0);
      b.globalCompositeOperation = 'multiply';
      b.drawImage(lm, 0, 0);
      b.globalCompositeOperation = 'source-over';
      b.drawImage(C.sky, 0, 0);
      b.setTransform(1, 0, 0, 1, sx, sy);
      const flick = lampFlicker();
      S.F.luzes.forEach(function (l) {
        if (!l.lampada) return;
        b.fillStyle = 'rgba(255,240,170,' + (0.75 + 0.25 * (l.pisca ? flick : 1)) + ')';
        b.fillRect(l.lampada.x, l.lampada.y, l.lampada.w, l.lampada.h);
      });
      zs.forEach(function (z) { drawZombieGlow(z); });
      S.pickups.forEach(function (p) {
        if (demo || !pickupVisible(p)) return;
        if (p.tipo === 'pequi') { b.globalAlpha = 0.55; drawPickup(p, true); b.globalAlpha = 1; return; }
        const tw = S.reduced ? 0 : Math.floor(S.time * 3 + p.x) % 4;
        b.fillStyle = '#fffbe0';
        b.fillRect(Math.round(p.x) + (tw === 0 ? -3 : 2), Math.round(p.y) - 8, 1, 1);
      });
      S.bullets.forEach(function (bl) {
        const vel = bl.vel;
        const x = Math.round(bl.x), y = Math.round(bl.y);
        const tx = Math.round(bl.x - bl.vx / vel * 3), ty = Math.round(bl.y - bl.vy / vel * 3);
        b.fillStyle = '#ffcf5a'; b.fillRect(tx, ty, 1, 1);
        b.fillStyle = '#ffe9a0'; b.fillRect(Math.round((x + tx) / 2), Math.round((y + ty) / 2), 1, 1);
        b.fillStyle = '#fffbe8'; b.fillRect(x, y, 2, 2);
      });
      if (!demo) brilhosS1(pl);
      if (!demo) {
        const tip = gunTip(pl);
        b.fillStyle = '#fff6c8'; b.fillRect(tip.x, tip.y, 1, 1);
        if (S.muzzleT > 0 && !S.reduced) {
          b.fillStyle = '#fff6c8';
          b.fillRect(tip.x - 1, tip.y, 3, 1); b.fillRect(tip.x, tip.y - 1, 1, 3);
        }
        if (S.reloadT > 0) {
          const bx = Math.round(pl.x - 7), by = Math.round(pl.y - 19);
          b.fillStyle = K_OUT; b.fillRect(bx - 1, by - 1, 16, 4);
          b.fillStyle = '#2a2f3a'; b.fillRect(bx, by, 14, 2);
          b.fillStyle = '#ffd36e'; b.fillRect(bx, by, Math.round(14 * (1 - S.reloadT / S.arma.recarga)), 2);
        }
      }
      b.setTransform(1, 0, 0, 1, 0, 0);
    }
    function lampFlicker() {
      if (S.reduced) return 1;
      const t = S.lampT;
      const dip = (Math.sin(t * 0.7) > 0.985) ? 0.25 : 0;
      return 0.9 + Math.sin(t * 2.1) * 0.05 + Math.sin(t * 5.3) * 0.03 - dip;
    }
    function buildLight(pl, demo, sx, sy) {
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.globalCompositeOperation = 'source-over';
      lc.globalAlpha = 1;
      lc.drawImage(C.ambient, 0, 0);
      lc.globalCompositeOperation = 'lighter';
      lc.setTransform(1, 0, 0, 1, sx, sy);
      const flick = lampFlicker();
      S.F.luzes.forEach(function (l, i) {
        lc.globalAlpha = l.pisca ? flick : 1;
        lc.drawImage(C.luzes[i], l.x - l.r, l.y - l.r);
      });
      lc.globalAlpha = 1;
      lc.drawImage(A.aura, Math.round(pl.x) - 18, Math.round(pl.y - 6) - 18);
      const ang = pl.aimVis, cx = pl.x + Math.cos(ang) * 3, cy = pl.y - 7 + Math.sin(ang) * 2;
      coneLight(cx, cy, ang, 0.64, 92, 'rgba(255,240,205,', 0.32);
      coneLight(cx, cy, ang, 0.42, 118, 'rgba(255,246,218,', 0.95);
      if (!demo) {
        if (S.muzzleT > 0) {
          const tip = gunTip(pl);
          lc.globalAlpha = S.reduced ? 0.35 : 0.85;
          lc.drawImage(A.flash, tip.x - 22, tip.y - 22);
          lc.globalAlpha = 1;
        }
        S.pickups.forEach(function (p) { if (p.tipo !== 'pequi' && pickupVisible(p)) lc.drawImage(A.itemGlow, Math.round(p.x) - 10, Math.round(p.y - 3) - 10); });
      }
      lc.setTransform(1, 0, 0, 1, 0, 0);
      lc.globalCompositeOperation = 'source-over';
    }
    function coneLight(cx, cy, ang, half, R, rgba, a) {
      const gr = lc.createRadialGradient(cx, cy, 2, cx, cy, R);
      gr.addColorStop(0, rgba + a + ')');
      gr.addColorStop(0.6, rgba + (a * 0.6) + ')');
      gr.addColorStop(1, rgba + '0)');
      lc.fillStyle = gr;
      lc.beginPath();
      lc.moveTo(cx, cy);
      lc.arc(cx, cy, R, ang - half, ang + half);
      lc.closePath();
      lc.fill();
    }
    function gunTip(pl) {
      const a = pl.aimVis;
      return { x: Math.round(pl.x + Math.cos(a) * 7), y: Math.round(pl.y - 7 + Math.sin(a) * 6) };
    }
    function dirOf(a) {
      const deg = a * 180 / Math.PI;
      if (deg > -45 && deg <= 45) return 'right';
      if (deg > 45 && deg <= 135) return 'down';
      if (deg > -135 && deg <= -45) return 'up';
      return 'left';
    }
    function drawGun(pl) {
      const a = pl.aimVis, hx = pl.x, hy = pl.y - 7;
      for (let i = 2; i <= 6; i++) {
        const x = Math.round(hx + Math.cos(a) * i), y = Math.round(hy + Math.sin(a) * i * 0.86);
        b.fillStyle = i >= 5 ? '#9aa3b2' : '#2b2f38';
        b.fillRect(x, y, 1, 1);
        if (i <= 4) { b.fillStyle = K_OUT; b.fillRect(x, y + 1, 1, 1); }
      }
    }
    function drawPlayer(pl, demo) {
      const dir = dirOf(pl.aimVis);
      const set = A.player;
      const fi = walkFrame(pl.moving, pl.walkT);
      const spr = set[dir][fi];
      const x = Math.round(pl.x - spr.width / 2), y = Math.round(pl.y - spr.height + 1);
      b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(x + 2, Math.round(pl.y), spr.width - 4, 1);
      let alpha = 1;
      if (!demo && pl.invuln > 0) alpha = S.reduced ? 0.6 : (Math.floor(pl.invuln * 5) % 2 ? 0.35 : 1);
      if (!demo && S.sf && pl.invuln > 0 && S.stats.casca > 0) {
        const am = set.amarelo[dir][fi];
        b.drawImage(am, x - 1, y); b.drawImage(am, x + 1, y); b.drawImage(am, x, y - 1); b.drawImage(am, x, y + 1);
      }
      b.globalAlpha = alpha;
      const mao = !demo && S.arma.tipo === 'corpo' ? drawFacao : drawGun;
      if (dir === 'up') mao(pl);
      b.drawImage(spr, x, y);
      if (dir !== 'up') mao(pl);
      b.globalAlpha = 1;
    }
    function anguloFacao(pl) {
      const g = S.golpe;
      if (!g) return pl.aimVis;
      const meio = S.arma.arco * Math.PI / 360;
      return g.ang - meio + 2 * meio * Math.min(1, g.t / S.arma.anim);
    }
    function drawFacao(pl) {
      const a = anguloFacao(pl), hx = pl.x, hy = pl.y - 7;
      for (let i = 2; i <= 10; i++) {
        const x = Math.round(hx + Math.cos(a) * i), y = Math.round(hy + Math.sin(a) * i * 0.86);
        b.fillStyle = i <= 3 ? '#6b4b30' : i >= 9 ? '#e6edf5' : '#aab3c0';
        b.fillRect(x, y, 1, 1);
        if (i <= 3) { b.fillStyle = K_OUT; b.fillRect(x, y + 1, 1, 1); }
      }
    }
    function brilhosS1(pl) {
      const g = S.golpe;
      if (g && S.arma.tipo === 'corpo') {
        const meio = S.arma.arco * Math.PI / 360, r = S.arma.alcance + 3, cx = pl.x, cy = pl.y - 5;
        const a0 = g.ang - meio, a1 = a0 + 2 * meio * Math.min(1, g.t / S.arma.anim), passo = 1.6 / r;
        for (let a = a0; a <= a1; a += passo) {
          const f = (a - a0) / Math.max(0.001, a1 - a0);
          b.globalAlpha = 0.35 + 0.6 * f;
          b.fillStyle = f > 0.7 ? '#e6edf5' : '#aab3c0';
          b.fillRect(Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.86), 1, 1);
        }
        b.globalAlpha = 1;
      }
      if (S.sf && S.imaT > 0 && S.stats.ima > 0) {
        const r = S.stats.coleta;
        b.globalAlpha = Math.min(1, S.imaT / 0.6) * 0.8;
        b.fillStyle = '#ffd84a';
        for (let i = 0; i < 48; i += 2) { const a = i / 48 * Math.PI * 2; b.fillRect(Math.round(pl.x + Math.cos(a) * r), Math.round(pl.y - 4 + Math.sin(a) * r), 1, 1); }
        b.globalAlpha = 1;
      }
      const z = S.alvo;
      if (z && S.entrada.touchMode && !z.dying) {
        const cy = z.y - D.INIMIGOS[z.tipo].peito;
        b.fillStyle = '#ffd36e';
        for (let i = 0; i < 40; i++) { if (i % 5 === 4) continue; const a = i / 40 * Math.PI * 2; b.fillRect(Math.round(z.x + Math.cos(a) * 10), Math.round(cy + Math.sin(a) * 10), 1, 1); }
      }
    }
    function zombieFrame(z) {
      const set = A[z.tipo];
      const fi = z.emerge < 1 ? 0 : (Math.floor(z.walkT) % 2 ? 1 : 2);
      return { set: set, spr: set[z.dir][fi], white: set.white[z.dir][fi] };
    }
    function zombiePos(z, spr) {
      const bob = D.INIMIGOS[z.tipo].grande && !S.reduced && z.emerge >= 1 ? (Math.floor(z.walkT) % 2) : 0;
      return { x: Math.round(z.x - spr.width / 2), y: Math.round(z.y - spr.height + 1 - bob) };
    }
    function drawZombie(z) {
      const f = zombieFrame(z), spr = f.spr, p = zombiePos(z, spr);
      if (z.dying) {
        const k = Math.min(1, z.dying / 0.5);
        const hv = Math.max(0, Math.round(spr.height * (1 - k)));
        if (hv > 0) b.drawImage(spr, 0, 0, spr.width, hv, p.x, p.y + (spr.height - hv), spr.width, hv);
        return;
      }
      b.globalAlpha = z.emerge < 1 ? Math.max(0.1, z.emerge) : 1;
      b.fillStyle = 'rgba(0,0,0,0.35)'; b.fillRect(p.x + 2, Math.round(z.y), spr.width - 4, 1);
      b.drawImage(spr, p.x, p.y);
      b.globalAlpha = 1;
    }
    function drawZombieGlow(z) {
      if (z.dying) return;
      const f = zombieFrame(z), p = zombiePos(z, f.spr);
      b.globalAlpha = 0.2 * (z.emerge < 1 ? z.emerge : 1);
      b.drawImage(f.spr, p.x, p.y);
      b.globalAlpha = 1;
      if (z.flash > 0) {
        b.globalAlpha = S.reduced ? 0.45 : 0.85;
        b.drawImage(f.white, p.x, p.y);
        b.globalAlpha = 1;
      }
      if (z.emerge < 0.5) return;
      b.fillStyle = EYE_GLOW[z.tipo];
      const eyes = f.set.eyes[z.dir];
      for (let i = 0; i < eyes.length; i++) b.fillRect(p.x + eyes[i][0], p.y + eyes[i][1], 1, 1);
    }
    function pickupVisible(p) {
      const left = p.life - p.t;
      if (left > 3) return true;
      return S.reduced ? true : Math.floor(left * 5) % 2 === 0;
    }
    function drawPickup(p, brilho) {
      if (!pickupVisible(p)) return;
      if (p.tipo === 'pequi') {
        const sp = A.pequi[p.valor] || A.pequi[1];
        const bq = S.reduced || p.puxado ? 0 : (Math.floor(S.time * 2 + p.x * 0.5) % 2);
        const qx = Math.round(p.x - sp.width / 2), qy = Math.round(p.y - sp.height + 1 - bq);
        if (!brilho) { b.fillStyle = 'rgba(0,0,0,0.4)'; b.fillRect(qx + 1, Math.round(p.y) + 1, sp.width - 2, 1); }
        b.drawImage(sp, qx, qy);
        return;
      }
      const spr = p.tipo === 'municao' ? A.ammo : A.coffee;
      const bob = S.reduced ? 0 : (Math.floor(S.time * 2 + p.x) % 2);
      const x = Math.round(p.x - spr.width / 2), y = Math.round(p.y - spr.height + 1 - bob);
      b.fillStyle = 'rgba(0,0,0,0.4)'; b.fillRect(x + 1, Math.round(p.y) + 1, spr.width - 2, 1);
      b.drawImage(spr, x, y);
      if (p.tipo === 'cafe' && !S.reduced) {
        const ph = Math.floor(S.time * 3) % 2;
        b.fillStyle = 'rgba(240,240,240,0.7)';
        b.fillRect(x + 2 + ph, y - 2, 1, 1); b.fillRect(x + 4 - ph, y - 3, 1, 1);
      }
    }
    function drawObstacle(o, pl) {
      const s = A.obst[o.tipo] || A.obst.toco;
      const x = o.x - s.ax, y = o.y - s.ay;
      if (o.copa && pl.y < o.y && pl.y > o.y - o.copa.alto && Math.abs(pl.x - o.x) < o.copa.meia) b.globalAlpha = 0.55;
      b.drawImage(s.spr, x, y);
      b.globalAlpha = 1;
    }
    const DEMO = {
      player: { x: 128, y: 112, aimVis: -1.0, moving: false, walkT: 0, invuln: 0 },
      zombies: [
        { tipo: 'normal', x: 168, y: 64, dir: 'down', walkT: 0, emerge: 1, dying: 0, flash: 0 },
        { tipo: 'corredor', x: 44, y: 58, dir: 'right', walkT: 1, emerge: 1, dying: 0, flash: 0 },
        { tipo: 'grandao', x: 228, y: 128, dir: 'left', walkT: 0, emerge: 1, dying: 0, flash: 0 },
        { tipo: 'normal', x: 56, y: 140, dir: 'right', walkT: 1, emerge: 1, dying: 0, flash: 0 }
      ]
    };
    const ctx = o.ctx, N = o.N, BTN = o.BTN;
    const E = S.entrada, mouse = E.mouse, stick = E.stick, fireTouch = E.fireTouch;
    let L = null;
    function fmt(n) { return String(Math.max(0, Math.floor(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
    function clamp(v, a, c) { return v < a ? a : v > c ? c : v; }
    function noTitulo() { return S.state === 'title' || (S.state === 'shop' && S.lojaVolta === 'title'); }
    function telas(L0) {
      L = L0;
      const cob = o.ui ? o.ui() : null;
      if (S.state === 'shop') { if (!noTitulo()) drawHud(); if (cob === 'bancada') veil('rgba(3,4,10,0.82)'); else drawLoja(); return; }
      if (noTitulo()) { if (cob === 'titulo') drawTitleUI(); else drawTitle(); return; }
      drawHud();
      if (S.state === 'over') drawOver(cob === 'fim');
      else if (S.paused) { if (cob === 'pausa') veil('rgba(3,4,10,0.62)'); else drawPause(); }
    }
    function font(px) { return Math.round(px) + 'px "VT323", "Courier New", monospace'; }
    function gx(x) { return L.ox + x * L.K; }
    function gy(y) { return L.oy + y * L.K; }
    function text(str, x, y, size, color, align, maxW, alpha) {
      ctx.font = font(size * L.K);
      ctx.textAlign = align || 'left';
      ctx.textBaseline = 'top';
      ctx.lineJoin = 'round';
      ctx.globalAlpha = alpha == null ? 1 : alpha;
      ctx.lineWidth = Math.max(2, Math.round(L.K * 1.1));
      ctx.strokeStyle = '#05060a';
      const mw = maxW ? maxW * L.K : undefined;
      if (mw) { ctx.strokeText(str, gx(x), gy(y), mw); ctx.fillStyle = color; ctx.fillText(str, gx(x), gy(y), mw); }
      else { ctx.strokeText(str, gx(x), gy(y)); ctx.fillStyle = color; ctx.fillText(str, gx(x), gy(y)); }
      ctx.globalAlpha = 1;
    }
    function icon(spr, x, y) { ctx.drawImage(spr, gx(x), gy(y), spr.width * L.K, spr.height * L.K); }
    function veil(rgba) { ctx.fillStyle = rgba; ctx.fillRect(L.ox, L.oy, L.gw, L.gh); }
    function drawHud() {
      if (S.sf) drawHudSemFim();
      else {
        for (let i = 0; i < D.JOGADOR.vidas; i++) icon(i < S.hearts ? A.heart : A.heartOff, 3 + i * 10, 3);
        const ax = 35, pente = S.arma.pente;
        for (let i = 0; i < pente; i++) icon(i < S.mag && S.reloadT <= 0 ? A.bullet : A.bulletOff, ax + i * 5, 3);
        const resColor = S.mag + S.reserve === 0 ? '#ff7a6a' : '#f4ead0';
        text(S.reloadT > 0 ? '...' : String(S.reserve), ax + pente * 5 + 2, 1, 12, resColor, 'left');
        text('ONDA ' + Math.max(1, S.wave), 128, 1, 13, '#cfe9a8', 'center');
        text(fmt(S.score), 253, 1, 13, '#f4ead0', 'right');
      }
      S.floats.forEach(function (f) {
        const k = f.t / f.life;
        text(f.text, f.x, f.y - k * 10, f.size, f.color, 'center', null, k > 0.7 ? (1 - k) / 0.3 : 1);
      });
      if (S.banner) {
        const k = S.banner.t / S.banner.life;
        const a = k < 0.12 ? k / 0.12 : k > 0.8 ? (1 - k) / 0.2 : 1;
        text(S.banner.title, 128, 52, 22, S.banner.color, 'center', 240, a);
        if (S.banner.sub) text(S.banner.sub, 128, 72, 11, '#f4ead0', 'center', 240, a);
      } else if (S.breakT > 0) {
        text('PRÓXIMA ONDA EM ' + Math.ceil(S.breakT), 128, 60, 12, '#cfe9a8', 'center', 240, 0.95);
      }
      if (S.hurtFx > 0) {
        const a = (S.hurtFx / 0.6) * (S.reduced ? 0.22 : 0.42);
        const g = ctx.createRadialGradient(gx(128), gy(80), L.K * 40, gx(128), gy(80), L.K * 150);
        g.addColorStop(0, 'rgba(160,0,0,0)');
        g.addColorStop(1, 'rgba(160,0,0,' + a + ')');
        ctx.fillStyle = g; ctx.fillRect(L.ox, L.oy, L.gw, L.gh);
      }
      if (E.touchMode) drawTouch();
      else if (S.aimMode === 'mouse' && mouse.inside) drawCrosshair();
    }
    function drawHudSemFim() {
      const u = L.K, arma = S.arma;
      for (let i = 0; i < S.stats.vidas; i++) icon(i < S.hearts ? A.heart : A.heartOff, 3 + i * 10, 3);
      if (S.colete > 0) text('COLETE', 3, 11, 8, '#c4a274', 'left');
      ctx.fillStyle = 'rgba(5,6,10,0.55)'; ctx.fillRect(gx(66), gy(2), 20 * u, 10 * u);
      const spr = A.armas[arma.id];
      if (spr) icon(spr, 66 + Math.floor((20 - spr.width) / 2), 2 + Math.floor((10 - spr.height) / 2));
      text(String(arma.tecla), 66, 0, 8, '#cfe9a8', 'left');
      if (!arma.municao) text('∞', 89, 0, 13, '#f4ead0', 'left');
      else if (arma.pente <= 6) { for (let i = 0; i < arma.pente; i++) icon(i < S.mag && S.reloadT <= 0 ? A.bullet : A.bulletOff, 88 + i * 5, 3); }
      else {
        const k = S.reloadT > 0 ? 1 - S.reloadT / arma.recarga : S.mag / arma.pente;
        ctx.fillStyle = K_OUT; ctx.fillRect(gx(87), gy(4), 28 * u, 6 * u);
        ctx.fillStyle = '#2a2f3a'; ctx.fillRect(gx(88), gy(5), 26 * u, 4 * u);
        ctx.fillStyle = S.reloadT > 0 ? '#9aa3b2' : '#ffe27a'; ctx.fillRect(gx(88), gy(5), Math.round(26 * clamp(k, 0, 1)) * u, 4 * u);
      }
      if (arma.municao) {
        const zero = S.reserve <= 0;
        icon(zero ? A.balinhaOff : A.balinha, 122, 4);
        if (zero) { ctx.fillStyle = '#ff7a6a'; for (let i = 0; i < 5; i++) ctx.fillRect(gx(121 + i), gy(4 + i), u, u); }
        text(S.reloadT > 0 ? '...' : String(S.reserve), 127, 1, 12, zero ? '#ff7a6a' : '#f4ead0', 'left');
      }
      text('ONDA ' + Math.max(1, S.wave), 176, 1, 12, '#cfe9a8', 'center');
      const pq = fmt(o.saldo());
      ctx.font = font(12 * u);
      const w = ctx.measureText(pq).width / u;
      text(pq, 253, 1, 12, '#ffd84a', 'right');
      icon(A.pequi.hud, Math.floor(253 - w - 9), 3);
      if (S.linhaArmasT > 0 && !E.touchMode) {
        D.BANCADA.armas.forEach(function (vg, i) {
          const tem = !!S.armas[vg.id], x = 3 + i * 10;
          ctx.fillStyle = !tem ? '#20242c' : N.temMunicao(S, vg.id) ? '#c9c1ad' : '#ff7a6a';
          ctx.fillRect(gx(x), gy(19), 9 * u, 8 * u);
          if (arma.id === vg.id) { ctx.strokeStyle = '#ffd36e'; ctx.lineWidth = Math.max(1, u); ctx.strokeRect(gx(x), gy(19), 9 * u, 8 * u); }
          text(String(i + 1), x + 4.5, 18.5, 8, tem ? '#2b2f38' : '#4b505c', 'center');
        });
      }
      if (S.aviso) text(S.aviso.texto, 128, 36, 10, '#ffe9a0', 'center', 240, S.aviso.t > S.aviso.life - 0.5 ? (S.aviso.life - S.aviso.t) / 0.5 : 1);
      if (S.state === 'playing' && S.breakT > 0) {
        const r = BTN.bancada, pronto = o.bancadaPronta();
        ctx.fillStyle = pronto ? 'rgba(255,211,110,0.25)' : 'rgba(255,211,110,0.1)';
        ctx.fillRect(gx(r.x), gy(r.y), r.w * u, r.h * u);
        ctx.strokeStyle = 'rgba(255,226,150,0.8)'; ctx.lineWidth = Math.max(1, u * 0.8); ctx.strokeRect(gx(r.x), gy(r.y), r.w * u, r.h * u);
        text(E.touchMode ? 'BANCADA' : 'B  BANCADA', r.x + r.w / 2, r.y + 1, 10, '#ffe9a0', 'center', r.w - 2, pronto ? 1 : 0.5);
      }
    }
    function drawCrosshair() {
      const x = Math.round(gx(mouse.x)), y = Math.round(gy(mouse.y)), u = Math.max(1, Math.round(L.K));
      const arms = [[-7, 0, 4, 1], [3, 0, 4, 1], [0, -7, 1, 4], [0, 3, 1, 4]];
      ctx.fillStyle = K_OUT;
      arms.forEach(function (a) { ctx.fillRect(x + (a[0] - 1) * u - (u >> 1), y + (a[1] - 1) * u - (u >> 1), (a[2] + 2) * u, (a[3] + 2) * u); });
      ctx.fillRect(x - u - (u >> 1), y - u - (u >> 1), 3 * u, 3 * u);
      ctx.fillStyle = '#ffe9a0';
      arms.forEach(function (a) { ctx.fillRect(x + a[0] * u - (u >> 1), y + a[1] * u - (u >> 1), a[2] * u, a[3] * u); });
      ctx.fillStyle = '#ff7a5a';
      ctx.fillRect(x - (u >> 1), y - (u >> 1), u, u);
    }
    function ring(x, y, r, fill, stroke, w) {
      ctx.beginPath(); ctx.arc(gx(x), gy(y), r * L.K, 0, Math.PI * 2);
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.lineWidth = Math.max(1, w * L.K); ctx.strokeStyle = stroke; ctx.stroke(); }
    }
    function drawTouch() {
      if (stick.id !== null) {
        ring(stick.bx, stick.by, 18, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.35)', 1);
        ring(stick.kx, stick.ky, 8, 'rgba(255,255,255,0.38)', 'rgba(5,6,10,0.6)', 0.7);
      } else {
        ring(36, 124, 18, 'rgba(255,255,255,0.05)', 'rgba(255,255,255,0.22)', 1);
        ring(36, 124, 7, 'rgba(255,255,255,0.18)', null, 0);
      }
      const down = fireTouch.id !== null;
      ring(BTN.fire.x, BTN.fire.y, BTN.fire.r, down ? 'rgba(255,211,110,0.4)' : 'rgba(255,211,110,0.18)', 'rgba(255,226,150,0.7)', 1);
      const fx = gx(BTN.fire.x), fy = gy(BTN.fire.y), u = L.K;
      ctx.strokeStyle = '#fff2c0'; ctx.lineWidth = Math.max(1, u);
      ctx.beginPath(); ctx.arc(fx, fy, 6 * u, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(fx - 10 * u, fy); ctx.lineTo(fx - 3 * u, fy); ctx.moveTo(fx + 3 * u, fy); ctx.lineTo(fx + 10 * u, fy);
      ctx.moveTo(fx, fy - 10 * u); ctx.lineTo(fx, fy - 3 * u); ctx.moveTo(fx, fy + 3 * u); ctx.lineTo(fx, fy + 10 * u); ctx.stroke();
      const semRecarga = !S.arma.municao;
      ring(BTN.reload.x, BTN.reload.y, BTN.reload.r, semRecarga ? 'rgba(120,120,120,0.12)' : 'rgba(255,255,255,0.14)', semRecarga ? 'rgba(160,160,160,0.35)' : 'rgba(255,255,255,0.5)', 0.8);
      text('R', BTN.reload.x, BTN.reload.y - 6.5, 12, semRecarga ? '#7a7f8a' : '#f4ead0', 'center');
      if (S.sf && S.slots.length > 1) {
        const segura = E.armaToque !== null;
        ring(BTN.arma.x, BTN.arma.y, BTN.arma.r, segura ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.5)', 0.8);
        text('ARMA', BTN.arma.x, BTN.arma.y - 4, 8, '#f4ead0', 'center');
        const outra = S.armaAnterior && S.armas[S.armaAnterior] ? A.armas[S.armaAnterior] : null;
        if (outra) ctx.drawImage(outra, gx(BTN.arma.x - BTN.arma.r - 15), gy(BTN.arma.y - 3), 14 * u, 7 * u);
      }
      ring(BTN.pause.x, BTN.pause.y, BTN.pause.r, 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.45)', 0.8);
      ctx.fillStyle = '#f4ead0';
      ctx.fillRect(gx(BTN.pause.x - 3), gy(BTN.pause.y - 4), 2 * u, 8 * u);
      ctx.fillRect(gx(BTN.pause.x + 1), gy(BTN.pause.y - 4), 2 * u, 8 * u);
    }
    function drawLoja() {
      veil('rgba(3,4,10,0.72)');
      text('BANCADA DO SEU ZÉ', 128, 40, 20, '#ffd36e', 'center', 240);
      text(fmt(o.saldo()) + ' PEQUIS', 128, 66, 13, '#ffd84a', 'center', 240);
      text(E.touchMode ? 'TOQUE PARA VOLTAR' : 'B OU ESC VOLTA', 128, 96, 11, '#ffe9a0', 'center', 240);
    }
    function controlsLines() {
      if (E.touchMode) return ['JOYSTICK À ESQUERDA ANDA', 'TOQUE À DIREITA ATIRA PARA ONDE VOCÊ OLHA'];
      return ['WASD OU SETAS ANDAM  ·  MOUSE MIRA', 'CLIQUE OU ESPAÇO ATIRA  ·  R RECARREGA  ·  P PAUSA'];
    }
    function drawTitle() {
      veil('rgba(3,4,10,0.5)');
      text('NOITE DOS', 128, 14, 16, '#cfe9a8', 'center');
      text('ZUMBIS', 128, 25, 38, '#8fd16a', 'center');
      text(S.sf ? 'NOITE SEM FIM: as mesmas ondas, com o seu arsenal' : 'um quintal no Cerrado, uma lanterna e a lua cheia', 128, 60, 10, S.sf ? '#ffd84a' : '#e6dcc4', 'center', 236);
      const cl = controlsLines();
      text(cl[0], 128, 92, 10, '#f4ead0', 'center', 240);
      text(cl[1], 128, 103, 10, '#f4ead0', 'center', 240);
      text(S.best > 0 ? 'RECORDE ' + fmt(S.best) : 'SOBREVIVA ÀS ONDAS', 128, 118, 11, '#ffd36e', 'center');
      text(E.touchMode ? 'TOQUE PARA COMEÇAR' : 'CLIQUE OU ENTER PARA COMEÇAR', 128, 136, 13, '#ffe9a0', 'center', 240);
    }
    function drawTitleUI() {
      veil('rgba(3,4,10,0.55)');
      text('NOITE DOS', 128, 24, 14, '#cfe9a8', 'center');
      text('ZUMBIS', 128, 33, 32, '#8fd16a', 'center');
      text(E.touchMode ? 'JOYSTICK À ESQUERDA ANDA  ·  TOQUE À DIREITA ATIRA' : 'WASD ANDA  ·  MOUSE MIRA  ·  CLIQUE ATIRA  ·  P PAUSA', 128, 142, 9, '#e6dcc4', 'center', 240, 0.9);
    }
    function drawPause() {
      veil('rgba(3,4,10,0.6)');
      text('PAUSADO', 128, 52, 26, '#f4ead0', 'center');
      text(E.touchMode ? 'TOQUE PARA CONTINUAR' : 'P OU CLIQUE PARA CONTINUAR', 128, 84, 12, '#ffe9a0', 'center', 240);
      text('ONDA ' + Math.max(1, S.wave) + '  ·  ' + fmt(S.score) + ' PONTOS', 128, 100, 10, '#cfe9a8', 'center', 240);
      if (!E.touchMode && o.escFecha !== false) text('ESC DE NOVO FECHA O ARCADE', 128, 118, 10, '#ff9a8a', 'center', 240);
    }
    function drawOver(semBotao) {
      const k = S.reduced ? 1 : S.overT;
      veil('rgba(24,3,6,' + (0.68 * k) + ')');
      if (k < 0.25) return;
      const a = Math.min(1, (k - 0.25) / 0.5);
      text('A NOITE TE PEGOU', 128, 22, 22, '#ff6b5a', 'center', 240, a);
      text(fmt(S.score) + ' PONTOS', 128, 50, 16, '#f4ead0', 'center', 240, a);
      text('ONDA ' + S.wave + '  ·  ' + S.kills + (S.kills === 1 ? ' ZUMBI' : ' ZUMBIS'), 128, 70, 11, '#cfe9a8', 'center', 240, a);
      text(S.novoRecorde ? 'NOVO RECORDE!' : 'RECORDE ' + fmt(S.best), 128, 86, 13, '#ffd36e', 'center', 240, a);
      if (S.sf) text('+' + fmt(S.pq.partida) + ' PEQUIS NESTA NOITE', 128, 100, 11, '#ffd84a', 'center', 240, a);
      const ready = o.agora() - S.overAt > N.OVER_GUARD_MS;
      if (!semBotao) text(E.touchMode ? 'TOQUE PARA JOGAR DE NOVO' : 'CLIQUE OU ENTER PARA JOGAR DE NOVO', 128, 116, 12, '#ffe9a0', 'center', 240, ready ? a : a * 0.35);
      if (!ready && !o.temLaco() && S.alive) global.setTimeout(function () { if (S.alive && S.state === 'over' && !o.temLaco()) o.redesenhar(); }, N.OVER_GUARD_MS + 30);
    }
    return { desenhar: drawWorld, DEMO: DEMO, telas: telas, noTitulo: noTitulo };
  }
  global.AndreyZumbisCena = { versao: 2, criar: criar };
})(typeof window !== 'undefined' ? window : this);
