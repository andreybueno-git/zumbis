// zumbis.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis.js).
(function (global) {
  'use strict';
  const VERSAO = 2;
  const DUP_WINDOW_MS = 8;
  const MAX_BACKING_PX = 4200000;
  const RECORD_KEY = 'andreyos.zumbis.recorde';
  const RODA_MS = 150;
  const BANCADA_TOQUE_MS = 600;
  const CPL_MIN = 1.75;
  const SO_SEM_FIM = { anterior: 1, proxima: 1, bancada: 1, arma1: 1, arma2: 1, arma3: 1, arma4: 1, arma5: 1, arma6: 1, arma7: 1, arma8: 1, arma9: 1 };
  function loadRecord() {
    try {
      const v = parseInt(global.localStorage.getItem(RECORD_KEY), 10);
      return isFinite(v) && v > 0 ? v : 0;
    } catch (e) { return 0; }
  }
  function saveRecord(v) {
    try { global.localStorage.setItem(RECORD_KEY, String(v)); } catch (e) {   }
  }
  function tem(o, k) { return o != null && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k); }
  function now() { return (global.performance && global.performance.now) ? global.performance.now() : Date.now(); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function makeCanvas(w, h) { const c = global.document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function modulos() {
    const M = { 'zumbis-dados.js': global.AndreyZumbisDados, 'zumbis-arte.js': global.AndreyZumbisArte, 'zumbis-save.js': global.AndreyZumbisSave,
      'zumbis-nucleo.js': global.AndreyZumbisNucleo, 'zumbis-cena.js': global.AndreyZumbisCena };
    const nomes = Object.keys(M);
    const falta = nomes.filter(function (k) { return !M[k]; })[0];
    if (falta) throw new Error('NOITE DOS ZUMBIS: faltou o módulo ' + falta + ' (' + nomes.join(', ') + ' vêm antes do zumbis.js).');
    if (global.AndreyZumbisUI) { M['zumbis-ui.js'] = global.AndreyZumbisUI; nomes.push('zumbis-ui.js'); }
    if (global.AndreyZumbisUIBase) { M['zumbis-ui-base.js'] = global.AndreyZumbisUIBase; nomes.push('zumbis-ui-base.js'); }
    if (nomes.some(function (k) { return M[k].versao !== VERSAO; })) {
      throw new Error('NOITE DOS ZUMBIS: os arquivos do jogo são de versões diferentes (motor ' + VERSAO + ', ' + nomes.map(function (k) { return k.replace(/^zumbis-|\.js$/g, '') + ' ' + M[k].versao; }).join(', ') + '). ATUALIZE A PÁGINA.');
    }
    return { D: M['zumbis-dados.js'], Ar: M['zumbis-arte.js'], SV: M['zumbis-save.js'], N: M['zumbis-nucleo.js'], Ce: M['zumbis-cena.js'], UI: M['zumbis-ui.js'] || null };
  }
  const STYLE_ID = 'andrey-zumbis-estilo';
  let styleRefs = 0;
  const CSS = [
    '.zmb{position:relative;display:block;width:100%;height:100%;min-height:240px;aspect-ratio:16/10;box-sizing:border-box;margin:0;padding:0;background:#05070c;color:#f4ead0;font-family:"VT323","Courier New",monospace;-webkit-user-select:none;user-select:none;overflow:hidden}',
    '.zmb *{box-sizing:border-box}',
    '.zmb .zmb-canvas{position:absolute;left:0;top:0;width:100%;height:100%;display:block;margin:0;padding:0;border:0;outline:none;cursor:crosshair;touch-action:none;-webkit-tap-highlight-color:transparent}',
    '.zmb .zmb-canvas:focus-visible{outline:2px solid #ffd36e;outline-offset:-2px}',
    '.zmb .zmb-sr{position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}'
  ].join('\n');
  function addStyle() {
    styleRefs++;
    if (!global.document.getElementById(STYLE_ID)) {
      const s = global.document.createElement('style');
      s.id = STYLE_ID;
      s.textContent = CSS;
      (global.document.head || global.document.documentElement).appendChild(s);
    }
  }
  function removeStyle() {
    styleRefs = Math.max(0, styleRefs - 1);
    if (styleRefs === 0) {
      const s = global.document.getElementById(STYLE_ID);
      if (s && s.parentNode) s.parentNode.removeChild(s);
    }
  }
  function actionFor(key) {
    switch (key) {
      case 'ArrowUp': case 'Up': case 'w': case 'W': return 'up';
      case 'ArrowDown': case 'Down': case 's': case 'S': return 'down';
      case 'ArrowLeft': case 'Left': case 'a': case 'A': return 'left';
      case 'ArrowRight': case 'Right': case 'd': case 'D': return 'right';
      case ' ': case 'Spacebar': case 'Space': return 'fire';
      case 'r': case 'R': return 'reload';
      case 'p': case 'P': return 'pause';
      case 'Escape': case 'Esc': return 'esc';
      case 'Enter': return 'enter';
      case 'q': case 'Q': return 'anterior';
      case 'e': case 'E': return 'proxima';
      case 'b': case 'B': return 'bancada';
      default: return /^[1-9]$/.test(key) ? 'arma' + key : null;
    }
  }
  function actionForCode(code) {
    switch (code) {
      case 'KeyW': return 'up';
      case 'KeyA': return 'left';
      case 'KeyS': return 'down';
      case 'KeyD': return 'right';
      case 'KeyR': return 'reload';
      case 'KeyP': return 'pause';
      default: return null;
    }
  }
  function create(containerEl, opts) {
    if (!containerEl || !containerEl.appendChild) throw new Error('NOITE DOS ZUMBIS: informe o elemento onde o jogo vai morar.');
    opts = opts || {};
    const M = modulos();
    const D = M.D, Arte = M.Ar, N = M.N, SV = M.SV, Cena = M.Ce;
    const UI = opts.ui === false ? null : M.UI;
    let ui = null;
    const VW = D.TELA.w, VH = D.TELA.h;
    const doc = global.document;
    const rand = typeof opts.random === 'function' ? opts.random : Math.random;
    const A = Arte.sprites();
    let relogio = null;
    let manual = false;
    function agora() { return relogio !== null ? relogio : now(); }
    addStyle();
    const root = doc.createElement('div');
    root.className = 'zmb';
    const canvas = doc.createElement('canvas');
    canvas.className = 'zmb-canvas';
    canvas.tabIndex = 0;
    canvas.setAttribute('role', 'application');
    canvas.setAttribute('aria-roledescription', 'jogo');
    canvas.setAttribute('aria-label', 'NOITE DOS ZUMBIS. W A S D ou setas andam, o mouse mira, clique ou espaço atira, R recarrega, P pausa, Enter começa.');
    const sr = doc.createElement('div');
    sr.className = 'zmb-sr';
    sr.setAttribute('aria-live', 'polite');
    root.appendChild(canvas);
    root.appendChild(sr);
    containerEl.appendChild(root);
    const ctx = canvas.getContext('2d');
    if (!ctx) { root.parentNode.removeChild(root); removeStyle(); throw new Error('NOITE DOS ZUMBIS: este navegador não desenha em canvas 2D.'); }
    const buf = makeCanvas(VW, VH), b = buf.getContext('2d');
    const lm = makeCanvas(VW, VH), lc = lm.getContext('2d');
    b.imageSmoothingEnabled = false;
    function abrirSave() {
      return SV.abrir({ armazenamento: function () { return opts.storage || global.localStorage; }, chave: opts.saveKey, agora: function () { return Date.now(); } });
    }
    let P = abrirSave();
    let credito = 0, creditoEm = -1e9;
    function perfilDoSave() { const s = P.ler(); return { arm: s.arm, mel: s.mel, eq: s.eq }; }
    function gravarCredito(forcar) {
      if (credito <= 0) return;
      const t = agora();
      if (!forcar && t - creditoEm < D.ECONOMIA.credito * 1000) return;
      const n = credito;
      credito = 0; creditoEm = t;
      P.creditar(n);
    }
    function saldo() { return P.saldo() + credito; }
    const MIRAS = { auto: 1, assistida35: 1, assistida50: 1, livre: 1 };
    function miraDoModo(modo) { const m = P.opcoes().mira; return tem(MIRAS, m) ? m : modo === 'semfim' ? 'auto' : 'assistida35'; }
    const op0 = P.opcoes();
    let menosMov = op0.menosMovimento === true;
    const mq = global.matchMedia ? global.matchMedia('(prefers-reduced-motion: reduce)') : null;
    const S = N.criar({
      dados: D, fase: 'quintal', modo: opts.modo === 'semfim' ? 'semfim' : 'pura', perfil: perfilDoSave(),
      mira: miraDoModo(opts.modo === 'semfim' ? 'semfim' : 'pura'),
      rand: rand, fxRand: Math.random, agora: agora,
      toque: !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches),
      reduzido: !!(mq && mq.matches) || menosMov,
      fx: {
        emit: emit,
        announce: announce,
        lerRecorde: function (modo) { return modo === 'semfim' ? P.ler().sf[0][1] : loadRecord(); },
        gravarRecorde: function (v, modo) {
          if (modo === 'semfim') P.commit(function (s) { if (v <= s.sf[0][1]) return false; s.sf[0][1] = v; });
          else saveRecord(v);
        },
        creditar: function (n) { credito += n; },
        depoisDoFim: function () { draw(); kick(); }
      }
    });
    const C = Arte.cenario(S.F);
    const E = S.entrada;
    const held = E.held, pulse = E.pulse, mouse = E.mouse, stick = E.stick, fireTouch = E.fireTouch, touchBtn = E.touchBtn;
    let visible = true;
    let frames = 0;
    const dup = { key: null, src: null, t: -1, res: false };
    let raf = 0, lastT = null, rescaleT = 0;
    let L = null;
    const BTN = {
      fire: { x: 226, y: 126, r: 19 },
      reload: { x: 191, y: 141, r: 10 },
      pause: { x: 244, y: 31, r: 9 },
      arma: { x: 191, y: 113, r: 10 },
      bancada: { x: 106, y: 18, w: 44, h: 12 }
    };
    function announce(t) { sr.textContent = t; }
    function emit(kind, detail) {
      if (kind === 'wave' || kind === 'gameover') gravarCredito(true);
      if (kind === 'gameover' && S.sf) fimDaNoite(detail);
      if (kind === 'gameover') loja.novaVisita();
      if (typeof opts.onEvent !== 'function') return;
      try { opts.onEvent(kind, detail); } catch (err) { if (global.console) global.console.warn('[ZUMBIS] onEvent falhou:', err); }
    }
    function fimDaNoite(d) {
      const hoje = new Date(), data = hoje.getFullYear() * 10000 + (hoje.getMonth() + 1) * 100 + hoje.getDate();
      P.commit(function (s) {
        s.est.partidas++; s.est.abates += d.abates; s.est.segundos += Math.round(S.time);
        if (d.pontos > 0) { s.top.push([d.pontos, 0, 'n', data]); s.top.sort(function (a, c) { return c[0] - a[0]; }); s.top = s.top.slice(0, 5); }
      });
    }
    function startGame() {
      maybeRescale();
      if (S.state === 'shop') fecharBancada();
      if (!S.alive) return;
      P.reler();
      N.perfil(S, perfilDoSave());
      if (!N.comecar(S)) return;
      if (!visible || doc.hidden) { pauseGame(!visible ? 'oculto' : 'aba'); return; }
      if (S.state !== 'playing' || S.paused) { draw(); return; }
      draw();
      kick();
    }
    function pauseGame(motivo) {
      if (S.state !== 'playing' || S.paused) return false;
      S.paused = true;
      N.releaseAll(S);
      stop();
      N.flushRecord(S);
      gravarCredito(true);
      announce('Pausado.');
      emit('pause', { motivo: motivo || 'jogador' });
      if (S.alive) draw();
      return true;
    }
    function resumeGame() {
      if (S.state !== 'playing' || !S.paused) return false;
      if (!visible || doc.hidden) return false;
      S.paused = false;
      maybeRescale();
      announce('Continuando.');
      emit('resume', {});
      if (!S.alive || S.state !== 'playing' || S.paused) return true;
      draw();
      kick();
      return true;
    }
    function voltarTitulo() {
      if (!S.alive) return false;
      if (S.state === 'shop' && S.lojaVolta !== 'playing') fecharBancada();
      if (!S.alive || !(S.state === 'over' || (S.state === 'playing' && S.paused))) return false;
      stop();
      N.flushRecord(S);
      gravarCredito(true);
      N.releaseAll(S);
      S.generation++;
      S.state = 'title'; S.paused = false;
      S.zombies = []; S.bullets = []; S.pickups = []; S.decals = []; S.parts = []; S.floats = []; S.queue = [];
      S.banner = null; S.breakT = 0; S.hurtFx = 0; S.shakeT = 0; S.muzzleT = 0; S.golpe = null; S.alvo = null; S.aviso = null;
      P.reler();
      N.perfil(S, perfilDoSave());
      S.best = S.fx.lerRecorde(S.modo); S.bestAtStart = S.best;
      announce('Tela de título.');
      draw();
      return true;
    }
    function togglePause() {
      if (S.state !== 'playing') return false;
      if (S.paused) resumeGame(); else pauseGame('jogador');
      return true;
    }
    function acaoDaTecla(key, code) {
      let a = actionFor(key);
      if (a && SO_SEM_FIM[a] && !S.sf) a = null;
      if (S.sf && code) { const c = actionForCode(code); if (c && N.MOVE[c]) return c; }
      return a || (code ? actionForCode(code) : null);
    }
    function abrirBancada(motivo) {
      if (!S.alive) return false;
      const de = S.state;
      if (!N.abrirLoja(S)) return false;
      stop();
      gravarCredito(true);
      P.reler();
      if (de !== 'over') loja.novaVisita();
      announce('Bancada do Seu Zé.');
      emit('shop', { aberta: true, motivo: motivo || 'api', de: de });
      if (S.alive && !raf) draw();
      return true;
    }
    function fecharBancada() {
      if (!S.alive || !N.fecharLoja(S)) return false;
      loja.novaVisita();
      emit('shop', { aberta: false });
      if (!S.alive) return true;
      draw();
      if (S.state === 'playing' && !S.paused) { if (!visible || doc.hidden) pauseGame(!visible ? 'oculto' : 'aba'); else kick(); }
      return true;
    }
    const loja = SV.ligarBancada({
      D: D, N: N, S: S, prog: function () { return P; }, emit: emit, saldo: saldo,
      gravarCredito: function () { gravarCredito(true); },
      depois: function () { if (S.alive && !raf) draw(); },
      persistir: function () { try { if (global.navigator.storage && global.navigator.storage.persist) global.navigator.storage.persist().catch(function () {}); } catch (err) {   } }
    });
    function bancadaPronta() { return S.sf && S.state === 'playing' && !S.paused && S.breakT > 0 && (S.ondas.pausa - S.breakT) * 1000 >= BANCADA_TOQUE_MS; }
    function ptPorLp() {
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!L || !cw || !ch) return 1;
      let k = L.K * cw / canvas.width;
      try { const r = canvas.getBoundingClientRect(); if (r.width > 0 && r.height > 0) k *= Math.sqrt(r.width * r.height / (cw * ch)); } catch (err) {   }
      return k;
    }
    function naBancada(p) {
      const r = BTN.bancada, m = 22 / ptPorLp();
      return Math.abs(p.x - (r.x + r.w / 2)) <= Math.max(r.w / 2 + 2, m) && Math.abs(p.y - (r.y + r.h / 2)) <= Math.max(r.h / 2 + 2, m);
    }
    function doAction(a, mode) {
      if (S.state === 'shop') {
        if (a === 'esc' || a === 'bancada') { fecharBancada(); return true; }
        return false;
      }
      if (a === 'enter' || (a === 'fire' && S.state !== 'playing')) {
        if (S.state === 'title' || N.overReady(S)) { startGame(); return true; }
        if (S.state === 'playing' && S.paused && a === 'enter') return resumeGame();
        return false;
      }
      if (a === 'pause') return togglePause();
      if (a === 'esc') {
        if (S.state === 'playing' && !S.paused) { pauseGame('jogador'); return true; }
        return false;
      }
      if (S.state !== 'playing' || S.paused) return false;
      if (a === 'bancada') return abrirBancada('tecla');
      return N.acao(S, a, mode);
    }
    function gameKeyLive(a) { return S.state === 'playing' && !S.paused && a !== 'enter' && a !== 'esc' && a !== 'bancada'; }
    function isDuplicate(key, src) {
      const t = agora();
      if (dup.key === key && dup.src !== src && t - dup.t < DUP_WINDOW_MS) { dup.key = null; return true; }
      dup.key = key; dup.src = src; dup.t = t;
      return false;
    }
    function handleKey(key, phase) {
      if (!S.alive) return false;
      if (ui && ui.tecla(key, phase || 'tap', null)) { if (S.alive && !raf) draw(); return true; }
      const a = acaoDaTecla(key, null);
      if (!a) return false;
      if (phase === 'up') { N.soltar(S, a); return gameKeyLive(a); }
      if (isDuplicate(key, 'ext')) return dup.res;
      const used = doAction(a, phase === 'down' ? 'hold' : 'tap');
      dup.res = used;
      if (S.alive && !raf) draw();
      return used;
    }
    function onKeyDown(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (ui && ui.tecla(e.key, 'down', e)) { e.preventDefault(); e.stopPropagation(); if (S.alive && !raf) draw(); return; }
      const a = acaoDaTecla(e.key, e.code);
      if (!a) return;
      let used;
      if (isDuplicate(e.key, 'dom')) used = dup.res;
      else if (e.repeat) {
        used = gameKeyLive(a) || (a === 'pause' && S.state === 'playing');
        if (gameKeyLive(a)) {
          if (N.MOVE[a]) held[a] = true;
          else if (a === 'fire' && !E.fireKey) { E.fireKey = true; E.shotQueued = true; }
        }
      }
      else used = doAction(a, 'hold');
      dup.res = used;
      if (used) { e.preventDefault(); e.stopPropagation(); }
      if (S.alive && !raf) draw();
    }
    function onKeyUp(e) {
      if (ui && ui.tecla(e.key, 'up', e)) { e.preventDefault(); e.stopPropagation(); return; }
      const a = acaoDaTecla(e.key, e.code);
      if (!a) return;
      N.soltar(S, a);
      if (gameKeyLive(a)) e.stopPropagation();
    }
    function onFocusOut(e) {
      if (!e.relatedTarget || !root.contains(e.relatedTarget)) {
        held.up = held.down = held.left = held.right = false;
        E.fireKey = false; mouse.down = false;
      }
    }
    function focusCanvas() {
      try { canvas.focus({ preventScroll: true }); } catch (err) { canvas.focus(); }
    }
    function toGame(e) {
      if (!L) return null;
      const cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1;
      const dx = e.offsetX * canvas.width / cw, dy = e.offsetY * canvas.height / ch;
      if (!isFinite(dx) || !isFinite(dy)) return null;
      return { x: (dx - L.ox) / L.K, y: (dy - L.oy) / L.K };
    }
    function inCircle(p, c, extra) { const dx = p.x - c.x, dy = p.y - c.y, r = c.r + (extra || 0); return dx * dx + dy * dy <= r * r; }
    function onPointerDown(e) {
      const p = toGame(e);
      const isTouch = e.pointerType === 'touch';
      if (isTouch) E.touchMode = true;
      else if (e.pointerType === 'mouse') {
        if (E.touchMode) E.touchMode = false;
        if (p) { mouse.x = p.x; mouse.y = p.y; mouse.inside = true; mouse.t = agora(); }
        if (e.button !== 0 && e.button !== 2) return;
      }
      if (ui && ui.cobre()) { e.preventDefault(); ui.focar(); return; }
      focusCanvas();
      if (S.state === 'shop') { e.preventDefault(); fecharBancada(); return; }
      if (S.state === 'title' || N.overReady(S)) { e.preventDefault(); startGame(); return; }
      if (S.state !== 'playing') return;
      if (S.paused) { e.preventDefault(); resumeGame(); return; }
      e.preventDefault();
      if (!p) return;
      try { canvas.setPointerCapture(e.pointerId); } catch (err) {   }
      if (bancadaPronta() && naBancada(p) && (isTouch || e.button === 0)) { touchBtn.set(e.pointerId, 'bancada'); abrirBancada('botao'); return; }
      if (isTouch) {
        if (inCircle(p, BTN.pause, 3)) { touchBtn.set(e.pointerId, 'pause'); pauseGame('jogador'); return; }
        if (inCircle(p, BTN.reload, 3)) { touchBtn.set(e.pointerId, 'reload'); N.startReload(S); return; }
        if (S.sf && S.slots.length > 1 && inCircle(p, BTN.arma, 3)) { touchBtn.set(e.pointerId, 'arma'); N.armaToque(S, 'inicio'); return; }
        if (p.x < VW / 2) {
          if (stick.id === null) {
            stick.id = e.pointerId;
            stick.bx = clamp(p.x, 22, VW / 2 - 22); stick.by = clamp(p.y, 50, VH - 22);
            stick.kx = p.x; stick.ky = p.y;
            clampStick();
          }
        } else if (fireTouch.id === null) {
          fireTouch.id = e.pointerId;
          E.shotQueued = true;
        }
      } else if (e.button === 2) {
        N.startReload(S);
      } else {
        mouse.down = true; mouse.id = e.pointerId;
        E.shotQueued = true;
      }
      if (!raf) draw();
    }
    function clampStick() {
      const dx = stick.kx - stick.bx, dy = stick.ky - stick.by, d = Math.sqrt(dx * dx + dy * dy);
      if (d > 18) { stick.kx = stick.bx + dx / d * 18; stick.ky = stick.by + dy / d * 18; }
    }
    function onPointerMove(e) {
      const p = toGame(e);
      if (!p) return;
      if (e.pointerType === 'touch') {
        if (e.pointerId === stick.id) { stick.kx = p.x; stick.ky = p.y; clampStick(); }
        else if (stick.id === null && p.x < VW / 2 && S.state === 'playing' && !S.paused &&
          e.pointerId !== fireTouch.id && !touchBtn.has(e.pointerId) && (e.buttons === undefined || (e.buttons & 1))) {
          stick.id = e.pointerId;
          stick.bx = clamp(p.x, 22, VW / 2 - 22); stick.by = clamp(p.y, 50, VH - 22);
          stick.kx = p.x; stick.ky = p.y;
          clampStick();
          try { canvas.setPointerCapture(e.pointerId); } catch (err) {   }
        }
        return;
      }
      if (e.pointerType === 'mouse' && E.touchMode) return;
      mouse.x = p.x; mouse.y = p.y; mouse.inside = true; mouse.t = agora();
    }
    function onPointerUp(e) {
      if (e.pointerId === stick.id) stick.id = null;
      if (e.pointerId === fireTouch.id) fireTouch.id = null;
      if (e.pointerId === mouse.id) { mouse.down = false; mouse.id = null; }
      if (touchBtn.get(e.pointerId) === 'arma') { if (e.type === 'pointercancel') E.armaToque = null; else N.armaToque(S, 'fim'); }
      touchBtn.delete(e.pointerId);
    }
    function onPointerLeave(e) {
      if (e.pointerType === 'mouse' && !mouse.down) { mouse.inside = false; if (!raf) draw(); }
    }
    function onContextMenu(e) { e.preventDefault(); }
    let rodaEm = -1e9;
    function onWheel(e) {
      if (!S.sf || S.state !== 'playing' || S.paused || !e.deltaY) return;
      e.preventDefault();
      const t = agora();
      if (t - rodaEm < RODA_MS) return;
      rodaEm = t;
      N.trocarCiclo(S, e.deltaY > 0 ? 1 : -1);
      if (S.alive && !raf) draw();
    }
    function onPageHide() { gravarCredito(true); N.flushRecord(S); }
    function needsFrames() {
      if (!S.alive || !visible || doc.hidden) return false;
      if (S.state === 'playing' && !S.paused) return true;
      if (S.state === 'over' && S.overT < 1) return true;
      return false;
    }
    function kick() {
      if (!manual && !raf && needsFrames()) { lastT = null; raf = global.requestAnimationFrame(frame); }
    }
    function stop() {
      if (raf) global.cancelAnimationFrame(raf);
      raf = 0; lastT = null;
    }
    function frame(ts) {
      raf = 0;
      if (!S.alive) return;
      const dt = lastT === null ? 0 : Math.min(0.05, Math.max(0, (ts - lastT) / 1000));
      lastT = ts;
      frames++;
      N.update(S, dt);
      if (!S.alive) return;
      gravarCredito(false);
      rescaleT += dt;
      if (rescaleT > 0.5) { rescaleT = 0; maybeRescale(); }
      draw();
      if (!raf && needsFrames()) raf = global.requestAnimationFrame(frame);
      else if (!raf) lastT = null;
    }
    function projecao() {
      let proj = 1;
      try {
        const r = root.getBoundingClientRect();
        const ow = root.offsetWidth, oh = root.offsetHeight;
        if (ow > 0 && oh > 0 && r.width > 0 && r.height > 0 && isFinite(r.width)) proj = Math.sqrt((r.width * r.height) / (ow * oh));
      } catch (err) { proj = 1; }
      return clamp(proj, 0.5, 2.5);
    }
    function backingRatio() { return clamp((global.devicePixelRatio || 1) * projecao(), 1, 3); }
    function relayout() {
      const cw = canvas.clientWidth, ch = canvas.clientHeight;
      if (!cw || !ch) { L = null; return; }
      const Sraw = backingRatio();
      let Sc = Sraw;
      if (cw * ch * Sc * Sc > MAX_BACKING_PX) Sc = Math.max(1, Math.sqrt(MAX_BACKING_PX / (cw * ch)));
      const W = Math.max(1, Math.round(cw * Sc)), H = Math.max(1, Math.round(ch * Sc));
      if (canvas.width !== W) canvas.width = W;
      if (canvas.height !== H) canvas.height = H;
      const cabe = Math.min(W / VW, H / VH);
      let K = Math.floor(cabe);
      if (K < 1) K = cabe;
      else if (K * (cw / W) * projecao() < CPL_MIN - 1e-6) K = cabe;
      const gw = Math.round(VW * K), gh = Math.round(VH * K);
      L = { S: Sc, Sraw: Sraw, W: W, H: H, K: K, gw: gw, gh: gh, ox: Math.floor((W - gw) / 2), oy: Math.floor((H - gh) / 2) };
      ctx.imageSmoothingEnabled = false;
    }
    function maybeRescale() {
      if (!L) { relayout(); return; }
      const Sr = backingRatio();
      if (Math.abs(Sr - L.Sraw) / L.Sraw > 0.12) relayout();
    }
    const cena = Cena.criar({ S: S, A: A, C: C, Arte: Arte, b: b, lc: lc, lm: lm, ctx: ctx, N: N, BTN: BTN, escFecha: opts.escFecha,
      agora: agora, saldo: saldo, bancadaPronta: bancadaPronta, temLaco: function () { return !!raf; }, redesenhar: function () { draw(); },
      ui: function () { return ui ? ui.cobre() : null; } });
    const drawWorld = cena.desenhar, DEMO = cena.DEMO;
    const noTitulo = cena.noTitulo;
    function draw() {
      if (!S.alive) return;
      if (!L) relayout();
      if (!L) return;
      if (ui) ui.sync(L);
      drawWorld(noTitulo() ? DEMO : null);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#05070c';
      if (L.oy > 0) { ctx.fillRect(0, 0, L.W, L.oy); ctx.fillRect(0, L.oy + L.gh, L.W, L.H - L.oy - L.gh); }
      if (L.ox > 0) { ctx.fillRect(0, 0, L.ox, L.H); ctx.fillRect(L.ox + L.gw, 0, L.W - L.ox - L.gw, L.H); }
      ctx.drawImage(buf, 0, 0, VW, VH, L.ox, L.oy, L.gw, L.gh);
      cena.telas(L);
    }
    root.addEventListener('keydown', onKeyDown);
    root.addEventListener('keyup', onKeyUp);
    root.addEventListener('focusout', onFocusOut);
    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);
    canvas.addEventListener('lostpointercapture', onPointerUp);
    canvas.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('contextmenu', onContextMenu);
    canvas.addEventListener('wheel', onWheel, { passive: false });
    global.addEventListener('pagehide', onPageHide);
    function onStorage(e) {
      if (!S.alive || !e || (e.key !== null && e.key !== (opts.saveKey || SV.CHAVES.save))) return;
      if (S.state === 'playing' && !S.paused) return;
      if (!P.reler()) return;
      if (S.state === 'title') N.perfil(S, perfilDoSave());
      if (ui) ui.mudouSave();
      if (!raf) draw();
    }
    global.addEventListener('storage', onStorage);
    function onVisibility() {
      if (doc.hidden) { pauseGame('aba'); N.flushRecord(S); gravarCredito(true); stop(); }
      else if (S.alive) { draw(); kick(); }
    }
    doc.addEventListener('visibilitychange', onVisibility);
    function onMotionChange() {
      S.reduced = !!(mq && mq.matches) || menosMov;
      if (S.reduced) { S.shakeT = 0; S.overT = 1; }
      if (!raf) draw();
    }
    if (mq) {
      try { mq.addEventListener('change', onMotionChange); } catch (err) { try { mq.addListener(onMotionChange); } catch (err2) {   } }
    }
    let ro = null;
    function onResize() { relayout(); draw(); }
    let dprMq = null;
    function unwatchDpr() {
      if (!dprMq) return;
      try { dprMq.m.removeEventListener('change', dprMq.h); } catch (err) { try { dprMq.m.removeListener(dprMq.h); } catch (err2) {   } }
      dprMq = null;
    }
    function watchDpr() {
      unwatchDpr();
      if (!global.matchMedia) return;
      const m = global.matchMedia('(resolution: ' + (global.devicePixelRatio || 1) + 'dppx)');
      const h = function () { if (!S.alive) return; onResize(); watchDpr(); };
      try { m.addEventListener('change', h); } catch (err) { try { m.addListener(h); } catch (err2) { return; } }
      dprMq = { m: m, h: h };
    }
    watchDpr();
    if (typeof global.ResizeObserver === 'function') {
      ro = new global.ResizeObserver(onResize);
      ro.observe(root);
    } else {
      global.addEventListener('resize', onResize);
    }
    function onFonts() { if (S.alive && !raf) draw(); }
    try {
      if (doc.fonts) {
        if (doc.fonts.load) doc.fonts.load('20px "VT323"').then(onFonts, function () {});
        if (doc.fonts.ready) doc.fonts.ready.then(onFonts, function () {});
        if (doc.fonts.addEventListener) doc.fonts.addEventListener('loadingdone', onFonts);
      }
    } catch (err) {   }
    relayout();
    draw();
    const api = {
      el: root,
      start: function () { if (S.alive) startGame(); },
      pause: function () { return S.alive ? pauseGame('api') : false; },
      resume: function () { return S.alive ? resumeGame() : false; },
      isRunning: function () { return S.alive && S.state === 'playing' && !S.paused; },
      handleKey: handleKey,
      setVisible: function (v) {
        if (!S.alive) return;
        visible = !!v;
        if (!visible) { pauseGame('oculto'); N.releaseAll(S); stop(); }
        else { relayout(); draw(); kick(); }
      },
      focus: function () { if (S.alive && !(ui && ui.focar())) focusCanvas(); },
      titulo: voltarTitulo,
      ui: null,
      getState: function () {
        const st = N.retrato(S, {
          quadros: frames, loopAtivo: !!raf,
          canvas: { largura: canvas.width, altura: canvas.height, cssLargura: canvas.clientWidth, cssAltura: canvas.clientHeight, fator: L ? L.K : 0, escala: L ? +L.S.toFixed(3) : 0, ox: L ? L.ox : 0, oy: L ? L.oy : 0 }
        });
        const s1 = N.retratoS1(S);
        s1.pequis.saldo = saldo();
        s1.salvamento = P.estado();
        s1.bancada = S.state === 'shop';
        Object.keys(s1).forEach(function (k) { st[k] = s1[k]; });
        return st;
      },
      bancada: {
        abrir: function () { return abrirBancada('api'); },
        fechar: function () { return fecharBancada(); },
        aberta: function () { return S.state === 'shop'; },
        saldo: saldo,
        catalogo: loja.catalogo,
        comprar: loja.comprar,
        desfazer: loja.desfazer,
        equipar: loja.equipar
      },
      modo: function (m) {
        if (m === undefined) return S.modo;
        if (!S.alive || !tem(D.MODOS, m) || N.emPartida(S)) return false;
        N.perfil(S, perfilDoSave());
        const ok = N.modo(S, m);
        if (ok) N.mira(S, miraDoModo(m));
        if (ok && !raf) draw();
        return ok;
      },
      salvamento: function (acao) {
        if (acao === 'zerar') {
          if (N.emPartida(S) || !P.zerar()) return false;
          N.perfil(S, perfilDoSave());
          S.best = S.fx.lerRecorde(S.modo);
          if (!raf) draw();
        }
        return P.estado();
      },
      backup: {
        exportar: function () { gravarCredito(true); return P.exportar(); },
        ler: function (codigo) { return SV.lerBackup(codigo); },
        restaurar: function (codigo) {
          if (N.emPartida(S) || !P.restaurar(codigo)) return false;
          N.perfil(S, perfilDoSave());
          if (!raf) draw();
          return true;
        }
      },
      opcoes: function (patch) {
        if (patch && typeof patch === 'object') {
          if (patch.mira !== undefined && !tem(MIRAS, patch.mira)) return false;
          P.mudarOpcoes(patch);
          if (patch.mira) N.mira(S, patch.mira);
          if (patch.menosMovimento !== undefined) { menosMov = patch.menosMovimento === true; onMotionChange(); }
        }
        return P.opcoes();
      },
      _teste: {
        zumbi: function (tipo, x, y) { if (!S.alive || !D.INIMIGOS[tipo]) return null; const z = N.spawnZombie(S, tipo, x, y, true); z.dir = 'down'; if (!raf) draw(); return S.zombies.length - 1; },
        coletavel: function (tipo, x, y, valor) {
          if (!S.alive) return null;
          const p = N.spawnPickup(S, tipo === 'cafe' || tipo === 'pequi' ? tipo : 'municao', x, y);
          if (tipo === 'pequi') p.valor = valor || 1;
          if (!raf) draw();
          return S.pickups.length;
        },
        limpar: function () { S.zombies = []; S.queue = []; S.bullets = []; S.pickups = []; if (!raf) draw(); },
        congelar: function (v) { S.frozen = !!v; },
        jogador: function (x, y) { S.player.x = x; S.player.y = y; if (!raf) draw(); },
        municao: function (p, r) { S.mag = p; S.reserve = r; S.reloadT = 0; },
        vidas: function (n) { S.hearts = n; },
        fase: function () { return S.F.id; },
        arma: function (id) {
          if (id === undefined) return S.arma.id;
          if (!D.ARMAS[id] || !S.alive) return null;
          if (!S.armas[id]) {
            const p = perfilDoSave();
            p.arm[D.ARMAS[id].tecla - 1] = Math.max(0, p.arm[D.ARMAS[id].tecla - 1]);
            N.comprou(S, { tipo: 'arma', chave: id }, p);
          }
          N.trocar(S, id, 'teste');
          S.trocaT = 0;
          if (!raf) draw();
          return S.arma.id;
        },
        pequis: function (n) {
          if (n !== undefined) { gravarCredito(true); P.commit(function (s) { s.ganho = s.gasto + Math.max(0, Math.floor(n)); }); if (!raf) draw(); }
          const r = N.retratoS1(S).pequis;
          return { partida: r.partida, chao: r.chao, saldo: saldo() };
        },
        onda: function (n) { if (S.state !== 'playing') return false; S.zombies = []; N.beginWave(S, n); if (!raf) draw(); return S.wave; },
        gravarAgora: function () { gravarCredito(true); return P.estado(); },
        loja: { comprar: loja.comprar, catalogo: loja.catalogo },
        save: {
          ler: function () { return P.ler(); },
          estado: function () { return P.estado(); },
          escrever: function (v) {
            const st = opts.storage || global.localStorage;
            st.setItem(opts.saveKey || SV.CHAVES.save, typeof v === 'string' ? v : JSON.stringify(v));
            return api._teste.save.reabrir();
          },
          limpar: function () {
            const st = opts.storage || global.localStorage, k = opts.saveKey || SV.CHAVES.save;
            [k, k + '.bak', k + '.corrompido'].forEach(function (c) { st.removeItem(c); });
            return api._teste.save.reabrir();
          },
          reabrir: function () {
            credito = 0;
            P = abrirSave();
            if (!N.emPartida(S)) { N.perfil(S, perfilDoSave()); S.best = S.fx.lerRecorde(S.modo); S.bestAtStart = S.best; }
            if (!raf) draw();
            return P.estado();
          }
        },
        avancar: function (s, dt, aCada) {
          if (!S.alive) return null;
          dt = dt > 0 ? dt : 1 / 60;
          manual = true;
          stop();
          if (relogio === null) relogio = now();
          const n = Math.round(s / dt);
          for (let i = 0; i < n && S.alive; i++) {
            if (aCada) aCada(i, i * dt);
            relogio += dt * 1000;
            N.update(S, dt);
            gravarCredito(false);
          }
          if (S.alive) draw();
          return api.getState();
        },
        tempoReal: function () { manual = false; relogio = null; if (S.alive) kick(); },
        efeitos: function (fn) { S.fxRand = typeof fn === 'function' ? fn : Math.random; },
        hashBg: function () { return Arte.hashCanvas(C.bg); },
        hashQuadro: function () { if (!S.alive) return null; drawWorld(noTitulo() ? DEMO : null); return Arte.hashCanvas(buf); },
        hashTela: function () { if (!S.alive) return null; draw(); return Arte.hashCanvas(canvas); },
        hashArte: function () {
          const out = {}, h = Arte.hashCanvas;
          ['player', 'normal', 'corredor', 'grandao'].forEach(function (k) {
            const set = A[k];
            ['down', 'up', 'right', 'left'].forEach(function (d) {
              set[d].forEach(function (c, i) { out[k + '.' + d + '.' + i] = h(c); out[k + '.' + d + '.' + i + '.branco'] = h(set.white[d][i]); });
            });
            out[k + '.olhos'] = JSON.stringify(set.eyes);
          });
          ['ammo', 'coffee', 'heart', 'heartOff', 'bullet', 'bulletOff', 'puddle'].forEach(function (k) { out[k] = h(A[k]); });
          ['pequi', 'poste', 'cupim', 'toco'].forEach(function (k) { out[k] = h(A.obst[k].spr); });
          out.bg = h(C.bg); out.sky = h(C.sky); out.lampLight = h(C.luzes[0]);
          out.aura = h(A.aura); out.itemGlow = h(A.itemGlow); out.flash = h(A.flash); out.ambient = h(C.ambient);
          return out;
        },
        pontoCss: function (x, y) {
          if (!L) return null;
          const k = canvas.clientWidth / canvas.width;
          return { x: (L.ox + x * L.K) * k, y: (L.oy + y * L.K) * (canvas.clientHeight / canvas.height) };
        }
      },
      dispose: function () {
        if (!S.alive) return;
        S.recordDirty = true;
        N.flushRecord(S);
        gravarCredito(true);
        S.alive = false;
        S.generation++;
        stop();
        N.releaseAll(S);
        canvas.removeEventListener('wheel', onWheel, { passive: false });
        global.removeEventListener('pagehide', onPageHide);
        global.removeEventListener('storage', onStorage);
        root.removeEventListener('keydown', onKeyDown);
        root.removeEventListener('keyup', onKeyUp);
        root.removeEventListener('focusout', onFocusOut);
        canvas.removeEventListener('pointerdown', onPointerDown);
        canvas.removeEventListener('pointermove', onPointerMove);
        canvas.removeEventListener('pointerup', onPointerUp);
        canvas.removeEventListener('pointercancel', onPointerUp);
        canvas.removeEventListener('lostpointercapture', onPointerUp);
        canvas.removeEventListener('pointerleave', onPointerLeave);
        canvas.removeEventListener('contextmenu', onContextMenu);
        doc.removeEventListener('visibilitychange', onVisibility);
        if (mq) { try { mq.removeEventListener('change', onMotionChange); } catch (err) { try { mq.removeListener(onMotionChange); } catch (err2) {   } } }
        if (ro) ro.disconnect(); else global.removeEventListener('resize', onResize);
        unwatchDpr();
        try { if (doc.fonts && doc.fonts.removeEventListener) doc.fonts.removeEventListener('loadingdone', onFonts); } catch (err) {   }
        if (ui) { ui.dispose(); ui = null; api.ui = null; }
        if (root.parentNode) root.parentNode.removeChild(root);
        removeStyle();
      }
    };
    if (UI) {
      try {
        ui = UI.criar({ api: api, S: S, D: D, N: N, A: A, root: root, canvas: canvas, doc: doc, emit: emit, anunciar: announce,
          focarCanvas: focusCanvas, escFecha: opts.escFecha, host: opts.ui && typeof opts.ui === 'object' ? opts.ui : {},
          recordes: function () { return { pura: loadRecord(), semfim: P.ler().sf[0][1] }; },
          progresso: function () { return P.ler(); },
          toque: function (v) { if (E.touchMode !== v) { E.touchMode = v; if (!raf) draw(); } } });
        api.ui = ui.publica;
      } catch (err) {
        ui = null;
        if (global.console) global.console.warn('[ZUMBIS] os menus em HTML não abriram:', err);
      }
      draw();
    }
    return api;
  }
  global.AndreyZumbis = {
    create: create,
    getRecord: loadRecord,
    RECORD_KEY: RECORD_KEY
  };
})(window);
