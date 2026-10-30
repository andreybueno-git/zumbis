// jogo.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis/jogo.js).
(function (global) {
  'use strict';
  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };
  var OPCOES = 'andreyos.zumbis.opcoes';
  var SFX = { shot: 'click', hit: 'key', hurt: 'error', wave: 'beep', pickup: 'boot', empty: 'error', gameover: 'off', record: 'win',
    coin: 'key', 'switch': 'click', shop: 'beep', buy: 'win', upgrade: 'win', undo: 'click', equip: 'click', deny: 'error' };
  var BASE = global.location.origin + global.location.pathname;
  var VIA_ZAP = /[?&]via=zap\b/.test(global.location.search);
  function instalado() {
    try { return global.matchMedia('(display-mode: standalone)').matches || global.matchMedia('(display-mode: fullscreen)').matches || global.navigator.standalone === true; } catch (e) { return false; }
  }
  if (!global.AndreyZumbis) { if (global.__zmbFalha) global.__zmbFalha('Faltou: zumbis.js'); return; }
  function lerOpcoes() {
    try { var o = JSON.parse(global.localStorage.getItem(OPCOES) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
  }
  function gravarOpcoes(mudou) {
    var o = lerOpcoes();
    Object.keys(mudou).forEach(function (k) { o[k] = mudou[k]; });
    try { global.localStorage.setItem(OPCOES, JSON.stringify(o)); } catch (e) {   }
  }
  var opcoes = lerOpcoes();
  var audio = global.AndreyAudio ? global.AndreyAudio.create({ storageKey: 'andreyos.zumbis.som' }) : null;
  var liberado = false, avisouSilencio = false;
  var mudo = null;
  function liberarSom() {
    if (liberado || !audio) return;
    liberado = true;
    var nav = global.navigator, sessao = false;
    try { if (nav.audioSession) { nav.audioSession.type = 'playback'; sessao = true; } } catch (e) {   }
    var ios = /iP(hone|ad|od)/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    if (ios && !sessao) try {
      mudo = new global.Audio('silencio.wav');
      mudo.loop = true; mudo.setAttribute('playsinline', '');
      var p = mudo.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) {   }
    audio.unlock();
    global.setTimeout(function () {
      var d = audio._debug ? audio._debug() : null;
      if (d && d.on && d.ctx && d.ctx !== 'running' && !avisouSilencio) { avisouSilencio = true; recado('SEM SOM? TIRE O MODO SILENCIOSO', 3000); }
    }, 2000);
  }
  doc.addEventListener('pointerdown', liberarSom, true);
  doc.addEventListener('keydown', liberarSom, true);
  doc.addEventListener('touchend', function () {
    if (!audio || !liberado) return;
    var d = audio._debug ? audio._debug() : null;
    if (d && d.ctx && d.ctx !== 'running') audio.unlock();
  }, true);
  function syncSom() {
    var on = audio ? audio.isOn() : false;
    var b = $('b-som');
    if (!audio) { b.hidden = true; return; }
    b.textContent = on ? 'SOM' : 'SEM SOM';
    b.setAttribute('aria-pressed', String(on));
    b.setAttribute('aria-label', on ? 'Som ligado. Toque para desligar.' : 'Som desligado. Toque para ligar.');
    if (api && api.ui && api.ui.redesenhar) api.ui.redesenhar();
  }
  function alternarSom() { if (!audio) return; liberarSom(); audio.toggle(); syncSom(); }
  var recadoT = 0;
  function recado(t, ms) {
    var r = $('recado'); r.textContent = t; r.hidden = false;
    global.clearTimeout(recadoT);
    recadoT = global.setTimeout(function () { r.hidden = true; }, ms || 2500);
  }
  var trava = null, soltarT = 0;
  function pedirTela() {
    global.clearTimeout(soltarT);
    if (trava || !global.navigator.wakeLock || doc.hidden) return;
    global.navigator.wakeLock.request('screen').then(function (t) {
      trava = t; t.addEventListener('release', function () { trava = null; });
    }, function () {   });
  }
  function soltarTelaDepois(ms) {
    global.clearTimeout(soltarT);
    soltarT = global.setTimeout(function () { if (trava) { trava.release().catch(function () {}); trava = null; } }, ms);
  }
  var jogando = false;
  function marcarJogando(v) {
    jogando = v;
    doc.body.setAttribute('data-jogando', v ? '1' : '0');
    if (audio) audio.music(v);
    if (v) pedirTela(); else soltarTelaDepois(60000);
  }
  var el = doc.documentElement;
  var podeCheia = !!(el.requestFullscreen || el.webkitRequestFullscreen);
  var api = global.AndreyZumbis.create($('jogo'), {
    escFecha: false,
    modo: 'semfim',
    ui: {
      linkBase: BASE, linkLimpo: BASE, faixaZap: VIA_ZAP && !instalado(),
      som: audio ? { alternar: function () { alternarSom(); return audio.isOn(); }, ligado: function () { return audio.isOn(); } } : null,
      telaCheia: podeCheia ? function () { telaCheia(); } : null,
      virar: { disponivel: function () { return doc.body.getAttribute('data-girado') === '1'; }, virar: virar }
    },
    onEvent: function (kind, detail) {
      if (audio && SFX[kind]) audio.sfx(SFX[kind]);
      if (kind === 'ui') {
        if (detail.acao === 'clique' && audio) audio.sfx('click');
        if (detail.acao === 'tela') { doc.body.setAttribute('data-tela', detail.tela || ''); garantirGuarda(); }
      }
      if (kind === 'shop') { if (detail.aberta) soltarTelaDepois(90000); else if (api && api.isRunning()) pedirTela(); garantirGuarda(); }
      if (kind === 'start' || kind === 'resume') {
        marcarJogando(true);
        garantirGuarda();
      } else if (kind === 'pause' || kind === 'gameover') {
        marcarJogando(false);
      }
    }
  });
  var carregando = $('carregando'); if (carregando && carregando.parentNode) carregando.parentNode.removeChild(carregando);
  global.__zmbOk = true;
  global.__zmb = api;
  $('barra').hidden = false;
  syncSom();
  api.focus();
  var empilhou = false;
  function precisaGuarda() {
    if (!api) return false;
    if (api.isRunning()) return true;
    var t = api.ui ? api.ui.tela() : '';
    return !!t && t !== 'titulo';
  }
  function garantirGuarda() {
    if (empilhou || !precisaGuarda()) return;
    empilhou = true;
    try { global.history.pushState({ zmb: 1 }, ''); } catch (e) { empilhou = false; }
  }
  global.addEventListener('popstate', function () {
    empilhou = false;
    if (api.isRunning()) api.pause();
    else if (api.ui) api.ui.voltar();
    garantirGuarda();
  });
  function deFora(e) { return !api.el.contains(e.target) && !(e.target && e.target.tagName === 'BUTTON'); }
  doc.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (!jogando && (e.key === 'f' || e.key === 'F')) { telaCheia(); e.preventDefault(); return; }
    if (e.key === 'm' || e.key === 'M') { alternarSom(); e.preventDefault(); return; }
    if (!deFora(e)) return;
    if (api.handleKey(e.key, 'down')) e.preventDefault();
  });
  doc.addEventListener('keyup', function (e) {
    if (!deFora(e)) return;
    if (api.handleKey(e.key, 'up')) e.preventDefault();
  });
  doc.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  global.addEventListener('blur', function () { if (api.isRunning()) api.pause(); });
  $('palco').addEventListener('pointerdown', function (e) {
    if (e.target && e.target.tagName === 'BUTTON') return;
    api.focus();
  });
  function telaCheia() {
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); return; }
      var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
      if (p && p.then) p.then(function () {
        try { if (global.screen.orientation && global.screen.orientation.lock) global.screen.orientation.lock('landscape').catch(function () {}); } catch (e) {   }
      }, function () {});
    } catch (e) {   }
  }
  $('b-cheia').hidden = !podeCheia;
  $('b-som').addEventListener('click', function () { alternarSom(); api.focus(); });
  $('b-cheia').addEventListener('click', function () { telaCheia(); api.focus(); });
  function virar() { opcoes.sentido = opcoes.sentido === -1 ? 1 : -1; gravarOpcoes({ sentido: opcoes.sentido }); ajustar(); api.focus(); }
  $('b-virar').addEventListener('click', virar);
  $('b-empe').addEventListener('click', function () {
    opcoes.emPe = true; gravarOpcoes({ emPe: true }); ajustar(); api.focus();
  });
  var toque = !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches);
  var palco = $('palco');
  function ajustar() {
    var W = global.innerWidth, H = global.innerHeight;
    var emPe = toque && H > W * 1.05;
    $('gire').hidden = !(emPe && !opcoes.emPe);
    var girado = emPe && !!opcoes.emPe;
    $('b-virar').hidden = !girado;
    if (girado) {
      palco.style.width = H + 'px'; palco.style.height = W + 'px';
      palco.style.transform = opcoes.sentido === -1 ? 'translate(0,' + H + 'px) rotate(-90deg)' : 'translate(' + W + 'px,0) rotate(90deg)';
    } else {
      palco.style.width = ''; palco.style.height = ''; palco.style.transform = '';
    }
    doc.body.setAttribute('data-girado', girado ? '1' : '0');
    if (api.isRunning() && ultimoEmPe !== null && ultimoEmPe !== emPe) api.pause();
    ultimoEmPe = emPe;
  }
  var ultimoEmPe = null;
  global.addEventListener('resize', ajustar);
  global.addEventListener('orientationchange', function () { global.setTimeout(ajustar, 120); });
  ajustar();
  doc.addEventListener('visibilitychange', function () {
    if (audio) audio.setPaused(doc.hidden);
    if (!doc.hidden && jogando) pedirTela();
  });
  try {
    var mr = /(?:^#|&)r=([^&]+)/.exec(global.location.hash);
    if (mr && api.ui) {
      var codigo = mr[1];
      try { codigo = decodeURIComponent(codigo); } catch (e) {   }
      api.ui.oferecerRestauro(codigo, function (ok, motivo) {
        if (motivo === 'naoRestaurou') return;
        try { global.history.replaceState(global.history.state, '', global.location.pathname + global.location.search); } catch (e) {   }
      });
    }
  } catch (e) { if (global.console) global.console.warn('[ZUMBIS] o link de backup não abriu:', e); }
  if (/[?&]perf=1\b/.test(global.location.search)) {
    var box = doc.createElement('div'); box.id = 'perf'; palco.appendChild(box);
    var marcas = [], ult = 0;
    var perf = function (t) {
      if (ult) { marcas.push(t - ult); if (marcas.length > 300) marcas.shift(); }
      ult = t;
      if (marcas.length > 30 && (marcas.length % 15 === 0 || marcas.length === 300)) {
        var s = marcas.slice().sort(function (a, b) { return a - b; });
        var p95 = s[Math.floor(s.length * 0.95)], med = s[Math.floor(s.length / 2)];
        global.__zmbPerf = { p95: p95, mediana: med, amostras: s.length };
        box.textContent = 'p95 ' + p95.toFixed(1) + ' ms · mediana ' + med.toFixed(1) + ' ms';
      }
      global.requestAnimationFrame(perf);
    };
    global.requestAnimationFrame(perf);
  }
})(window);
