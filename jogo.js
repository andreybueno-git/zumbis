/*
 * jogo.js — a página sozinha da NOITE DOS ZUMBIS (andreybueno-git.github.io/zumbis/).
 *
 * Liga o motor (zumbis.js) ao som (audio.js) e cuida do que o AndreyOS fazia em volta dele:
 *   - teclado da página inteira repassado ao jogo (o motor não tem listener global);
 *   - celular em pé: tela GIRE O CELULAR com JOGAR EM PÉ, que gira o palco 90° por CSS
 *     (VIRAR troca o sentido); a escolha fica em andreyos.zumbis.opcoes;
 *   - som só depois do primeiro toque ou tecla; no iPhone, audioSession 'playback' e um
 *     <audio> mudo para o interruptor de silêncio não calar o Web Audio;
 *   - tela cheia (botão ou F), mudo (botão ou M), tela acesa enquanto joga;
 *   - voltar do navegador durante a partida pausa em vez de sair;
 *   - ?perf=1 mostra o p95 do intervalo entre quadros.
 * Nada aqui muda regra de jogo: é o jogo de hoje, no link que não muda mais.
 */
(function (global) {
  'use strict';

  var doc = global.document;
  var $ = function (id) { return doc.getElementById(id); };
  var OPCOES = 'andreyos.zumbis.opcoes';
  var SFX = { shot: 'click', hit: 'key', hurt: 'error', wave: 'beep', pickup: 'boot', empty: 'error', gameover: 'off', record: 'win' };

  if (!global.AndreyZumbis) { if (global.__zmbFalha) global.__zmbFalha('Faltou: zumbis.js'); return; }

  function lerOpcoes() {
    try { var o = JSON.parse(global.localStorage.getItem(OPCOES) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return {}; }
  }
  function gravarOpcoes(o) {
    try { global.localStorage.setItem(OPCOES, JSON.stringify(o)); } catch (e) { /* sem armazenamento: vale só nesta visita */ }
  }
  var opcoes = lerOpcoes();

  /* ---------- som ---------- */
  var audio = global.AndreyAudio ? global.AndreyAudio.create({ storageKey: 'andreyos.zumbis.som' }) : null;
  var liberado = false, avisouSilencio = false;
  var mudo = null;
  function liberarSom() {
    if (liberado || !audio) return;
    liberado = true;
    // iPhone: sem isso o Web Audio obedece ao interruptor de silêncio (Safari 16.4 ou mais novo)
    var nav = global.navigator, sessao = false;
    try { if (nav.audioSession) { nav.audioSession.type = 'playback'; sessao = true; } } catch (e) { /* navegador sem audioSession */ }
    var ios = /iP(hone|ad|od)/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
    if (ios && !sessao) try {
      // 0,25 s de silêncio de verdade (no iPhone o volume do <audio> não muda por código)
      mudo = new global.Audio('silencio.wav');
      mudo.loop = true; mudo.setAttribute('playsinline', '');
      var p = mudo.play(); if (p && p.catch) p.catch(function () {});
    } catch (e) { /* reserva opcional */ }
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
  }
  function alternarSom() { if (!audio) return; liberarSom(); audio.toggle(); syncSom(); }

  /* ---------- recado curto na tela ---------- */
  var recadoT = 0;
  function recado(t, ms) {
    var r = $('recado'); r.textContent = t; r.hidden = false;
    global.clearTimeout(recadoT);
    recadoT = global.setTimeout(function () { r.hidden = true; }, ms || 2500);
  }

  /* ---------- tela acesa ---------- */
  var trava = null, soltarT = 0;
  function pedirTela() {
    global.clearTimeout(soltarT);
    if (trava || !global.navigator.wakeLock || doc.hidden) return;
    global.navigator.wakeLock.request('screen').then(function (t) {
      trava = t; t.addEventListener('release', function () { trava = null; });
    }, function () { /* negado: segue sem */ });
  }
  function soltarTelaDepois(ms) {
    global.clearTimeout(soltarT);
    soltarT = global.setTimeout(function () { if (trava) { trava.release().catch(function () {}); trava = null; } }, ms);
  }

  /* ---------- o jogo ---------- */
  var jogando = false, empilhou = false;
  function marcarJogando(v) {
    jogando = v;
    doc.body.setAttribute('data-jogando', v ? '1' : '0');
    if (audio) audio.music(v);
    if (v) pedirTela(); else soltarTelaDepois(60000);
  }
  var api = global.AndreyZumbis.create($('jogo'), {
    escFecha: false,
    onEvent: function (kind, detail) {
      if (audio && SFX[kind]) audio.sfx(SFX[kind]);
      if (kind === 'start' || kind === 'resume') {
        marcarJogando(true);
        if (!empilhou) { empilhou = true; try { global.history.pushState({ zmb: 1 }, ''); } catch (e) { /* sem history */ } }
      } else if (kind === 'pause' || kind === 'gameover') {
        marcarJogando(false);
      }
    }
  });
  var carregando = $('carregando'); if (carregando && carregando.parentNode) carregando.parentNode.removeChild(carregando);
  global.__zmbOk = true;
  global.__zmb = api;          // para os testes da página
  $('barra').hidden = false;
  syncSom();
  api.focus();

  // Voltar do Android, gesto de borda do iPhone ou botão voltar: pausa a partida em vez de sair.
  global.addEventListener('popstate', function () {
    empilhou = false;
    if (api.isRunning()) {
      api.pause();
      empilhou = true;
      try { global.history.pushState({ zmb: 1 }, ''); } catch (e) { /* sem history */ }
    }
  });

  /* ---------- teclado da página inteira ---------- */
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

  /* ---------- tela cheia ---------- */
  var el = doc.documentElement;
  var podeCheia = !!(el.requestFullscreen || el.webkitRequestFullscreen);
  function telaCheia() {
    try {
      if (doc.fullscreenElement || doc.webkitFullscreenElement) { (doc.exitFullscreen || doc.webkitExitFullscreen).call(doc); return; }
      var p = el.requestFullscreen ? el.requestFullscreen({ navigationUI: 'hide' }) : el.webkitRequestFullscreen();
      if (p && p.then) p.then(function () {
        try { if (global.screen.orientation && global.screen.orientation.lock) global.screen.orientation.lock('landscape').catch(function () {}); } catch (e) { /* sem trava */ }
      }, function () {});
    } catch (e) { /* tela cheia negada */ }
  }
  $('b-cheia').hidden = !podeCheia;

  /* ---------- botões ---------- */
  $('b-som').addEventListener('click', function () { alternarSom(); api.focus(); });
  $('b-cheia').addEventListener('click', function () { telaCheia(); api.focus(); });
  $('b-virar').addEventListener('click', function () {
    opcoes.sentido = opcoes.sentido === -1 ? 1 : -1; gravarOpcoes(opcoes); ajustar(); api.focus();
  });
  $('b-empe').addEventListener('click', function () {
    opcoes.emPe = true; gravarOpcoes(opcoes); ajustar(); api.focus();
  });

  /* ---------- deitado, em pé ou girado ---------- */
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
    // girar o aparelho no meio da partida pausa (a mão muda de lugar)
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

  /* ---------- ?perf=1 ---------- */
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
