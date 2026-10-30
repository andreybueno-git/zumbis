// zumbis-nucleo.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-nucleo.js).
(function (global) {
  'use strict';
  const TAP_MOVE = 0.16;
  const TOUCH_CONE = 35 * Math.PI / 180;
  const CONE_50 = 50 * Math.PI / 180;
  const STICK_DEAD = 0.2 * 18;
  const PICKUP_LIFE = 15;
  const OVER_ANIM = 0.8;
  const OVER_GUARD_MS = 700;
  const MOVE = { up: 1, down: 1, left: 1, right: 1 };
  const TROCA = 0.25;
  const SEGURAR_ARMA = 0.3;
  const MIRA_VOLTA = 0.4;
  const MIRA = { normal: 110, forte: 150, soltaNormal: 140, soltaForte: 180, corpo: 30 };
  const ESPALHA = [[0, 0], [5, 2], [-5, 2], [2, -4], [-3, 4], [6, -2]];
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function angDiff(a, b) { let d = b - a; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
  function emit(S, kind, detail) { S.fx.emit(kind, detail); }
  function perfilDe(p) {
    p = p || {};
    const arm = [0, -1, -1, -1, -1, -1, -1, -1, -1], mel = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < 9; i++) if (p.arm && isFinite(p.arm[i])) arm[i] = clamp(Math.floor(p.arm[i]), -1, 3);
    for (let i = 0; i < 7; i++) if (p.mel && isFinite(p.mel[i])) mel[i] = clamp(Math.floor(p.mel[i]), 0, 3);
    arm[0] = Math.max(0, arm[0]);
    return { arm: arm, mel: mel, eq: isFinite(p.eq) ? clamp(Math.floor(p.eq), 0, 8) : 0 };
  }
  function calcStats(S) {
    const M = S.D.MELHORIAS;
    function nv(k) { return S.sf ? clamp(S.perfil.mel[M[k].i] | 0, 0, M[k].preco.length) : 0; }
    return { vidas: M.coracao.v[nv('coracao')], pe: M.pe.v[nv('pe')], mao: M.mao.v[nv('mao')], coleta: M.ima.v[nv('ima')],
      faro: M.faro.v[nv('faro')], invuln: M.casca.v[nv('casca')], casca: nv('casca'), ima: nv('ima') };
  }
  function idsArmas(D) { return Object.keys(D.ARMAS).sort(function (a, b) { return D.ARMAS[a].tecla - D.ARMAS[b].tecla; }); }
  function efetiva(S, id) {
    const base = S.D.ARMAS[id], nivel = S.sf ? clamp(S.perfil.arm[base.tecla - 1] | 0, 0, base.niveis.length) : 0;
    const a = {};
    Object.keys(base).forEach(function (k) { if (k !== 'niveis') a[k] = base[k]; });
    for (let n = 0; n < nivel; n++) { const m = base.niveis[n].muda; Object.keys(m).forEach(function (k) { a[k] = m[k]; }); }
    if (a.recarga) a.recarga = a.recarga * S.stats.mao;
    a.id = id; a.nivel = nivel;
    return a;
  }
  function ganharArma(S, id) {
    const def = efetiva(S, id);
    S.armas[id] = { def: def, pente: def.pente || 0 };
    S.slots.push(id);
    S.slots.sort(function (a, b) { return S.D.ARMAS[a].tecla - S.D.ARMAS[b].tecla; });
    return S.armas[id];
  }
  function montarArsenal(S) {
    const D = S.D, P = S.perfil;
    S.stats = calcStats(S);
    S.armas = {}; S.slots = []; S.reservas = {};
    idsArmas(D).forEach(function (id) {
      if (id === 'pistolinha' || (S.sf && P.arm[D.ARMAS[id].tecla - 1] >= 0)) ganharArma(S, id);
    });
    S.slots.forEach(function (id) {
      const def = S.armas[id].def, f = def.municao;
      if (!f) return;
      const E = D.ECONOMIA.municao[f];
      if (S.reservas[f] == null) S.reservas[f] = S.sf ? E.inicio : def.reserva0;
      else S.reservas[f] = Math.min(E.max, S.reservas[f] + E.caixa);
    });
    const eq = S.sf ? idDaTecla(S, P.eq + 1) : null;
    S.arma = (eq ? S.armas[eq] : S.armas.pistolinha).def;
    S.armaAnterior = S.slots.filter(function (id) { return id !== S.arma.id; })[0] || null;
  }
  function idDaTecla(S, n) {
    for (let i = 0; i < S.slots.length; i++) if (S.D.ARMAS[S.slots[i]].tecla === n) return S.slots[i];
    return null;
  }
  function municaoDe(S) {
    Object.defineProperty(S, 'mag', {
      get: function () { const a = S.armas[S.arma.id]; return a ? a.pente : 0; },
      set: function (v) { const a = S.armas[S.arma.id]; if (a && S.arma.municao) a.pente = v; }
    });
    Object.defineProperty(S, 'reserve', {
      get: function () { const f = S.arma.municao; return f ? (S.reservas[f] || 0) : 0; },
      set: function (v) { const f = S.arma.municao; if (f) S.reservas[f] = v; }
    });
  }
  function temMunicao(S, id) {
    const a = S.armas[id];
    if (!a) return false;
    return !a.def.municao || a.pente > 0 || (S.reservas[a.def.municao] || 0) > 0;
  }
  function municaoTotal(S) {
    let n = 0;
    S.slots.forEach(function (id) { if (S.armas[id].def.municao) n += S.armas[id].pente; });
    Object.keys(S.reservas).forEach(function (f) { n += S.reservas[f]; });
    return n;
  }
  function gatilho(S) { const E = S.entrada; return E.fireKey || E.mouse.down || E.fireTouch.id !== null; }
  function criar(op) {
    const D = op.dados;
    const F = D.FASES[op.fase || 'quintal'];
    const fx = op.fx;
    const modo = op.modo === 'semfim' ? 'semfim' : 'pura';
    const best = fx.lerRecorde(modo);
    const S = {
      D: D, F: F, ondas: D.ONDAS[F.ondas], modo: modo, sf: modo === 'semfim',
      obst: F.obstaculos.map(function (o) { return Object.assign({}, o); }),
      rand: op.rand || Math.random, fxRand: op.fxRand || Math.random, agora: op.agora, fx: fx,
      perfil: perfilDe(op.perfil), miraToque: op.mira || 'auto',
      alive: true, state: 'title', paused: false,
      generation: 0,
      score: 0, kills: 0, wave: 0, hearts: 0, reloadT: 0, fireCd: 0,
      best: best, bestAtStart: best, recordEmitted: false, novoRecorde: false, recordDirty: false,
      player: null,
      zombies: [], bullets: [], pickups: [], decals: [], parts: [], floats: [],
      queue: [], spawnT: 0, breakT: 0, waveTotal: 0, maxAlive: 6, speedScale: 1,
      banner: null,
      overT: 1, overAt: 0,
      shakeT: 0, hurtFx: 0, muzzleT: 0, emptyT: 0, ammoHelpT: 0, lampT: 0, time: 0,
      frozen: false,
      reduced: !!op.reduzido,
      aimMode: 'teclado',
      arma: null, armas: {}, slots: [], reservas: {}, armaAnterior: null, stats: null,
      trocaT: 0, golpe: null, parada: 0, alvo: null, miraSoltaT: 0, linhaArmasT: 0, aviso: null, imaT: 0,
      pq: { partida: 0, resto: 0, onda: 0, restoOnda: 0 },
      colete: 0, compras: { cafe: { partida: 0, pausa: 0 }, colete: { partida: 0, pausa: 0 } },
      lojaVolta: null,
      entrada: {
        held: { up: false, down: false, left: false, right: false },
        pulse: { up: 0, down: 0, left: 0, right: 0 },
        fireKey: false, shotQueued: false,
        mouse: { x: D.TELA.w / 2, y: D.TELA.h / 2, inside: false, t: -1e9, down: false, id: null },
        touchMode: !!op.toque,
        stick: { id: null, bx: 0, by: 0, kx: 0, ky: 0 },
        fireTouch: { id: null },
        touchBtn: new Map(),
        armaToque: null
      }
    };
    municaoDe(S);
    montarArsenal(S);
    S.hearts = S.stats.vidas;
    S.player = newPlayer(S);
    return S;
  }
  function newPlayer(S) {
    return { x: S.F.jogador.x, y: S.F.jogador.y, face: -Math.PI / 2, aim: -Math.PI / 2, aimVis: -Math.PI / 2, moving: false, walkT: 0, invuln: 0 };
  }
  function pushOutObstacles(S, e, r) {
    for (let i = 0; i < S.obst.length; i++) {
      const o = S.obst[i];
      const dx = e.x - o.x, dy = e.y - o.y, m = o.r + r, d2 = dx * dx + dy * dy;
      if (d2 < m * m) {
        const d = Math.sqrt(d2) || 0.001;
        e.x = o.x + dx / d * m; e.y = o.y + dy / d * m;
      }
    }
  }
  function moveInput(S) {
    const E = S.entrada, held = E.held, pulse = E.pulse, stick = E.stick;
    let mx = 0, my = 0;
    if (held.left || pulse.left > 0) mx -= 1;
    if (held.right || pulse.right > 0) mx += 1;
    if (held.up || pulse.up > 0) my -= 1;
    if (held.down || pulse.down > 0) my += 1;
    if (stick.id !== null) {
      const dx = (stick.kx - stick.bx) / 18, dy = (stick.ky - stick.by) / 18;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0.2) { mx += dx / Math.max(1, len); my += dy / Math.max(1, len); }
    }
    const len = Math.sqrt(mx * mx + my * my);
    if (len > 1) { mx /= len; my /= len; }
    return { x: mx, y: my, len: Math.min(1, len) };
  }
  function chestY(e) { return e.y - 7; }
  function nearestZombie(S, maxD, coneAng, coneHalf) {
    let bestZ = null, bd = maxD * maxD;
    for (let i = 0; i < S.zombies.length; i++) {
      const z = S.zombies[i];
      if (z.dying || z.emerge < 0.6) continue;
      const dx = z.x - S.player.x, dy = (z.y - 6) - chestY(S.player);
      const d2 = dx * dx + dy * dy;
      if (d2 >= bd) continue;
      if (coneHalf != null && Math.abs(angDiff(coneAng, Math.atan2(dy, dx))) > coneHalf) continue;
      bd = d2; bestZ = z;
    }
    return bestZ;
  }
  function obstaculoNoCaminho(S, x0, y0, x1, y1) {
    const sx = x1 - x0, sy = y1 - y0, sl2 = sx * sx + sy * sy || 1e-6;
    for (let j = 0; j < S.obst.length; j++) {
      const o = S.obst[j], oy = o.y - o.tiroDy;
      const t = clamp(((o.x - x0) * sx + (oy - y0) * sy) / sl2, 0, 1);
      const cx = x0 + sx * t - o.x, cy = y0 + sy * t - oy;
      if (cx * cx + cy * cy < o.tiroR * o.tiroR) return true;
    }
    return false;
  }
  function touchAimRef(S) {
    const stick = S.entrada.stick;
    if (stick.id !== null) {
      const dx = stick.kx - stick.bx, dy = stick.ky - stick.by;
      if (dx * dx + dy * dy > STICK_DEAD * STICK_DEAD) return Math.atan2(dy, dx);
    }
    return S.player.face;
  }
  function alvoDistancia(S, z) {
    const def = S.D.INIMIGOS[z.tipo], P = S.player;
    const dx = z.x - P.x, dy = (z.y - def.peito) - chestY(P);
    return Math.sqrt(dx * dx + dy * dy);
  }
  function escolherAlvo(S) {
    const P = S.player, corpo = S.arma.tipo === 'corpo';
    let melhor = null, bd = Infinity;
    for (let i = 0; i < S.zombies.length; i++) {
      const z = S.zombies[i];
      if (z.dying || z.emerge < 0.6) continue;
      const def = S.D.INIMIGOS[z.tipo], d = alvoDistancia(S, z);
      const lim = corpo ? MIRA.corpo : Math.min(S.arma.alcance || Infinity, def.grande ? MIRA.forte : MIRA.normal);
      if (d > lim || d >= bd) continue;
      if (!corpo && obstaculoNoCaminho(S, P.x, chestY(P), z.x, z.y - def.peito)) continue;
      bd = d; melhor = z;
    }
    return melhor;
  }
  function alvoValido(S, z) {
    if (S.zombies.indexOf(z) < 0 || z.dying) return false;
    const lim = S.arma.tipo === 'corpo' ? MIRA.corpo : S.D.INIMIGOS[z.tipo].grande ? MIRA.soltaForte : MIRA.soltaNormal;
    return alvoDistancia(S, z) <= lim;
  }
  function miraToque(S) {
    const E = S.entrada, P = S.player, ref = touchAimRef(S);
    if (S.miraToque === 'auto' || S.arma.tipo === 'corpo') {
      if (E.fireTouch.id !== null || E.shotQueued) {
        if (S.alvo && !alvoValido(S, S.alvo)) S.alvo = null;
        if (!S.alvo) S.alvo = escolherAlvo(S);
        const z = S.alvo;
        S.miraSoltaT = z ? MIRA_VOLTA : 0;
        P.aim = z ? Math.atan2((z.y - S.D.INIMIGOS[z.tipo].peito) - chestY(P), z.x - P.x) : ref;
      } else {
        S.alvo = null;
        if (S.miraSoltaT <= 0) P.aim = ref;
      }
      return;
    }
    if (S.miraToque === 'livre') { P.aim = ref; return; }
    const z = nearestZombie(S, 170, ref, S.miraToque === 'assistida50' ? CONE_50 : TOUCH_CONE);
    P.aim = z ? Math.atan2((z.y - 6) - chestY(P), z.x - P.x) : ref;
  }
  function updateAim(S, moving) {
    const E = S.entrada, mouse = E.mouse, P = S.player;
    const t = S.agora();
    if (!E.touchMode && mouse.inside && (mouse.down || t - mouse.t < 3000 || !moving)) {
      S.aimMode = 'mouse';
      S.alvo = null;
      P.aim = Math.atan2(mouse.y - chestY(P), mouse.x - P.x);
    } else if (E.touchMode && (E.fireTouch.id !== null || E.stick.id !== null || E.shotQueued || S.miraSoltaT > 0)) {
      S.aimMode = 'toque';
      miraToque(S);
    } else {
      S.aimMode = E.touchMode ? 'toque' : 'teclado';
      S.alvo = null;
      P.aim = P.face;
    }
  }
  function startReload(S) {
    if (!S.arma.municao) return false;
    if (S.state !== 'playing' || S.paused || S.reloadT > 0 || S.mag >= S.arma.pente || S.reserve <= 0) return false;
    S.reloadT = S.arma.recarga;
    emit(S, 'reload', { pente: S.mag, reserva: S.reserve });
    return true;
  }
  function fireOnce(S) {
    if (S.trocaT > 0) return false;
    return S.arma.tipo === 'corpo' ? golpear(S) : atirarBala(S);
  }
  function atirarBala(S) {
    if (S.reloadT > 0) return false;
    if (S.mag <= 0) {
      if (S.reserve > 0) { startReload(S); return false; }
      if (S.emptyT <= 0) {
        S.emptyT = 0.9;
        addFloat(S, S.player.x, S.player.y - 18, 'SEM BALAS!', '#ff7a6a', 10);
        const gen = S.generation;
        emit(S, 'empty', {});
        if (S.sf && gen === S.generation && S.alive && S.state === 'playing') trocarSemMunicao(S);
      }
      return false;
    }
    const arma = S.arma, P = S.player;
    let ang = P.aim;
    if (S.aimMode === 'teclado') {
      const z = nearestZombie(S, 150, P.face, 0.5);
      if (z) ang = Math.atan2((z.y - 6) - chestY(P), z.x - P.x);
    }
    ang += (S.rand() - 0.5) * arma.desvio;
    S.mag--;
    S.fireCd = S.sf ? S.fireCd + arma.cad : arma.cad;
    S.muzzleT = 0.06;
    const ox = P.x + Math.cos(ang) * 7, oy = chestY(P) + Math.sin(ang) * 7;
    S.bullets.push({ x: ox, y: oy, px: ox, py: oy, vx: Math.cos(ang) * arma.vel, vy: Math.sin(ang) * arma.vel, life: arma.vida, vel: arma.vel, dano: arma.dano, knock: arma.knock });
    P.aimVis = ang;
    emit(S, 'shot', S.sf ? { pente: S.mag, reserva: S.reserve, arma: arma.id } : { pente: S.mag, reserva: S.reserve });
    if (S.mag === 0 && S.reserve > 0 && S.alive) startReload(S);
    return true;
  }
  function golpear(S) {
    const a = S.arma, P = S.player;
    let ang = P.aim;
    if (S.aimMode === 'teclado') {
      const z = nearestZombie(S, MIRA.corpo, null, null);
      if (z) ang = Math.atan2(z.y - P.y, z.x - P.x);
    }
    S.golpe = { t: 0, ang: ang, feito: false, acertou: false };
    S.fireCd = S.sf ? S.fireCd + a.cad : a.cad;
    P.aimVis = ang;
    emit(S, 'shot', { pente: 0, reserva: 0, arma: a.id });
    return true;
  }
  function acertarGolpe(S, g) {
    const a = S.arma, P = S.player, D = S.D, B = S.F.limites;
    const meio = a.arco * Math.PI / 360, alvos = [];
    for (let i = 0; i < S.zombies.length; i++) {
      const z = S.zombies[i];
      if (z.dying || z.emerge < 0.35) continue;
      const def = D.INIMIGOS[z.tipo], dx = z.x - P.x, dy = z.y - P.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d - def.r > a.alcance) continue;
      if (d > def.r + D.JOGADOR.raio && Math.abs(angDiff(g.ang, Math.atan2(dy, dx))) > meio) continue;
      alvos.push(z);
    }
    P.x += Math.cos(g.ang) * a.avanca; P.y += Math.sin(g.ang) * a.avanca;
    pushOutObstacles(S, P, D.JOGADOR.raio);
    P.x = clamp(P.x, B.x0, B.x1); P.y = clamp(P.y, B.y0, B.y1);
    if (!alvos.length) return;
    g.acertou = true;
    S.parada = a.parada;
    const gen = S.generation;
    for (let i = 0; i < alvos.length; i++) {
      const z = alvos[i];
      if (z.dying) continue;
      const dx = z.x - P.x, dy = z.y - P.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      damageZombie(S, z, dx / d, dy / d, z.x, z.y - D.INIMIGOS[z.tipo].peito, a.dano, a.knock);
      if (gen !== S.generation || !S.alive || S.state !== 'playing') return;
    }
  }
  function trocar(S, id, motivo) {
    if (!S.armas[id] || S.arma.id === id) return false;
    const de = S.arma.id;
    S.armaAnterior = de;
    S.arma = S.armas[id].def;
    S.reloadT = 0;
    S.trocaT = TROCA;
    S.golpe = null; S.alvo = null;
    S.linhaArmasT = 2;
    if (motivo === 'auto') addFloat(S, S.player.x, S.player.y - 26, 'TROCOU PARA ' + S.arma.nome.toUpperCase(), '#cfe9a8', 9);
    emit(S, 'switch', { de: de, para: id });
    return true;
  }
  function trocarTecla(S, n) {
    const id = idDaTecla(S, n);
    if (id) { trocar(S, id, 'tecla'); return true; }
    addFloat(S, S.player.x, S.player.y - 18, 'SEM ESSA ARMA', '#ff9a8a', 9);
    const vg = S.D.BANCADA.armas[n - 1];
    emit(S, 'deny', { item: 'arma:' + (vg ? vg.id : n), motivo: 'semArma' });
    return true;
  }
  function trocarCiclo(S, dir) {
    const L = S.slots, i0 = L.indexOf(S.arma.id);
    for (let k = 1; k < L.length; k++) {
      const id = L[(i0 + dir * k + L.length * 2) % L.length];
      if (temMunicao(S, id)) return trocar(S, id, 'ciclo');
    }
    return false;
  }
  function alternar(S) {
    const id = S.armaAnterior;
    if (id && S.armas[id] && id !== S.arma.id) return trocar(S, id, 'alternar');
    return trocarCiclo(S, 1);
  }
  function trocarSemMunicao(S) {
    if (S.armaAnterior && temMunicao(S, S.armaAnterior)) return trocar(S, S.armaAnterior, 'auto');
    for (let i = 0; i < S.slots.length; i++) if (!S.armas[S.slots[i]].def.municao) return trocar(S, S.slots[i], 'auto');
    for (let i = 0; i < S.slots.length; i++) if (S.slots[i] !== S.arma.id && temMunicao(S, S.slots[i])) return trocar(S, S.slots[i], 'auto');
    return false;
  }
  function armaToque(S, fase) {
    const E = S.entrada;
    if (fase === 'inicio') { E.armaToque = { t: 0, feito: false }; return true; }
    const a = E.armaToque;
    E.armaToque = null;
    if (a && !a.feito && S.state === 'playing' && !S.paused) alternar(S);
    return true;
  }
  function spawnZombie(S, tipo, x, y, extra) {
    const def = S.D.INIMIGOS[tipo], VW = S.D.TELA.w, F = S.F, rand = S.rand;
    let sx = x, sy = y, emerge = 1, from = 'teste';
    if (sx == null) {
      const opts2 = [];
      F.porteiras.forEach(function (gp) { const cx = (gp[0] + gp[1]) / 2; if (Math.abs(cx - S.player.x) > 30 || S.player.y > 80) opts2.push({ x: cx + (rand() - 0.5) * 14, y: F.cerca - 4, from: 'cerca' }); });
      if (S.player.x > 50) opts2.push({ x: -8, y: 46 + rand() * 92, from: 'esquerda' });
      if (S.player.x < VW - 50) opts2.push({ x: VW + 8, y: 46 + rand() * 92, from: 'direita' });
      const o = opts2[Math.floor(rand() * opts2.length)] || { x: -8, y: 90, from: 'esquerda' };
      sx = o.x; sy = o.y; from = o.from;
      emerge = from === 'cerca' ? 0 : 1;
    }
    const z = {
      tipo: tipo, x: sx, y: sy, hp: def.hp, r: def.r, kvx: 0, kvy: 0, slowT: 0, flash: 0,
      dir: 'down', walkT: rand(), phase: rand() * 6.28, emerge: emerge, dying: 0, extra: !!extra, from: from
    };
    S.zombies.push(z);
    return z;
  }
  function buildQueue(S, n) {
    const O = S.ondas, c = O.corredor, g = O.grandao;
    const total = O.base + O.porOnda * (n - 1);
    const brutes = n >= g.desde ? Math.floor((n - g.menos) / g.div) : 0;
    const runners = n >= c.desde ? Math.round(total * Math.min(c.max, c.fracao[0] + c.fracao[1] * (n - c.desde))) : 0;
    const head = [], rest = [];
    for (let i = 0; i < total - runners - brutes; i++) (i < O.comunsNaFrente ? head : rest).push('normal');
    for (let i = 0; i < runners; i++) rest.push('corredor');
    for (let i = 0; i < brutes; i++) rest.push('grandao');
    for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(S.rand() * (i + 1)); const t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
    return head.concat(rest);
  }
  function beginWave(S, n) {
    const O = S.ondas;
    S.wave = n;
    S.queue = buildQueue(S, n);
    S.waveTotal = S.queue.length;
    S.spawnT = n === 1 ? O.espera.primeira : O.espera.outras;
    S.breakT = 0;
    S.maxAlive = Math.min(O.vivos.max, O.vivos.base + O.vivos.porOnda * n);
    S.speedScale = 1 + Math.min(O.pressa.max, O.pressa.porOnda * (n - 1));
    showBanner(S, 'ONDA ' + n, O.recados[n] || (S.waveTotal + ' zumbis'), '#cfe9a8', 2.2);
    if (n >= O.municaoDesde) spawnPickup(S, 'municao');
    if (n >= O.cafeDesde && S.hearts < S.stats.vidas && n % 2 === 1) spawnPickup(S, 'cafe');
    S.pq.onda = 0;
    S.fx.announce('Onda ' + n + '.');
    emit(S, 'wave', { onda: n, zumbis: S.waveTotal });
  }
  function waveCleared(S) {
    const bonus = S.ondas.bonus * S.wave;
    S.score += bonus;
    checkRecord(S);
    flushRecord(S);
    let sub = 'bônus +' + bonus, pq = 0;
    if (S.sf) {
      const v = S.pq.onda * S.D.ECONOMIA.BONUS_ONDA + S.pq.restoOnda;
      pq = Math.floor(v + 1e-9);
      S.pq.restoOnda = v - pq; S.pq.onda = 0;
      if (pq > 0) { S.pq.partida += pq; S.fx.creditar(pq); sub += ' · +' + pq + ' PEQUIS'; }
      S.compras.cafe.pausa = 0; S.compras.colete.pausa = 0;
    }
    showBanner(S, 'ONDA ' + S.wave + ' LIMPA!', sub, '#ffd36e', 2.4);
    S.breakT = S.ondas.pausa;
    if (pq > 0) emit(S, 'coin', { valor: pq, motivo: 'onda' });
  }
  function spawnPickup(S, tipo, x, y) {
    if (x == null) {
      const Z = S.F.zonaItens;
      for (let tries = 0; tries < 20; tries++) {
        x = Z.x0 + S.rand() * (Z.x1 - Z.x0); y = Z.y0 + S.rand() * (Z.y1 - Z.y0);
        let ok = Math.hypot(x - S.player.x, y - S.player.y) > 34;
        for (let i = 0; i < S.obst.length && ok; i++) if (Math.hypot(x - S.obst[i].x, y - S.obst[i].y) < S.obst[i].r + 8) ok = false;
        if (ok) break;
      }
    }
    const p = { tipo: tipo, x: x, y: y, t: 0, life: PICKUP_LIFE };
    if (tipo === 'pequi') { p.valor = 1; p.life = S.D.ECONOMIA.pequi.vida; p.vx = 0; p.vy = 0; p.puxado = false; }
    if (tipo === 'municao' && S.sf) p.fam = familiaDrop(S);
    S.pickups.push(p);
    return p;
  }
  function familiaDrop(S) {
    if (S.arma.municao) return S.arma.municao;
    let melhor = null, r = Infinity;
    Object.keys(S.reservas).forEach(function (f) { const q = S.reservas[f] / S.D.ECONOMIA.municao[f].max; if (q < r) { r = q; melhor = f; } });
    return melhor || 'balas';
  }
  function fatorSemFim(S) { const E = S.D.ECONOMIA.semFim; return S.wave <= E.ateOnda ? E.antes : E.depois; }
  function soltarPequis(S, z, def) {
    const E = S.D.ECONOMIA, valor = def.pago * E.PQ_POR_HP * fatorSemFim(S);
    S.pq.onda += valor;
    const total = valor + S.pq.resto, n = Math.floor(total + 1e-9);
    S.pq.resto = total - n;
    const VW = S.D.TELA.w;
    let resto = n, k = 0;
    E.pequi.valores.forEach(function (v) {
      while (resto >= v) {
        resto -= v;
        const o = ESPALHA[k++ % ESPALHA.length];
        spawnPickup(S, 'pequi', clamp(z.x + o[0], 12, VW - 12), clamp(z.y + o[1], 44, S.F.varanda - 4)).valor = v;
      }
    });
    const max = S.entrada.touchMode ? E.pequi.maxChaoToque : E.pequi.maxChao;
    let soltos = S.pickups.filter(function (p) { return p.tipo === 'pequi'; });
    while (soltos.length > max) {
      soltos[1].valor += soltos[0].valor;
      S.pickups.splice(S.pickups.indexOf(soltos[0]), 1);
      soltos = soltos.slice(1);
    }
  }
  function showBanner(S, title, sub, color, life) { S.banner = { title: title, sub: sub || '', color: color || '#f4ead0', t: 0, life: life || 2 }; }
  function addFloat(S, x, y, text, color, size) { S.floats.push({ x: x, y: y, text: text, color: color, size: size || 9, t: 0, life: 0.95 }); if (S.floats.length > 14) S.floats.shift(); }
  function burst(S, x, y, n, colors, speed) {
    if (S.reduced) n = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const a = S.fxRand() * 6.283, s = speed * (0.4 + S.fxRand() * 0.8);
      S.parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 10, t: 0, life: 0.3 + S.fxRand() * 0.25, c: colors[i % colors.length] });
    }
    if (S.parts.length > 90) S.parts.splice(0, S.parts.length - 90);
  }
  function checkRecord(S) {
    if (S.score <= S.best) return;
    S.best = S.score;
    S.recordDirty = true;
    if (!S.recordEmitted && S.bestAtStart > 0) {
      S.recordEmitted = true;
      flushRecord(S);
      addFloat(S, S.player.x, S.player.y - 24, 'NOVO RECORDE!', '#ffd36e', 10);
      if (!S.sf) emit(S, 'record', { recorde: S.best, pontos: S.score, anterior: S.bestAtStart });
    }
  }
  function flushRecord(S) {
    if (!S.recordDirty) return;
    S.recordDirty = false;
    if (S.best > 0 && S.best >= S.fx.lerRecorde(S.modo)) S.fx.gravarRecorde(S.best, S.modo);
  }
  function resetRun(S) {
    S.score = 0; S.kills = 0; S.wave = 0;
    S.reloadT = 0; S.fireCd = 0; S.entrada.shotQueued = false;
    montarArsenal(S);
    S.hearts = S.stats.vidas;
    S.player = newPlayer(S);
    S.zombies = []; S.bullets = []; S.pickups = []; S.decals = []; S.parts = []; S.floats = [];
    S.queue = []; S.spawnT = 0; S.breakT = 0; S.waveTotal = 0; S.banner = null;
    S.shakeT = 0; S.hurtFx = 0; S.muzzleT = 0; S.emptyT = 0; S.ammoHelpT = 0; S.overT = 1; S.time = 0;
    S.trocaT = 0; S.golpe = null; S.parada = 0; S.alvo = null; S.miraSoltaT = 0; S.linhaArmasT = 0; S.aviso = null; S.imaT = 0;
    S.pq = { partida: 0, resto: 0, onda: 0, restoOnda: 0 };
    S.colete = 0; S.compras = { cafe: { partida: 0, pausa: 0 }, colete: { partida: 0, pausa: 0 } };
  }
  function releaseAll(S) {
    const E = S.entrada;
    E.held.up = E.held.down = E.held.left = E.held.right = false;
    E.pulse.up = E.pulse.down = E.pulse.left = E.pulse.right = 0;
    E.fireKey = false; E.shotQueued = false;
    E.mouse.down = false; E.mouse.id = null;
    E.stick.id = null; E.fireTouch.id = null; E.touchBtn.clear();
    E.armaToque = null;
  }
  function comecar(S) {
    flushRecord(S);
    S.generation++;
    S.lojaVolta = null;
    resetRun(S);
    S.best = Math.max(S.best, S.fx.lerRecorde(S.modo));
    S.bestAtStart = S.best; S.recordEmitted = false; S.novoRecorde = false; S.recordDirty = false;
    S.state = 'playing';
    S.paused = false;
    releaseAll(S);
    S.fx.announce('Partida começou.');
    const gen = S.generation;
    emit(S, 'start', S.sf ? { recorde: 0, modo: 'semfim', recordeSemFim: S.best } : { recorde: S.best });
    if (gen !== S.generation || !S.alive) return false;
    beginWave(S, 1);
    if (gen !== S.generation || !S.alive) return false;
    return true;
  }
  function gameOver(S) {
    S.state = 'over';
    S.paused = false;
    releaseAll(S);
    S.bullets = []; S.banner = null; S.golpe = null; S.alvo = null;
    S.overT = S.reduced ? 1 : 0;
    S.overAt = S.agora();
    S.novoRecorde = S.score > S.bestAtStart;
    if (S.score > S.best) { S.best = S.score; S.recordDirty = true; }
    flushRecord(S);
    S.fx.announce('Fim de jogo. ' + S.score + ' pontos, onda ' + S.wave + '.' + (S.novoRecorde ? ' Novo recorde!' : '') + (S.sf ? ' ' + S.pq.partida + ' pequis.' : ''));
    const gen = S.generation;
    const fim = S.sf
      ? { pontos: S.score, onda: S.wave, abates: S.kills, recorde: 0, novoRecorde: S.novoRecorde, pequis: S.pq.partida, fase: S.F.id, modo: 'semfim', recordeSemFim: S.best }
      : { pontos: S.score, onda: S.wave, abates: S.kills, recorde: S.best, novoRecorde: S.novoRecorde };
    const rec = !S.sf && S.novoRecorde && !S.recordEmitted ? { recorde: S.best, pontos: S.score, anterior: S.bestAtStart } : null;
    if (rec) S.recordEmitted = true;
    emit(S, 'gameover', fim);
    if (rec && S.alive && gen === S.generation) emit(S, 'record', rec);
    if (gen !== S.generation || !S.alive) return;
    S.fx.depoisDoFim();
  }
  function overReady(S) { return S.state === 'over' && S.agora() - S.overAt > OVER_GUARD_MS; }
  function acao(S, a, mode) {
    const E = S.entrada;
    if (MOVE[a]) {
      if (mode === 'hold') E.held[a] = true; else E.pulse[a] = TAP_MOVE;
      return true;
    }
    if (a === 'fire') {
      if (mode === 'hold') { if (!E.fireKey) { E.fireKey = true; E.shotQueued = true; } }
      else E.shotQueued = true;
      return true;
    }
    if (a === 'reload') { startReload(S); return true; }
    if (S.sf) {
      if (/^arma[1-9]$/.test(a)) return trocarTecla(S, +a.slice(4));
      if (a === 'anterior' || a === 'proxima') { trocarCiclo(S, a === 'proxima' ? 1 : -1); return true; }
    }
    return false;
  }
  function soltar(S, a) {
    if (MOVE[a]) S.entrada.held[a] = false;
    else if (a === 'fire') S.entrada.fireKey = false;
  }
  function update(S, dt) {
    const D = S.D, F = S.F, E = S.entrada, VW = D.TELA.w, B = F.limites;
    for (let i = S.parts.length - 1; i >= 0; i--) {
      const q = S.parts[i];
      q.t += dt;
      if (q.t >= q.life) { S.parts.splice(i, 1); continue; }
      q.vy += 60 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
    }
    for (let i = S.floats.length - 1; i >= 0; i--) { S.floats[i].t += dt; if (S.floats[i].t >= S.floats[i].life) S.floats.splice(i, 1); }
    for (let i = S.decals.length - 1; i >= 0; i--) { S.decals[i].t += dt; if (S.decals[i].t > 9) S.decals.splice(i, 1); }
    if (S.state === 'over') { if (S.overT < 1) S.overT = Math.min(1, S.overT + dt / OVER_ANIM); return; }
    if (S.state !== 'playing' || S.paused) return;
    const gen = S.generation;
    function stale() { return !S.alive || gen !== S.generation || S.paused || S.state !== 'playing'; }
    if (S.parada > 0) { S.parada = Math.max(0, S.parada - dt); return; }
    S.time += dt;
    S.lampT += dt;
    if (S.banner) { S.banner.t += dt; if (S.banner.t >= S.banner.life) S.banner = null; }
    S.shakeT = Math.max(0, S.shakeT - dt);
    S.hurtFx = Math.max(0, S.hurtFx - dt);
    S.muzzleT = Math.max(0, S.muzzleT - dt);
    S.emptyT = Math.max(0, S.emptyT - dt);
    S.fireCd = S.sf ? S.fireCd - dt : Math.max(0, S.fireCd - dt);
    ['up', 'down', 'left', 'right'].forEach(function (k) { E.pulse[k] = Math.max(0, E.pulse[k] - dt); });
    if (S.sf) {
      S.trocaT = Math.max(0, S.trocaT - dt);
      S.miraSoltaT = Math.max(0, S.miraSoltaT - dt);
      S.linhaArmasT = Math.max(0, S.linhaArmasT - dt);
      S.imaT = Math.max(0, S.imaT - dt);
      if (S.aviso) { S.aviso.t += dt; if (S.aviso.t >= S.aviso.life) S.aviso = null; }
      if (E.armaToque && !E.armaToque.feito) {
        E.armaToque.t += dt;
        if (E.armaToque.t >= SEGURAR_ARMA) { E.armaToque.feito = true; trocarCiclo(S, 1); if (stale()) return; }
      }
    }
    const P = S.player;
    const mv = moveInput(S);
    P.moving = mv.len > 0.05;
    if (P.moving) {
      let vel = D.JOGADOR.vel;
      if (S.sf && gatilho(S)) vel = vel * Math.min(1, S.arma.peso + S.stats.pe);
      P.x += mv.x * vel * dt;
      P.y += mv.y * vel * dt;
      P.face = Math.atan2(mv.y, mv.x);
      P.walkT += dt * (4 + 4 * mv.len);
      pushOutObstacles(S, P, D.JOGADOR.raio);
      P.x = clamp(P.x, B.x0, B.x1);
      P.y = clamp(P.y, B.y0, B.y1);
    }
    P.invuln = Math.max(0, P.invuln - dt);
    updateAim(S, P.moving);
    P.aimVis += angDiff(P.aimVis, P.aim) * Math.min(1, dt * 22);
    if (S.reloadT > 0) {
      S.reloadT -= dt;
      if (S.reloadT <= 0) {
        S.reloadT = 0;
        const take = Math.min(S.arma.pente - S.mag, S.reserve);
        S.mag += take; S.reserve -= take;
      }
    }
    if (S.golpe) {
      const g = S.golpe;
      g.t += dt;
      if (!g.feito && g.t >= S.arma.golpe) { g.feito = true; acertarGolpe(S, g); if (stale()) return; }
      if (S.golpe === g && g.t >= S.arma.anim) S.golpe = null;
    }
    const wantFire = E.shotQueued || E.fireKey || E.mouse.down || E.fireTouch.id !== null;
    if (!S.sf) {
      if (wantFire && S.fireCd <= 0 && S.trocaT <= 0) {
        E.shotQueued = false;
        fireOnce(S);
        if (stale()) return;
      }
    } else if (wantFire && S.trocaT <= 0) {
      for (let n = 0; n < 2 && S.fireCd <= 0; n++) {
        E.shotQueued = false;
        if (!fireOnce(S)) { S.fireCd = Math.max(0, S.fireCd); break; }
        if (stale()) return;
        if (!gatilho(S)) break;
      }
    } else if (S.fireCd < 0) S.fireCd = 0;
    for (let i = S.bullets.length - 1; i >= 0; i--) {
      const bl = S.bullets[i];
      bl.px = bl.x; bl.py = bl.y;
      const nx = bl.x + bl.vx * dt, ny = bl.y + bl.vy * dt;
      bl.life -= dt;
      let hitT = 2, hitZ = null, hitO = null;
      const sx = nx - bl.x, sy = ny - bl.y, sl2 = sx * sx + sy * sy || 1e-6;
      for (let j = 0; j < S.obst.length; j++) {
        const o = S.obst[j];
        const oy = o.y - o.tiroDy;
        const t = clamp(((o.x - bl.x) * sx + (oy - bl.y) * sy) / sl2, 0, 1);
        const cx = bl.x + sx * t - o.x, cy = bl.y + sy * t - oy;
        const rr = o.tiroR;
        if (cx * cx + cy * cy < rr * rr && t < hitT) { hitT = t; hitO = o; }
      }
      for (let j = 0; j < S.zombies.length; j++) {
        const z = S.zombies[j];
        if (z.dying || z.emerge < 0.35) continue;
        const def = D.INIMIGOS[z.tipo];
        const zy = z.y - def.peito;
        const t = clamp(((z.x - bl.x) * sx + (zy - bl.y) * sy) / sl2, 0, 1);
        const cx = bl.x + sx * t - z.x, cy = bl.y + sy * t - zy, rr = def.hitR;
        if (cx * cx + cy * cy < rr * rr && t < hitT) { hitT = t; hitZ = z; hitO = null; }
      }
      if (hitZ) {
        const ix = bl.x + sx * hitT, iy = bl.y + sy * hitT;
        S.bullets.splice(i, 1);
        damageZombie(S, hitZ, bl.vx / bl.vel, bl.vy / bl.vel, ix, iy, bl.dano, bl.knock);
        if (stale()) return;
        continue;
      }
      if (hitO) {
        burst(S, bl.x + sx * hitT, bl.y + sy * hitT, 4, ['#9a7650', '#6b4b30', '#c4a274'], 30);
        S.bullets.splice(i, 1);
        continue;
      }
      bl.x = nx; bl.y = ny;
      if (bl.life <= 0 || bl.x < -12 || bl.x > VW + 12 || bl.y < -12 || bl.y > D.TELA.h + 12) S.bullets.splice(i, 1);
    }
    let aliveCount = 0;
    for (let i = S.zombies.length - 1; i >= 0; i--) {
      const z = S.zombies[i];
      const def = D.INIMIGOS[z.tipo];
      if (z.dying) {
        z.dying += dt;
        if (z.dying > 0.55) {
          S.decals.push({ x: z.x, y: z.y, t: 0, big: def.grande });
          if (S.decals.length > 36) S.decals.shift();
          S.zombies.splice(i, 1);
        }
        continue;
      }
      aliveCount++;
      z.flash = Math.max(0, z.flash - dt);
      z.slowT = Math.max(0, z.slowT - dt);
      if (S.frozen) {
        if (z.emerge >= 1 && bites(S, z)) { hurtPlayer(S, z); if (stale()) return; }
        continue;
      }
      if (z.emerge < 1) {
        z.emerge = Math.min(1, z.emerge + dt / 0.7);
        z.y += 9 * dt;
        z.dir = 'down';
        z.walkT += dt * 3;
        continue;
      }
      let dx = S.player.x - z.x, dy = S.player.y - z.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      dx /= d; dy /= d;
      if (def.ia === 'cambalear') { const sw = Math.sin(S.time * 2.6 + z.phase) * 0.45; const tx = -dy * sw, ty = dx * sw; dx += tx; dy += ty; }
      for (let j = 0; j < S.obst.length; j++) {
        const o = S.obst[j];
        const ox = o.x - z.x, oy = o.y - z.y, od = Math.sqrt(ox * ox + oy * oy) || 0.001;
        if (od < o.r + z.r + 9 && (ox * dx + oy * dy) / od > 0.25) {
          const side = (dx * oy - dy * ox) > 0 ? 1 : -1;
          dx += (oy / od) * side * 0.9; dy += (-ox / od) * side * 0.9;
        }
      }
      for (let j = 0; j < S.zombies.length; j++) {
        const o = S.zombies[j];
        if (o === z || o.dying) continue;
        const sx2 = z.x - o.x, sy2 = z.y - o.y, m = z.r + o.r;
        const d2 = sx2 * sx2 + sy2 * sy2;
        if (d2 < m * m && d2 > 0.0001) { const dd = Math.sqrt(d2); dx += sx2 / dd * 0.8; dy += sy2 / dd * 0.8; }
      }
      const dl = Math.sqrt(dx * dx + dy * dy) || 1;
      dx /= dl; dy /= dl;
      const sp = def.vel * S.speedScale * (z.slowT > 0 ? 0.35 : 1);
      z.x += (dx * sp + z.kvx) * dt;
      z.y += (dy * sp + z.kvy) * dt;
      const dec = Math.exp(-11 * dt);
      z.kvx *= dec; z.kvy *= dec;
      pushOutObstacles(S, z, z.r * 0.8);
      z.y = clamp(z.y, F.cerca - 4, B.y1);
      z.x = clamp(z.x, -14, VW + 14);
      z.walkT += dt * def.passo;
      z.dir = Math.abs(dx) > Math.abs(dy) * 1.1 ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (bites(S, z)) { hurtPlayer(S, z); if (stale()) return; }
    }
    for (let i = S.pickups.length - 1; i >= 0; i--) {
      const p = S.pickups[i];
      p.t += dt;
      if (p.t >= p.life) { S.pickups.splice(i, 1); continue; }
      const dist = Math.hypot(p.x - S.player.x, (p.y - 3) - (S.player.y - 4));
      if (p.tipo === 'pequi' && dist >= 10 && dist < S.stats.coleta) puxarPequi(S, p, dist, dt);
      if (dist < 10) {
        S.pickups.splice(i, 1);
        collect(S, p);
        if (stale()) return;
      }
    }
    if (municaoTotal(S) <= 2 && S.reloadT <= 0 && !S.pickups.some(function (p) { return p.tipo === 'municao'; })) {
      S.ammoHelpT += dt;
      if (S.ammoHelpT > 1.4) { S.ammoHelpT = 0; spawnPickup(S, 'municao'); addFloat(S, 128, 60, 'CAIXA DE MUNIÇÃO!', '#ffe27a', 10); }
    } else S.ammoHelpT = 0;
    if (S.breakT > 0) {
      S.breakT -= dt;
      if (S.breakT <= 0) { beginWave(S, S.wave + 1); if (stale()) return; }
    } else if (!S.frozen) {
      S.spawnT -= dt;
      if (S.spawnT <= 0 && S.queue.length && aliveCount < S.maxAlive) {
        spawnZombie(S, S.queue.shift());
        const iv = S.ondas.intervalo;
        S.spawnT = Math.max(iv.min, iv.base - iv.porOnda * S.wave) * (iv.sorteio[0] + S.rand() * iv.sorteio[1]);
      }
      if (!S.queue.length && aliveCount === 0 && !S.zombies.length && S.wave > 0) waveCleared(S);
    }
  }
  function puxarPequi(S, p, dist, dt) {
    const dx = S.player.x - p.x, dy = (S.player.y - 4) - (p.y - 3), ux = dx / dist, uy = dy / dist;
    if (!p.puxado) { p.puxado = true; p.vx = -uy * 40; p.vy = ux * 40; }
    const v = S.D.ECONOMIA.pequi.puxa, k = Math.min(1, dt * 10);
    p.vx += (ux * v - p.vx) * k; p.vy += (uy * v - p.vy) * k;
    p.x += p.vx * dt; p.y += p.vy * dt;
    S.imaT = 0.6;
  }
  function bites(S, z) {
    const px2 = S.player.x - z.x, py2 = S.player.y - z.y, mr = z.r + S.D.JOGADOR.raio - 0.5;
    return S.player.invuln <= 0 && px2 * px2 + py2 * py2 < mr * mr;
  }
  function damageZombie(S, z, nx, ny, ix, iy, dano, knock) {
    const def = S.D.INIMIGOS[z.tipo], VW = S.D.TELA.w, F = S.F, k = knock == null ? 1 : knock;
    z.hp -= dano == null ? S.arma.dano : dano;
    z.flash = 0.08;
    z.slowT = 0.25;
    z.kvx += nx * def.knock * k; z.kvy += ny * def.knock * k;
    burst(S, ix, iy, 3, ['#4f8a2c', '#86b450', '#2c4a1c'], 34);
    if (z.hp > 0) return;
    z.dying = 0.0001;
    z.flash = 0;
    S.kills++;
    S.score += def.pts;
    addFloat(S, z.x, z.y - 16, '+' + def.pts, '#e8f5c8', 9);
    burst(S, z.x, z.y - 6, 8, ['#4f8a2c', '#86b450', '#2c4a1c', '#3f6a26'], 46);
    const r = S.rand();
    let ammoChance = 0.15 + (S.reserve < 8 ? 0.15 : 0), cafeChance = 0.06;
    if (S.sf) {
      const fam = familiaDrop(S), dr = S.D.ECONOMIA.drop;
      ammoChance = S.stats.faro[0] + ((S.reservas[fam] || 0) < dr.abaixoDe * S.D.ECONOMIA.municao[fam].max ? dr.municaoFaltando : 0);
      cafeChance = S.stats.faro[1];
    }
    if (r < ammoChance) spawnPickup(S, 'municao', clamp(z.x, 12, VW - 12), clamp(z.y, 44, F.varanda - 4));
    else if (S.hearts < S.stats.vidas && r < ammoChance + cafeChance) spawnPickup(S, 'cafe', clamp(z.x, 12, VW - 12), clamp(z.y, 44, F.varanda - 4));
    if (S.sf) soltarPequis(S, z, def);
    const gen = S.generation;
    emit(S, 'hit', { tipo: z.tipo, pontos: def.pts, total: S.sf ? 0 : S.score, abates: S.kills });
    if (S.alive && gen === S.generation) checkRecord(S);
  }
  function hurtPlayer(S, z) {
    const colete = S.colete > 0;
    if (colete) S.colete--;
    else S.hearts = Math.max(0, S.hearts - 1);
    S.player.invuln = S.stats.invuln;
    S.shakeT = S.reduced ? 0 : 0.28;
    S.hurtFx = 0.6;
    S.zombies.forEach(function (o) {
      if (o.dying) return;
      const dx = o.x - S.player.x, dy = o.y - S.player.y, d = Math.sqrt(dx * dx + dy * dy) || 1;
      if (d < 26) { o.kvx += dx / d * 150; o.kvy += dy / d * 150; o.slowT = 0.5; }
    });
    S.fx.announce(colete ? 'O colete segurou a mordida!' : S.hearts > 0 ? 'Mordida! ' + S.hearts + (S.hearts === 1 ? ' coração.' : ' corações.') : 'Mordida!');
    const gen = S.generation;
    emit(S, 'hurt', colete ? { vidas: S.hearts, colete: true } : { vidas: S.hearts });
    if (gen !== S.generation || !S.alive) return;
    if (S.hearts <= 0 && S.state === 'playing') gameOver(S);
  }
  function collect(S, p) {
    if (p.tipo === 'pequi') {
      S.pq.partida += p.valor;
      S.fx.creditar(p.valor);
      addFloat(S, p.x, p.y - 8, '+' + p.valor, '#ffd84a', 8);
      emit(S, 'coin', { valor: p.valor });
      return;
    }
    if (p.tipo === 'municao') {
      if (S.sf) {
        const fam = p.fam || 'balas', M = S.D.ECONOMIA.municao[fam], atual = S.reservas[fam] || 0;
        if (atual >= M.max) {
          const pq = Math.round(M.preco * S.D.ECONOMIA.caixaCheia);
          S.pq.partida += pq; S.fx.creditar(pq);
          addFloat(S, p.x, p.y - 10, 'RESERVA CHEIA +' + pq + ' PEQUIS', '#ffd84a', 9);
        } else {
          S.reservas[fam] = Math.min(M.max, atual + M.caixa);
          addFloat(S, p.x, p.y - 10, 'MUNIÇÃO +' + (S.reservas[fam] - atual), '#ffe27a', 9);
        }
      } else {
        S.reserve += S.arma.caixa;
        addFloat(S, p.x, p.y - 10, 'MUNIÇÃO +' + S.arma.caixa, '#ffe27a', 9);
      }
    } else if (S.hearts < S.stats.vidas) {
      S.hearts++;
      addFloat(S, p.x, p.y - 10, 'CAFEZINHO! +1 VIDA', '#ffb59a', 9);
    } else {
      S.score += 25;
      addFloat(S, p.x, p.y - 10, 'CAFEZINHO +25', '#ffb59a', 9);
      checkRecord(S);
    }
    emit(S, 'pickup', { tipo: p.tipo, vidas: S.hearts, reserva: S.reserve, total: S.sf ? 0 : S.score });
    if (S.mag === 0 && S.reserve > 0 && S.reloadT <= 0) startReload(S);
  }
  function emPartida(S) { return S.state === 'playing' || (S.state === 'shop' && S.lojaVolta === 'playing'); }
  function perfil(S, p) {
    S.perfil = perfilDe(p);
    if (!emPartida(S)) { montarArsenal(S); S.hearts = S.stats.vidas; }
  }
  function modo(S, m) {
    if (emPartida(S)) return false;
    flushRecord(S);
    S.modo = m === 'semfim' ? 'semfim' : 'pura';
    S.sf = S.modo === 'semfim';
    montarArsenal(S);
    S.hearts = S.stats.vidas;
    S.best = S.fx.lerRecorde(S.modo); S.bestAtStart = S.best;
    return true;
  }
  function abrirLoja(S) {
    if (S.state === 'shop') return false;
    if (S.state === 'playing' && (!S.sf || S.paused || S.breakT <= 0)) return false;
    S.lojaVolta = S.state;
    S.state = 'shop';
    releaseAll(S);
    return true;
  }
  function fecharLoja(S) {
    if (S.state !== 'shop') return false;
    S.state = S.lojaVolta || 'title';
    S.lojaVolta = null;
    return true;
  }
  function resumoLoja(S) {
    if (S.state !== 'shop' || S.lojaVolta !== 'playing') return null;
    return { emMaos: S.arma.id, vidas: S.hearts, vidasMax: S.stats.vidas, reservas: Object.assign({}, S.reservas), fase: 1,
      cafe: { partida: S.compras.cafe.partida, pausa: S.compras.cafe.pausa },
      colete: { partida: S.compras.colete.partida, pausa: S.compras.colete.pausa, guardado: S.colete } };
  }
  function foto(S) {
    const armas = {};
    Object.keys(S.armas).forEach(function (id) { armas[id] = { def: S.armas[id].def, pente: S.armas[id].pente }; });
    return { hearts: S.hearts, colete: S.colete, slots: S.slots.slice(), armas: armas, reservas: Object.assign({}, S.reservas),
      arma: S.arma.id, anterior: S.armaAnterior, stats: S.stats, perfil: JSON.parse(JSON.stringify(S.perfil)),
      compras: JSON.parse(JSON.stringify(S.compras)), aviso: S.aviso, linha: S.linhaArmasT };
  }
  function voltar(S, f) {
    S.hearts = f.hearts; S.colete = f.colete; S.slots = f.slots; S.armas = f.armas; S.reservas = f.reservas;
    S.arma = S.armas[f.arma].def; S.armaAnterior = f.anterior; S.stats = f.stats; S.perfil = f.perfil;
    S.compras = f.compras; S.aviso = f.aviso; S.linhaArmasT = f.linha;
  }
  function comprou(S, compra, perfilNovo) {
    S.perfil = perfilDe(perfilNovo);
    if (!emPartida(S)) { montarArsenal(S); S.hearts = S.stats.vidas; return; }
    const vidasAntes = S.stats.vidas;
    S.stats = calcStats(S);
    S.slots.forEach(function (id) { S.armas[id].def = efetiva(S, id); });
    if (compra.tipo === 'arma' && S.D.ARMAS[compra.chave] && !S.armas[compra.chave]) {
      const a = ganharArma(S, compra.chave), f = a.def.municao;
      if (f) S.reservas[f] = Math.min(S.D.ECONOMIA.municao[f].max, (S.reservas[f] || 0) + S.D.ECONOMIA.municao[f].caixa);
      S.linhaArmasT = 6;
      S.aviso = { texto: 'NOVA: ' + a.def.nome.toUpperCase() + '. ' + (S.entrada.touchMode ? 'TOQUE EM ARMA' : 'TECLA ' + a.def.tecla), t: 0, life: 3 };
    }
    S.arma = S.armas[S.arma.id].def;
    if (S.stats.vidas > vidasAntes) S.hearts += S.stats.vidas - vidasAntes;
  }
  function suprimento(S, id, caixas) {
    if (id === 'municao') {
      const M = S.D.ECONOMIA.municao.balas;
      S.reservas.balas = Math.min(M.max, (S.reservas.balas || 0) + caixas * M.caixa);
    } else if (id === 'cafe') {
      S.hearts = Math.min(S.stats.vidas, S.hearts + 1);
      S.compras.cafe.partida++; S.compras.cafe.pausa++;
    } else if (id === 'colete') {
      S.colete++;
      S.compras.colete.partida++; S.compras.colete.pausa++;
    }
  }
  function retrato(S, ext) {
    ext = ext || {};
    const E = S.entrada, P = S.player, mouse = E.mouse, stick = E.stick;
    return {
      estado: S.state, pausado: S.paused, rodando: S.alive && S.state === 'playing' && !S.paused,
      pontos: S.score, onda: S.wave, vidas: S.hearts, abates: S.kills, recorde: S.best, novoRecorde: S.novoRecorde,
      municao: { pente: S.mag, reserva: S.reserve, recarregando: S.reloadT > 0 },
      jogador: { x: +P.x.toFixed(2), y: +P.y.toFixed(2), mira: +(P.aim * 180 / Math.PI).toFixed(1), lanterna: +(P.aimVis * 180 / Math.PI).toFixed(1), andando: P.moving, invulneravel: P.invuln > 0 },
      mira: { modo: S.aimMode, x: +mouse.x.toFixed(2), y: +mouse.y.toFixed(2), dentro: mouse.inside, segurando: mouse.down },
      zumbis: S.zombies.map(function (z) { return { tipo: z.tipo, x: +z.x.toFixed(1), y: +z.y.toFixed(1), vida: z.hp, morrendo: !!z.dying, de: z.from }; }),
      fila: S.queue.length, filaTipos: S.queue.reduce(function (m, t) { m[t] = (m[t] || 0) + 1; return m; }, {}), intervalo: S.breakT > 0, recado: S.banner ? S.banner.title : null,
      coletaveis: S.pickups.map(function (p) { return p.tipo === 'pequi' ? { tipo: p.tipo, x: +p.x.toFixed(1), y: +p.y.toFixed(1), valor: p.valor } : { tipo: p.tipo, x: +p.x.toFixed(1), y: +p.y.toFixed(1) }; }),
      balas: S.bullets.length, tremor: S.shakeT > 0, quadros: ext.quadros || 0, loopAtivo: !!ext.loopAtivo, movimentoReduzido: S.reduced,
      toque: E.touchMode, joystick: stick.id !== null ? { x: +((stick.kx - stick.bx) / 18).toFixed(2), y: +((stick.ky - stick.by) / 18).toFixed(2) } : null,
      tiroToque: E.fireTouch.id !== null,
      canvas: ext.canvas || null
    };
  }
  function retratoS1(S) {
    let chao = 0;
    S.pickups.forEach(function (p) { if (p.tipo === 'pequi') chao += p.valor; });
    return {
      modo: S.modo, fase: S.F.id, arma: S.arma.id, armas: S.slots.slice(),
      pequis: { partida: S.pq.partida, chao: chao },
      colete: S.colete, vidasMax: S.stats.vidas, miraToque: S.miraToque,
      alvo: S.alvo ? S.zombies.indexOf(S.alvo) : -1, golpe: !!S.golpe, troca: S.trocaT > 0
    };
  }
  global.AndreyZumbisNucleo = {
    versao: 2,
    MOVE: MOVE, OVER_GUARD_MS: OVER_GUARD_MS, MIRA: MIRA,
    criar: criar, comecar: comecar, update: update, acao: acao, soltar: soltar, releaseAll: releaseAll,
    startReload: startReload, fireOnce: fireOnce, flushRecord: flushRecord, overReady: overReady, gameOver: gameOver,
    spawnZombie: spawnZombie, spawnPickup: spawnPickup, buildQueue: buildQueue, beginWave: beginWave,
    damageZombie: damageZombie, hurtPlayer: hurtPlayer, retrato: retrato, retratoS1: retratoS1,
    trocar: trocar, trocarTecla: trocarTecla, trocarCiclo: trocarCiclo, alternar: alternar, armaToque: armaToque,
    temMunicao: temMunicao, municaoTotal: municaoTotal,
    perfil: perfil, modo: modo, mira: function (S, m) { S.miraToque = m; S.alvo = null; },
    abrirLoja: abrirLoja, fecharLoja: fecharLoja, resumoLoja: resumoLoja, foto: foto, voltar: voltar,
    comprou: comprou, suprimento: suprimento, emPartida: emPartida
  };
})(typeof window !== 'undefined' ? window : this);
