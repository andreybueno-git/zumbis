// zumbis-ui.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-ui.js).
(function (global) {
  'use strict';
  const CONFIRMA_MS = 3000;
  const CPL_MIN = 1.75;
  const FONTE_MIN = 9;
  function criar(o) {
    const api = o.api, S = o.S, D = o.D, N = o.N, A = o.A, doc = o.doc, root = o.root, canvas = o.canvas;
    const host = o.host || {};
    const B = global.AndreyZumbisUIBase;
    if (!B || B.versao !== global.AndreyZumbisUI.versao) throw new Error('NOITE DOS ZUMBIS: faltou o módulo zumbis-ui-base.js (vem antes do zumbis-ui.js), ou é de outra versão.');
    const tem = B.tem, esc = B.esc, fmt = B.fmt, maiusc = B.maiusc;
    const MIRAS = B.MIRAS, MIRA_NOME = B.MIRA_NOME, CURTO = B.CURTO, FRASE = B.FRASE, MOTIVO = B.MOTIVO, ROTULO_INDISP = B.ROTULO_INDISP, FRASE_SUP = B.FRASE_SUP;
    const VAGAS = {};
    D.BANCADA.armas.forEach(function (v) { VAGAS[v.id] = v; });
    B.addEstilo(doc);
    const layer = doc.createElement('div');
    layer.className = 'zmb-ui';
    layer.hidden = true;
    layer.innerHTML = '<div class="zmb-cx" data-ref="tela"></div><div class="zmb-cx" data-ref="faixa"></div><div class="zmb-cx" data-ref="dlg" hidden></div>';
    root.appendChild(layer);
    const elTela = layer.querySelector('[data-ref="tela"]'), elFaixa = layer.querySelector('[data-ref="faixa"]'), elDlg = layer.querySelector('[data-ref="dlg"]');
    let vivo = true;
    let tela = '';
    let nivel = 1;
    let aba = 'armas';
    const sel = { armas: null, evoluir: null, suprimentos: null };
    let confirma = null, confirmaT = 0;
    let comprouNaVisita = false, voltarPara = null, trocaFim = 0;
    let dialogo = null;
    let pendente = null;
    let k = 1, kTela = 1, fmin = 0, pequena = false, chaveLayout = '', prontoFim = null, versaoTitulo = '';
    let atual = null;
    const fechadas = {};
    function f(lp) { return Math.max(lp, FONTE_MIN, fmin); }
    function caixa(x, y, w, h) { return 'left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px'; }
    function txt(x, y, w, tam, cor, conteudo, alinha, linhas) {
      return '<p class="zmb-t' + (linhas > 1 ? ' zmb-t2' : '') + '" style="' + caixa(x, y, w, Math.ceil(f(tam) * (linhas || 1) + 1)) + ';font-size:' + f(tam) + 'px;color:' + cor + ';text-align:' + (alinha || 'center') + '">' + conteudo + '</p>';
    }
    function bt(id, x, y, w, h, rotulo, cls, extra) {
      return '<button type="button" class="zmb-b' + (cls ? ' ' + cls : '') + '" data-b="' + id + '" style="' + caixa(x, y, w, h) + ';font-size:' + f(h >= 24 ? 12 : 11) + 'px"' + (extra || '') + '>' + rotulo + '</button>';
    }
    function l2(s) { return '<span class="zmb-l2" style="font-size:' + f(9) + 'px">' + s + '</span>'; }
    function spr(nome, esc2, sil) { return '<canvas data-spr="' + nome + '" data-esc="' + (esc2 || 1) + '"' + (sil ? ' class="zmb-sil"' : '') + '></canvas>'; }
    function pequi() { return '<canvas class="zmb-ic" data-spr="pequi" data-esc="1"></canvas>'; }
    function cadeado() { return '<i class="zmb-cad"></i>'; }
    function pintar(raiz) {
      Array.prototype.forEach.call(raiz.querySelectorAll('canvas[data-spr]'), function (c) {
        const nome = c.getAttribute('data-spr'), e = +c.getAttribute('data-esc') || 1;
        const src = nome === 'pequi' ? A.pequi.hud : A.armas[nome] || A.armas.pistolinha;
        if (!src) return;
        c.width = src.width; c.height = src.height;
        c.style.width = src.width * e + 'px'; c.style.height = src.height * e + 'px';
        const g = c.getContext('2d');
        if (g) { g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0); }
      });
    }
    function emitir(acao, extra) { const d = { acao: acao, tela: tela }; if (extra) Object.keys(extra).forEach(function (x) { d[x] = extra[x]; }); o.emit('ui', d); }
    function falar(t) { o.anunciar(t); }
    function telaDoJogo() {
      if (!S.alive) return '';
      if (S.state === 'shop') return 'bancada';
      if (S.state === 'title') return 'titulo';
      if (S.state === 'over') return 'fim';
      if (S.state === 'playing' && S.paused) return 'pausa';
      return '';
    }
    function sync(L) {
      if (!vivo) return;
      const t = telaDoJogo();
      if (L && canvas.width) {
        const cw = canvas.clientWidth || 1, ch = canvas.clientHeight || 1;
        const sx = cw / canvas.width, sy = ch / canvas.height;
        const nk = L.K * sx, x = L.ox * sx, y = L.oy * sy;
        let proj = 1, torto = false;
        if (t || dialogo) {
          try {
            const r = root.getBoundingClientRect(), ow = root.offsetWidth, oh = root.offsetHeight;
            if (ow > 0 && oh > 0 && r.width > 0 && isFinite(r.width)) { proj = Math.sqrt(r.width * r.height / (ow * oh)); const q = (r.width / r.height) / (ow / oh); torto = Math.abs(q - 1) > 0.005 && Math.abs(q * (ow / oh) * (ow / oh) - 1) > 0.005; }
          } catch (e) { proj = 1; }
        }
        const ch2 = nk.toFixed(4) + ',' + x.toFixed(2) + ',' + y.toFixed(2) + ',' + proj.toFixed(2) + (torto ? 't' : '');
        if (ch2 !== chaveLayout) {
          chaveLayout = ch2;
          k = nk; kTela = nk * proj;
          layer.style.left = x + 'px'; layer.style.top = y + 'px';
          layer.style.transform = 'scale(' + k + ')';
          const kf = Math.max(kTela, CPL_MIN), folga = torto ? 1.04 : 1;
          layer.style.setProperty('--alvo', (44 * folga / kf).toFixed(2) + 'px');
          const nf = Math.ceil(16 / kf - 1e-6), pq = kTela < CPL_MIN - 1e-6;
          if (nf !== fmin || pq !== pequena) { fmin = nf; pequena = pq; if (tela) desenhar(); }
        }
      }
      if (t !== tela) mudar(t);
      else if (t === 'fim' && N.overReady(S) !== prontoFim) desenharFim();
      else if (t === 'titulo' && !dialogo && versaoTitulo !== api.bancada.saldo() + S.modo) desenharTitulo();
    }
    function mudar(t) {
      const tinhaFoco = layer.contains(doc.activeElement);
      const de = tela;
      tela = t;
      nivel = 1; confirma = null; mexeu = false;
      if (t === 'bancada' && de !== 'bancada') { comprouNaVisita = false; voltarPara = de; }
      if (de === 'bancada' && t === 'titulo') atual = { b: comprouNaVisita ? 'semfim' : 'bancada' };
      else if (de === 'bancada' && t === 'fim') atual = { b: 'bancada' };
      else atual = null;
      if (t !== 'titulo' && dialogo && dialogo.tipo === 'restauro') {   pendente = pendente || dialogo.pend; dialogo = null; }
      if (t === 'titulo' && pendente && !dialogo) abrirRestauro(pendente);
      if (!t) dialogo = null;
      desenhar();
      layer.hidden = !t;
      if (t) {
        if (tinhaFoco || root.contains(doc.activeElement)) focarPadrao();
        falar({ titulo: 'Tela de título.', bancada: 'Bancada do Seu Zé. ' + fmt(api.bancada.saldo()) + ' pequis.', pausa: 'Pausado.', fim: 'Fim de jogo.' }[t]);
      } else if (tinhaFoco) o.focarCanvas();
      emitir('tela');
    }
    function desenhar() {
      if (!tela) { elTela.innerHTML = ''; elFaixa.innerHTML = ''; elDlg.hidden = true; return; }
      if (tela === 'titulo') desenharTitulo();
      else if (tela === 'bancada') desenharBancada();
      else if (tela === 'pausa') desenharPausa();
      else if (tela === 'fim') desenharFim();
      desenharFaixa();
      desenharDialogo();
    }
    function acharAtual() {
      if (!atual) return null;
      const raiz = dialogo ? elDlg : layer;
      const q = '[data-b="' + atual.b + '"]' + (atual.id ? '[data-id="' + atual.id + '"]' : '');
      return raiz.querySelector(q);
    }
    function trocarConteudo(el, html) {
      const focoDentro = layer.contains(doc.activeElement);
      el.innerHTML = html;
      pintar(el);
      if (focoDentro && !layer.contains(doc.activeElement)) { const a = acharAtual() || padrao(); if (a) focarEl(a); }
    }
    function desenharTitulo() {
      const r = o.recordes(), saldo = api.bancada.saldo(), cabe = algoCabe();
      versaoTitulo = saldo + S.modo;
      const sub = subtitulo(S.modo);
      const prog = o.progresso(), temProgresso = prog.ganho > 0 || prog.arm.some(function (v, i) { return i > 0 && v >= 0; });
      const guardar = !!host.linkBase && temProgresso;
      let h = '';
      if (host.virar && host.virar.disponivel && host.virar.disponivel()) h += bt('virar', 3, 24, 47, 20, '<span>VIRAR</span>');
      if (host.som) h += bt('som', 204, 24, 49, 20, '<span>' + (host.som.ligado() ? 'SOM' : 'SEM SOM') + '</span>', '', ' aria-pressed="' + !!host.som.ligado() + '"');
      if (typeof host.telaCheia === 'function') h += bt('cheia', 204, 46, 49, 20, '<span style="font-size:' + f(9) + 'px">TELA CHEIA</span>');
      h += txt(8, 66, 240, 9, '#e6dcc4', esc(sub), 'center').replace('<p ', '<p data-ref="sub" ');
      h += bt('pura', 28, 78, 98, 26, '<span>NOITE PURA</span>' + l2(r.pura > 0 ? 'recorde ' + fmt(r.pura) : 'só a Pistolinha'), S.modo === 'pura' ? 'zmb-forte' : '');
      h += bt('semfim', 130, 78, 98, 26, '<span>NOITE SEM FIM</span>' + l2(r.semfim > 0 ? 'recorde ' + fmt(r.semfim) : 'junte pequis'), S.modo === 'semfim' ? 'zmb-forte' : '');
      const xb = guardar ? 56 : 88;
      h += bt('bancada', xb, 108, 80, 22, '<span>BANCADA</span>' + l2(pequi() + fmt(saldo) + ' pequis') + (cabe ? '<b class="zmb-ex" style="font-size:' + f(11) + 'px">!</b>' : ''), '',
        ' aria-label="Bancada do Seu Zé, ' + fmt(saldo) + ' pequis' + (cabe ? ', dá para comprar algo' : '') + '"');
      if (guardar) h += bt('guardar', 140, 108, 60, 22, '<span>GUARDAR</span>' + l2('o progresso'));
      trocarConteudo(elTela, '<section aria-label="Tela de título">' + h + '</section>');
    }
    function subtitulo(m) { return m === 'semfim' ? 'junte pequis e compre armas na Bancada do Seu Zé' : 'só a Pistolinha e o quintal: quanto você aguenta?'; }
    function algoCabe() {
      try {
        const c = api.bancada.catalogo();
        return c.itens.some(function (it) { return it.estado === 'venda' && it.tipo !== 'suprimento'; });
      } catch (e) { return false; }
    }
    function catalogo() { return api.bancada.catalogo(); }
    function itensDaAba(c, a) {
      const its = c.itens.filter(function (it) { return it.aba === a; });
      if (a !== 'armas') return { cartas: its, breve: 0 };
      const v1 = its.filter(function (it) { return VAGAS[it.id.split(':')[1]].versao === 'V1'; });
      return { cartas: v1, breve: its.length - v1.length };
    }
    function selDaAba(c, a) {
      const lst = itensDaAba(c, a).cartas;
      const achou = lst.filter(function (it) { return it.id === sel[a]; })[0];
      if (achou) return achou;
      return lst.filter(function (it) { return it.estado === 'venda'; })[0] || lst.filter(function (it) { return it.estado !== 'emBreve'; })[0] || lst[0] || null;
    }
    function desenharBancada() {
      const c = catalogo();
      const it = selDaAba(c, aba);
      if (it) sel[aba] = it.id;
      let h = '<div class="zmb-cx zmb-fundo"></div>';
      h += bt('voltar', 3, 2, 44, 20, '<span>&lt; VOLTAR</span>');
      h += txt(50, 4, 120, 13, '#ffd36e', 'BANCADA DO SEU ZÉ', 'center');
      h += txt(50, 15, 120, 9, c.salvamento && !c.salvamento.gravavel ? '#ff7a6a' : '#9aa3b2', c.salvamento && !c.salvamento.gravavel ? 'SEM SALVAR: só nesta visita' : 'leva, tá barato. é à vista!', 'center');
      h += '<p class="zmb-t" data-ref="saldo" style="' + caixa(172, 5, 81, 14) + ';font-size:' + f(13) + 'px;color:#ffd84a;text-align:right">' + pequi() + fmt(c.saldo) + '</p>';
      [['armas', 'ARMAS', 3, 48], ['evoluir', 'EVOLUIR', 54, 52], ['suprimentos', 'SUPRIMENTOS', 109, 72]].forEach(function (a) {
        h += bt('aba', a[2], 25, a[3], 22, '<span>' + a[1] + '</span>', aba === a[0] ? 'is-aba' : '', ' data-id="' + a[0] + '" aria-pressed="' + (aba === a[0]) + '"');
      });
      const u = c.desfazer;
      h += bt('desfazer', 186, 25, 67, 22, '<span>DESFAZER</span>' + l2(u ? esc(curto(u.item)) + ' +' + fmt(u.preco) : 'nada a desfazer'), '',
        u ? ' aria-label="Desfazer ' + esc(curto(u.item)) + ', devolve ' + u.preco + ' pequis"' : ' aria-disabled="true"');
      h += '<div class="zmb-cx" data-ref="grade">' + gradeHtml(c) + '</div>';
      h += '<div class="zmb-cx" data-ref="rodape">' + rodapeHtml(c) + '</div>';
      h += '<div class="zmb-cx" data-ref="painel">' + painelHtml(c, it) + '</div>';
      trocarConteudo(elTela, '<section aria-label="Bancada do Seu Zé">' + h + '</section>');
    }
    function curto(id) { const k2 = String(id || '').split(':')[1]; return CURTO[k2] || maiusc(k2); }
    function grade(c) {
      const g = itensDaAba(c, aba), n = g.cartas.length + (g.breve ? 1 : 0);
      const linhas = Math.max(1, Math.ceil(n / 3)), alt = linhas > 2 ? 22 : 34, passo = alt + (linhas > 2 ? 2 : 4);
      return { g: g, alt: alt, passo: passo, fim: 51 + linhas * passo };
    }
    function gradeHtml(c) {
      const G = grade(c);
      let h = '';
      G.g.cartas.forEach(function (it, i) { h += cartaHtml(it, 3 + (i % 3) * 48, 51 + Math.floor(i / 3) * G.passo, 44, G.alt); });
      if (G.g.breve) {
        const i = G.g.cartas.length;
        h += bt('carta', 3 + (i % 3) * 48, 51 + Math.floor(i / 3) * G.passo, 44, G.alt, '<span style="font-size:' + f(14) + 'px">+' + G.g.breve + '</span>' + l2('EM BREVE'), 'is-breve', ' data-id="breve" aria-label="Mais ' + G.g.breve + ' armas, em breve"');
      }
      return h;
    }
    function estadoCurto(it) {
      switch (it.estado) {
        case 'venda': return pequi() + fmt(it.preco);
        case 'semPequis': return cadeado() + pequi() + fmt(it.preco);
        case 'sua': return it.inicial ? 'SUA·INÍCIO' : 'SUA';
        case 'emMaos': return 'EM MÃOS';
        case 'max': return 'MÁXIMO';
        case 'emBreve': return 'EM BREVE';
        default: return tem(ROTULO_INDISP, it.motivo) ? ROTULO_INDISP[it.motivo] : 'AGORA NÃO';
      }
    }
    function degraus(it) { let h = ''; for (let i = 0; i < it.max; i++) h += '<i class="zmb-barra' + (i < it.nivel ? ' is-on' : '') + '"></i>'; return h; }
    function evoluirCurto(it) {
      if (it.estado === 'venda') return degraus(it) + pequi() + fmt(it.preco);
      if (it.estado === 'semPequis') return degraus(it) + cadeado() + fmt(it.preco);
      return it.estado === 'max' ? degraus(it) + 'MÁX' : estadoCurto(it);
    }
    function cartaHtml(it, x, y, w, h) {
      const k2 = it.id.split(':')[1], breve = it.estado === 'emBreve';
      let corpo = '';
      if (it.tipo === 'arma') {
        corpo = '<span class="zmb-tecla" style="font-size:' + f(9) + 'px">' + it.tecla + '</span>' + spr(A.armas[k2] ? k2 : 'pistolinha', 2, breve || !A.armas[k2]);
      } else {
        corpo = '<span style="font-size:' + f(9) + 'px">' + esc(tem(CURTO, k2) ? CURTO[k2] : maiusc(it.nome)) + '</span>';
      }
      const selo = it.selo ? '<i class="zmb-selo" aria-hidden="true"></i>' : '';
      const linha2 = it.tipo === 'arma' || it.tipo === 'suprimento' ? estadoCurto(it) : evoluirCurto(it);
      return bt('carta', x, y, w, h, corpo + l2(linha2) + selo, 'zmb-carta' + (it.id === sel[aba] ? ' is-sel' : '') + (breve ? ' is-breve' : ''),
        ' data-id="' + it.id + '" aria-label="' + esc(it.nome + (it.aba === 'evoluir' && it.max ? ', nível ' + it.nivel + ' de ' + it.max : '') + ': ' + rotuloFalado(it)) + '"');
    }
    function rotuloFalado(it) {
      switch (it.estado) {
        case 'venda': return it.preco + ' pequis';
        case 'semPequis': return 'faltam ' + it.faltam + ' pequis';
        case 'sua': return 'sua';
        case 'emMaos': return 'em mãos';
        case 'max': return 'no máximo';
        case 'emBreve': return 'em breve';
        default: return MOTIVO[it.motivo] || 'indisponível';
      }
    }
    function rodapeHtml(c) {
      const y = grade(c).fim;
      if (y > 136) return '';
      if (comprouNaVisita && host.linkBase) {
        const ios = /iP(hone|ad|od)/.test((global.navigator || {}).userAgent || '');
        return bt('guardar', 3, Math.max(y, 126), 140, 21, '<span>GUARDAR PROGRESSO</span>' + l2(ios ? 'o iPhone pode apagar seu jogo' : 'um link para não perder nada'));
      }
      const it = selDaAba(c, aba);
      const frase = it && it.estado === 'semPequis' ? 'faltam ' + fmt(it.faltam) + ' pequis. capim-dourado não paga.' : it && it.estado === 'venda' ? 'esse cabe nos seus pequis.' : 'pegue pequis na Noite sem fim e volte aqui.';
      return txt(3, Math.max(y + 2, 130), 140, 9, '#9aa3b2', esc(frase), 'left', 2);
    }
    function statsArma(id) {
      const def = D.ARMAS[id];
      if (!def) return null;
      const s = { dano: def.dano, alcance: def.alcance };
      const nv = o.progresso().arm[VAGAS[id].tecla - 1];
      for (let i = 0; i < nv && def.niveis[i]; i++) { const m = def.niveis[i].muda; if (m.dano) s.dano = m.dano; if (m.alcance) s.alcance = m.alcance; }
      return { dano: B.nivelDano(s.dano), alcance: B.nivelAlcance(s.alcance) };
    }
    function painelHtml(c, it) {
      if (!it) return txt(148, 60, 105, 10, '#9aa3b2', 'nada aqui ainda', 'center');
      const k2 = it.id.split(':')[1], x = 148, w = 105, evolui = it.tipo === 'nivel' || it.tipo === 'melhoria';
      let h = '';
      if (it.tipo === 'arma') h += '<div style="position:absolute;' + caixa(x, 51, 36, 13) + ';display:flex;align-items:center">' + spr(A.armas[k2] ? k2 : 'pistolinha', 2, it.estado === 'emBreve' || !A.armas[k2]) + '</div>';
      h += txt(it.tipo === 'arma' ? x + 36 : x, 52, it.tipo === 'arma' ? w - 36 : w, 11, '#ffd36e', esc(maiusc(it.nome)), 'left');
      let l1 = '', l2t = '';
      if (it.tipo === 'arma') {
        l1 = it.estado === 'emBreve' ? 'a noite continua... EM BREVE' : FRASE[k2] || '';
        const st = statsArma(k2), emMaos = c.itens.filter(function (x2) { return x2.tipo === 'arma' && x2.estado === 'emMaos'; })[0];
        const ref = emMaos && emMaos.id !== it.id ? statsArma(emMaos.id.split(':')[1]) : null;
        if (st) {
          h += '<p class="zmb-t" style="' + caixa(x, 75, w, 10) + ';font-size:' + f(9) + 'px;color:#e6dcc4">' + B.barras('DANO', st.dano, ref && ref.dano) + '</p>';
          h += '<p class="zmb-t" style="' + caixa(x, 85, w, 10) + ';font-size:' + f(9) + 'px;color:#e6dcc4">' + B.barras('ALCANCE', st.alcance, ref && ref.alcance) + '</p>';
        }
      } else if (it.tipo === 'suprimento') {
        l1 = it.id === 'sup:municao' && it.caixas ? '+' + it.caixas + ' caixas, -' + fmt(it.preco) + ' pequis' : FRASE_SUP[k2] || '';
        l2t = it.estado === 'indisponivel' ? MOTIVO[it.motivo] || '' : it.antes ? it.antes + ' > ' + it.depois : '';
      } else {
        l1 = 'agora: ' + (it.antes || 'do jeito que veio');
        l2t = it.depois ? 'depois: ' + it.depois : it.estado === 'emBreve' ? 'chega em breve' : 'no máximo';
      }
      if (evolui) {
        h += txt(x, 64, w, 9, '#e6dcc4', esc(l1), 'left', 2);
        if (l2t) h += txt(x, 84, w, 9, '#cfe9a8', esc(l2t), 'left', 2);
      } else {
        h += txt(x, 65, w, 9, '#e6dcc4', esc(l1), 'left');
        if (l2t) h += txt(x, 76, w, 9, '#cfe9a8', esc(l2t), 'left');
      }
      h += primarioHtml(it, x, evolui ? 104 : 96, w, 26);
      if (it.tipo === 'arma' && (it.estado === 'sua' || it.estado === 'emMaos')) {
        const sm = c.itens.filter(function (x2) { return x2.id === 'sup:municao'; })[0];
        const enche = D.ARMAS[k2] && D.ARMAS[k2].municao && sm && sm.motivo !== 'partida' && sm.estado !== 'emBreve';
        if (enche) h += bt('encher', x, 125, 50, 21, '<span>ENCHER</span>' + l2('munição'));
        h += bt('melhorar', enche ? x + 54 : x, 125, enche ? 51 : w, 21, '<span>MELHORAR</span>' + l2('em EVOLUIR'));
      }
      return h;
    }
    function primarioHtml(it, x, y, w, h) {
      const confirmando = confirma && confirma.id === it.id && Date.now() < confirma.ate;
      let rot = '', cls = 'zmb-forte', extra = '';
      switch (it.estado) {
        case 'venda': {
          const verbo = it.tipo === 'arma' ? 'COMPRAR' : it.id === 'sup:municao' ? 'ENCHER' : it.tipo === 'suprimento' ? 'COMPRAR' : 'MELHORAR';
          rot = confirmando ? '<span>CONFIRMAR?</span>' + l2(pequi() + fmt(it.preco) + ' de ' + fmt(api.bancada.saldo())) : '<span>' + verbo + ' ' + pequi() + fmt(it.preco) + '</span>' + (it.selo ? l2('compra do Seu Zé') : '');
          if (confirmando) cls = 'is-confirma';
          extra = ' aria-label="' + (confirmando ? 'Confirmar a compra por ' : verbo.toLowerCase() + ' por ') + it.preco + ' pequis"';
          break;
        }
        case 'semPequis': rot = '<span>' + cadeado() + 'FALTAM ' + fmt(it.faltam) + '</span>'; cls = ''; extra = ' aria-disabled="true" aria-label="Faltam ' + it.faltam + ' pequis"'; break;
        case 'sua': rot = it.tipo === 'arma' ? '<span>USAR</span>' + l2('começa a noite com ela') : '<span>SUA</span>'; break;
        case 'emMaos': rot = '<span>EM MÃOS</span>'; cls = ''; extra = ' aria-disabled="true"'; break;
        case 'max': rot = '<span>' + (it.id === 'sup:municao' ? 'MUNIÇÃO CHEIA' : 'NO MÁXIMO') + '</span>'; cls = ''; extra = ' aria-disabled="true"'; break;
        case 'emBreve': return txt(x, y + 8, w, 11, '#7f8796', 'EM BREVE', 'center');
        default: rot = '<span>' + (tem(ROTULO_INDISP, it.motivo) ? ROTULO_INDISP[it.motivo] : 'AGORA NÃO') + '</span>'; cls = ''; extra = ' aria-disabled="true"';
      }
      return bt('primario', x, y, w, h, rot, cls, ' data-id="' + it.id + '"' + extra);
    }
    function redesenharPainel() {
      const c = catalogo(), it = selDaAba(c, aba);
      const p = elTela.querySelector('[data-ref="painel"]'), g = elTela.querySelector('[data-ref="grade"]');
      if (!p || !g) { desenharBancada(); return; }
      Array.prototype.forEach.call(g.querySelectorAll('[data-b="carta"]'), function (b) { b.classList.toggle('is-sel', b.getAttribute('data-id') === sel[aba]); });
      trocarConteudo(p, painelHtml(c, it));
      const rod = elTela.querySelector('[data-ref="rodape"]');
      if (rod) trocarConteudo(rod, rodapeHtml(c));
    }
    function desenharPausa() {
      let h = '<div class="zmb-cx zmb-fundo" style="background:rgba(5,7,12,' + (nivel === 1 ? '.35' : '.8') + ')"></div>';
      if (nivel === 1) {
        h += txt(0, 18, 256, 24, '#f4ead0', 'PAUSADO', 'center');
        h += txt(0, 44, 256, 10, '#cfe9a8', 'ONDA ' + Math.max(1, S.wave) + '  ·  ' + fmt(S.score) + ' PONTOS' + (S.sf ? '  ·  +' + fmt(S.pq.partida) + ' PEQUIS' : ''), 'center');
        h += bt('continuar', 68, 57, 120, 28, '<span style="font-size:' + f(14) + 'px">CONTINUAR</span>', 'zmb-forte');
        let y = 89;
        if (host.som) { h += bt('som', 68, y, 120, 24, '<span>' + (host.som.ligado() ? 'SOM: LIGADO' : 'SOM: DESLIGADO') + '</span>', '', ' aria-pressed="' + !!host.som.ligado() + '"'); y += 28; }
        h += bt('mais', 68, y, 120, 24, '<span>MAIS...</span>');
        if (!S.entrada.touchMode) h += o.escFecha !== false ? txt(0, y + 30, 256, 9, '#ff9a8a', 'ESC DE NOVO FECHA O ARCADE', 'center') : txt(0, y + 30, 256, 9, '#cfe9a8', 'ESC DE NOVO CONTINUA', 'center');
      } else if (nivel === 2) {
        h += txt(0, 5, 256, 13, '#ffd36e', 'OPÇÕES', 'center');
        const op = api.opcoes() || {};
        const lst = [['mira', '<span>MIRA DO TOQUE</span>' + l2(MIRA_NOME[tem(MIRA_NOME, S.miraToque) ? S.miraToque : 'auto'])],
          ['menos', '<span>MENOS MOVIMENTO</span>' + l2(op.menosMovimento === true ? 'ligado' : S.reduced ? 'ligado pelo aparelho' : 'desligado')]];
        if (typeof host.telaCheia === 'function') lst.push(['cheia', '<span>TELA CHEIA</span>']);
        if (host.virar && host.virar.disponivel && host.virar.disponivel()) lst.push(['virar', '<span>VIRAR A TELA</span>']);
        if (host.linkBase) lst.push(['guardar', '<span>GUARDAR PROGRESSO</span>' + l2('um link para não perder nada')]);
        lst.forEach(function (it, i) { h += bt(it[0], i % 2 ? 130 : 6, 22 + Math.floor(i / 2) * 27, 120, 24, it[1]); });
        h += bt('nivel1', 6, 122, 120, 22, '<span>&lt; VOLTAR</span>');
        h += bt('sair', 130, 122, 120, 22, '<span>SAIR PARA O TÍTULO</span>', 'zmb-perigo');
      } else {
        h += txt(0, 38, 256, 16, '#ffd36e', 'PERDE A TENTATIVA. SAIR?', 'center');
        h += txt(0, 58, 256, 9, '#e6dcc4', S.sf ? 'os pequis que você pegou ficam.' : 'a noite acaba aqui. recorde batido fica salvo.', 'center');
        h += bt('ficar', 60, 76, 64, 26, '<span>FICAR</span>', 'zmb-forte');
        h += bt('sairSim', 132, 76, 64, 26, '<span>SAIR</span>', 'zmb-perigo');
      }
      trocarConteudo(elTela, '<section aria-label="Pausa">' + h + '</section>');
    }
    function desenharFim() {
      prontoFim = N.overReady(S);
      const bts = [['titulo', 'TÍTULO', 40]];
      let selo = null, cabe = false, c = null;
      if (S.sf) {
        c = catalogo();
        cabe = c.itens.some(function (it) { return it.estado === 'venda' && it.tipo !== 'suprimento'; });
        selo = c.selo ? c.itens.filter(function (it) { return it.id === c.selo && it.estado === 'venda'; })[0] : null;
        bts.push(['bancada', 'BANCADA', 50]);
      }
      bts.push(['denovo', 'DE NOVO', 50]);
      const total = bts.reduce(function (s2, b2) { return s2 + b2[2]; }, 0) + (bts.length - 1) * 3;
      const espera = prontoFim ? '' : ' is-espera', inerte = prontoFim ? '' : ' aria-disabled="true"';
      let x = Math.max(58, Math.round(128 - total / 2)), h = '';
      bts.forEach(function (b) {
        const ex = (b[0] === 'bancada' && cabe ? '<b class="zmb-ex" style="font-size:' + f(11) + 'px">!</b>' : '');
        h += bt(b[0], x, 114, b[2], 24, '<span>' + esc(b[1]) + '</span>' + ex, (b[0] === 'denovo' ? 'zmb-forte' : '') + espera, inerte);
        x += b[2] + 3;
      });
      const rot9 = function (t) { return '<span style="font-size:' + f(9) + 'px">' + t + '</span>'; };
      if (c && c.desfazer) h += bt('desfazer', 76, 139, 98, 21, rot9('DESFAZER') + l2(esc(curto(c.desfazer.item)) + ' +' + fmt(c.desfazer.preco)), espera,
        inerte + ' aria-label="Desfazer ' + esc(curto(c.desfazer.item)) + ', devolve ' + c.desfazer.preco + ' pequis"');
      else if (selo) h += bt('selo', 76, 139, 98, 21, rot9('COMPRAR') + l2(esc(curto(selo.id)) + ' · ' + pequi() + fmt(selo.preco)), espera, inerte + ' data-id="' + selo.id + '"');
      trocarConteudo(elTela, '<section aria-label="Fim de jogo">' + h + '</section>');
    }
    function faixaAtual() {
      if (tela !== 'titulo' && tela !== 'fim') return null;
      const sv = api.salvamento() || {};
      if (sv.aviso === 'versaoNova') return { id: 'versao', t1: 'ESTE JOGO É MAIS NOVO', t2: 'recarregue a página.', b: ['recarregar', 'RECARREGAR'] };
      if (sv.aviso === 'corrompido' && sv.estado === 'restaurado' && !fechadas.restaurado) return { id: 'restaurado', t1: 'O SAVE VEIO ESTRAGADO', t2: 'voltei o último progresso bom.', b: ['fecharFaixa', 'OK'] };
      if (sv.aviso === 'corrompido' && sv.estado === 'corrompido') return { id: 'corrompido', t1: 'NÃO LI SEU PROGRESSO', t2: 'o que estava salvo veio estragado.', b: ['zerar', 'COMEÇAR DO ZERO'] };
      if (sv.aviso === 'semArmazenamento') return { id: 'semsalvar', disco: true, t1: 'SEM SALVAR: ESTE NAVEGADOR NÃO SALVA', t2: 'seu progresso some ao fechar.', b: host.linkBase ? ['guardar', 'GUARDAR'] : null };
      if (pequena && !fechadas.pequena) return { id: 'pequena', t1: 'TELA PEQUENA', t2: typeof host.telaCheia === 'function' ? 'use a tela cheia: tudo fica maior.' : 'o jogo fica melhor numa tela maior.',
        b: typeof host.telaCheia === 'function' ? ['cheiaFaixa', 'TELA CHEIA'] : ['fecharPequena', 'OK'] };
      if (host.faixaZap && tela === 'titulo' && !fechadas.zap) return { id: 'zap', t1: 'SALVE MELHOR NO NAVEGADOR', t2: 'o WhatsApp pode esquecer seu jogo.', b: ['copiarLink', 'COPIAR LINK'] };
      return null;
    }
    function desenharFaixa() {
      const fx = faixaAtual();
      if (!fx) { elFaixa.innerHTML = ''; return; }
      let h = '<div class="zmb-faixa" role="status" data-faixa="' + fx.id + '">' + (fx.disco ? '<i class="zmb-disco" aria-hidden="true"></i>' : '');
      h += '<div class="zmb-fx"><span style="font-size:' + f(9) + 'px;color:#ffd36e">' + esc(fx.t1) + '</span><span style="font-size:' + f(9) + 'px;color:#e6dcc4" data-ref="fx2">' + esc(fx.t2) + '</span></div>';
      if (fx.b) h += '<button type="button" class="zmb-b" data-b="' + fx.b[0] + '" style="font-size:' + f(10) + 'px;min-width:44px">' + fx.b[1] + '</button>';
      h += '</div>';
      trocarConteudo(elFaixa, h);
    }
    function desenharDialogo() {
      if (!dialogo) { elDlg.hidden = true; elDlg.innerHTML = ''; inerte(false); return; }
      let h = '<div class="zmb-cx zmb-bloq"></div><div class="zmb-dlg" role="dialog" aria-modal="true" aria-label="' + esc(dialogo.titulo) + '"></div>';
      h += txt(18, 28, 220, 13, '#ffd36e', esc(dialogo.titulo), 'center');
      (dialogo.linhas || []).forEach(function (l, i) { h += txt(26, 44 + i * 11, 204, 9, '#e6dcc4', esc(l), 'center'); });
      if (dialogo.link) h += '<div class="zmb-link" data-ref="link" style="left:26px;top:56px;width:204px;height:38px;font-size:' + f(9) + 'px">' + esc(dialogo.link) + '</div>';
      if (dialogo.status) h += txt(26, 97, 204, 9, '#cfe9a8', esc(dialogo.status), 'center');
      const bs = dialogo.botoes, w = Math.min(96, Math.floor((204 - (bs.length - 1) * 4) / bs.length));
      let x = 128 - Math.round((bs.length * w + (bs.length - 1) * 4) / 2);
      bs.forEach(function (b, i) { h += bt(b[0], x, 110, w, 24, '<span>' + b[1] + '</span>', i === 0 ? 'zmb-forte' : ''); x += w + 4; });
      elDlg.hidden = false;
      inerte(true);
      const focoDentro = layer.contains(doc.activeElement);
      elDlg.innerHTML = h;
      if (focoDentro || root.contains(doc.activeElement)) { const a = acharAtual() || elDlg.querySelector('[data-b]'); if (a) focarEl(a); }
    }
    function inerte(v) {
      [elTela, elFaixa].forEach(function (el) {
        if (v) { el.setAttribute('aria-hidden', 'true'); el.inert = true; el.setAttribute('inert', ''); }
        else { el.removeAttribute('aria-hidden'); el.inert = false; el.removeAttribute('inert'); }
      });
    }
    function abrirDialogo(d, foco) {
      dialogo = d;
      atual = { b: foco || d.botoes[0][0] };
      layer.hidden = false;
      desenharDialogo();
      falar(d.titulo + '. ' + (d.linhas || []).join(' '));
    }
    function fecharDialogo() {
      const d = dialogo;
      dialogo = null;
      atual = d && d.volta ? { b: d.volta } : null;
      desenharDialogo();
      layer.hidden = !tela;
      if (tela) focarPadrao(); else o.focarCanvas();
    }
    function linkDoBackup() {
      const cod = api.backup.exportar();
      return (host.linkBase || '').split('#')[0] + '#r=' + cod;
    }
    function copiar(texto, depois) { B.copiar(texto, doc, layer, depois); }
    function guardar() {
      if (!host.linkBase || !vivo || !tela) return false;
      const link = linkDoBackup();
      const botoes = [['copiar', 'COPIAR']];
      if (global.navigator && typeof global.navigator.share === 'function') botoes.push(['enviar', 'ENVIAR']);
      botoes.push(['fecharDlg', 'FECHAR']);
      abrirDialogo({ tipo: 'guardar', titulo: 'GUARDE ESTE LINK', linhas: ['abra o link e o jogo volta com tudo.'], link: link, botoes: botoes, volta: tela === 'titulo' ? 'guardar' : null });
      try { api.opcoes({ backupEm: Math.floor(Date.now() / 1000) }); } catch (e) {   }
      return true;
    }
    function faseEPequis(r) { return 'FASE ' + Math.max(1, r.lib) + ' · ' + fmt(r.pequis) + ' PEQUIS'; }
    function armasDe(r) { return D.BANCADA.armas.filter(function (v, i) { return r.arm[i] >= 0; }).map(function (v) { return tem(CURTO, v.id) ? CURTO[v.id] : maiusc(v.nome); }).join(', ').toLowerCase(); }
    function resumoBackup(r) { return [faseEPequis(r), 'armas: ' + armasDe(r)]; }
    function abrirRestauro(p) {
      pendente = null;
      if (!p.r) {
        abrirDialogo({ tipo: 'aviso', titulo: 'ESTE LINK NÃO ABRIU', linhas: ['o código do progresso veio quebrado.', 'seu jogo daqui continua igual.'], botoes: [['fecharDlg', 'OK']], depois: p.depois, motivo: 'invalido' });
        return;
      }
      abrirDialogo({ tipo: 'restauro', pend: p, titulo: 'ENCONTREI UM PROGRESSO',
        linhas: ['AQUI: ' + faseEPequis(o.progresso()), 'NO LINK: ' + faseEPequis(p.r), 'armas no link: ' + armasDe(p.r), 'o daqui fica numa cópia guardada.'],
        botoes: [['restaurar', 'RESTAURAR'], ['ignorar', 'IGNORAR']] });
    }
    function oferecerRestauro(codigo, depois) {
      const p = { codigo: codigo, r: api.backup.ler(codigo), depois: typeof depois === 'function' ? depois : null };
      if (tela === 'titulo' && !dialogo) abrirRestauro(p); else pendente = p;
      return !!p.r;
    }
    function itemSel() { const c = catalogo(); return { c: c, it: selDaAba(c, aba) }; }
    function selecionar(id) {
      if (tela !== 'bancada' || id === 'breve' || sel[aba] === id) return;
      sel[aba] = id; confirma = null;
      redesenharPainel();
    }
    function trocarAba(a, viaTecla) {
      if (a === aba) return;
      aba = a; confirma = null;
      atual = viaTecla ? null : { b: 'aba', id: a };
      desenharBancada();
      falar('Aba ' + a + '.');
    }
    function primario() {
      const x = itemSel(), it = x.it;
      if (!it) return;
      atual = { b: 'primario', id: it.id };
      if (it.estado === 'venda') {
        if (it.confirmar && !(confirma && confirma.id === it.id && Date.now() < confirma.ate)) {
          confirma = { id: it.id, ate: Date.now() + CONFIRMA_MS };
          global.clearTimeout(confirmaT);
          confirmaT = global.setTimeout(function () { if (vivo && confirma && Date.now() >= confirma.ate && tela === 'bancada') { confirma = null; redesenharPainel(); } }, CONFIRMA_MS + 30);
          redesenharPainel();
          falar('Confirmar a compra de ' + it.nome + ' por ' + it.preco + ' pequis? Aperte de novo.');
          return;
        }
        confirma = null;
        const r = api.bancada.comprar(it.id);
        if (r.ok) {
          comprouNaVisita = true;
          falar('Comprou ' + it.nome + '. ' + fmt(r.saldo) + ' pequis.' + (r.gravou === false ? ' Sem salvar neste navegador.' : ''));
        } else falar(MOTIVO[r.motivo] || 'Não deu.');
        desenharBancada();
      } else if (it.estado === 'sua' && it.tipo === 'arma') {
        const r2 = api.bancada.equipar(it.id.split(':')[1]);
        falar(r2.ok ? 'A próxima noite começa com ' + it.nome + '.' : MOTIVO[r2.motivo] || 'Não deu.');
        desenharBancada();
      } else if (it.estado === 'semPequis') {
        api.bancada.comprar(it.id);
        falar('Faltam ' + it.faltam + ' pequis.');
      } else falar(rotuloFalado(it) + '.');
    }
    function redesenhar() { if (vivo && (tela === 'titulo' || tela === 'pausa')) desenhar(); }
    function irPara(a, id) { aba = a; sel[a] = id; confirma = null; atual = { b: 'primario', id: id }; desenharBancada(); }
    function agir(el, viaTeclado) {
      const b = el.getAttribute('data-b'), id = el.getAttribute('data-id');
      if (!b) return;
      if (dialogo && !elDlg.contains(el)) return;
      if (tela === 'fim' && !N.overReady(S) && !dialogo) return;
      if (tela === 'fim' && (b === 'selo' || b === 'desfazer') && Date.now() - trocaFim < 500) return;
      if (el.getAttribute('aria-disabled') === 'true' && b !== 'primario') { if (b === 'desfazer') falar('Nada a desfazer.'); return; }
      emitir('clique', { botao: b });
      atual = { b: b, id: id || undefined };
      switch (b) {
        case 'pura': case 'semfim': api.modo(b); api.start(); return;
        case 'bancada': api.bancada.abrir(); return;
        case 'guardar': guardar(); return;
        case 'voltar': api.bancada.fechar(); return;
        case 'aba': trocarAba(id); return;
        case 'carta':
          if (id === 'breve') { falar('Mais armas chegam em breve.'); return; }
          selecionar(id);
          if (viaTeclado) {
            const antes = itemSel().it;
            if (antes && antes.estado === 'emMaos') { const pb = elTela.querySelector('[data-b="encher"]') || elTela.querySelector('[data-b="melhorar"]'); if (pb) { focarEl(pb); return; } }
            primario();
            const a = elTela.querySelector('[data-b="carta"][data-id="' + id + '"]');
            if (a) focarEl(a);
          }
          return;
        case 'primario': primario(); return;
        case 'desfazer': {
          const r = api.bancada.desfazer();
          falar(r.ok ? 'Desfeito. ' + fmt(r.saldo) + ' pequis.' : (tem(MOTIVO, r.motivo) ? MOTIVO[r.motivo] : 'nada a desfazer') + '.');
          if (tela === 'fim') { trocaFim = Date.now(); atual = { b: 'selo' }; desenharFim(); focarPadrao(); } else desenharBancada();
          return;
        }
        case 'encher': irPara('suprimentos', 'sup:municao'); return;
        case 'melhorar': { const c = catalogo(), arma = sel.armas && sel.armas.split(':')[1]; if (c.itens.some(function (x) { return x.id === 'nivel:' + arma; })) irPara('evoluir', 'nivel:' + arma); return; }
        case 'continuar': api.resume(); return;
        case 'som': host.som.alternar(); redesenhar(); return;
        case 'mais': nivel = 2; atual = null; desenharPausa(); focarPadrao(); return;
        case 'nivel1': nivel = 1; atual = { b: 'mais' }; desenharPausa(); return;
        case 'mira': { const i = MIRAS.indexOf(S.miraToque), m = MIRAS[(i + 1) % MIRAS.length]; api.opcoes({ mira: m }); desenharPausa(); falar('Mira ' + MIRA_NOME[m].toLowerCase() + '.'); return; }
        case 'menos': {
          const on = (api.opcoes() || {}).menosMovimento === true;
          if (!on && S.reduced) { falar('O aparelho já pede menos movimento.'); return; }
          api.opcoes({ menosMovimento: !on }); desenharPausa(); return;
        }
        case 'cheia': host.telaCheia(); return;
        case 'virar': host.virar.virar(); return;
        case 'sair': nivel = 'sair'; atual = { b: 'ficar' }; desenharPausa(); return;
        case 'ficar': nivel = 2; atual = { b: 'sair' }; desenharPausa(); return;
        case 'sairSim': api.titulo(); return;
        case 'denovo': api.start(); return;
        case 'titulo': api.titulo(); return;
        case 'selo': { trocaFim = Date.now(); const r = api.bancada.comprar(id); falar(r.ok ? 'Comprou. ' + fmt(r.saldo) + ' pequis. Dá para desfazer.' : MOTIVO[r.motivo] || 'Não deu.'); atual = { b: 'denovo' }; desenharFim(); focarPadrao(); return; }
        case 'recarregar': if (typeof host.recarregar === 'function') host.recarregar(); else try { global.location.reload(); } catch (e) {   } return;
        case 'zerar': api.salvamento('zerar'); desenhar(); focarPadrao(); return;
        case 'fecharFaixa': fechadas.restaurado = true; desenharFaixa(); focarPadrao(); return;
        case 'fecharPequena': fechadas.pequena = true; desenharFaixa(); focarPadrao(); return;
        case 'cheiaFaixa': fechadas.pequena = true; host.telaCheia(); desenharFaixa(); focarPadrao(); return;
        case 'copiarLink': copiar(host.linkLimpo || host.linkBase || String(global.location.href).split('?')[0], function (ok) {
          const s = elFaixa.querySelector('[data-ref="fx2"]');
          if (s) s.textContent = ok ? 'link copiado: cole no Chrome ou no Safari.' : 'segure o endereço lá em cima e copie.';
          falar(ok ? 'Link copiado.' : 'Não consegui copiar.');
        }); return;
        case 'copiar': copiar(dialogo.link, function (ok) {
          if (!dialogo) return;
          dialogo.status = ok ? 'LINK COPIADO. mande para você mesmo.' : 'não copiou: segure o link acima e copie.';
          atual = { b: 'copiar' };
          desenharDialogo(); falar(dialogo.status);
        }); return;
        case 'enviar': try { global.navigator.share({ title: 'Noite dos Zumbis', text: 'Meu progresso na Noite dos Zumbis', url: dialogo.link }).catch(function () {}); } catch (e) {   } return;
        case 'fecharDlg': { const d = dialogo; fecharDialogo(); if (d && d.depois) d.depois(false, d.motivo || 'fechou'); return; }
        case 'restaurar': {
          const p = dialogo.pend, ok = api.backup.restaurar(p.codigo), novo = !!(api.salvamento() || {}).somenteLeitura;
          dialogo = null;
          abrirDialogo(ok ? { tipo: 'aviso', titulo: 'PROGRESSO RESTAURADO', linhas: resumoBackup(api.backup.ler(api.backup.exportar()) || p.r), botoes: [['fecharDlg', 'OK']] }
            : { tipo: 'aviso', titulo: 'NÃO RESTAUREI', linhas: novo ? ['o progresso daqui é de um jogo mais novo.', 'recarregue a página e abra o link de novo.'] : ['termine a partida e abra o link de novo.'], botoes: [['fecharDlg', 'OK']] });
          if (ok) desenharTitulo();
          if (p.depois) p.depois(ok, ok ? 'restaurou' : 'naoRestaurou');
          return;
        }
        case 'ignorar': { const p = dialogo.pend; fecharDialogo(); if (p.depois) p.depois(false, 'ignorou'); return; }
        default: return;
      }
    }
    function visivel(el) { return !!(el.offsetWidth || el.offsetHeight); }
    function botoes() {
      const raiz = dialogo ? elDlg : layer;
      return Array.prototype.filter.call(raiz.querySelectorAll('button[data-b]'), visivel);
    }
    function padrao() {
      const lst = botoes();
      if (!lst.length) return null;
      const a = acharAtual();
      if (a && visivel(a)) return a;
      let q = null;
      if (dialogo) q = '[data-b]';
      else if (tela === 'titulo') q = '[data-b="' + S.modo + '"]';
      else if (tela === 'bancada') q = sel[aba] ? '[data-b="carta"][data-id="' + sel[aba] + '"]' : '[data-b="voltar"]';
      else if (tela === 'pausa') q = nivel === 1 ? '[data-b="continuar"]' : nivel === 2 ? '[data-b="mira"]' : '[data-b="ficar"]';
      else if (tela === 'fim') q = '[data-b="denovo"]';
      return (q && (dialogo ? elDlg : layer).querySelector(q)) || lst[0];
    }
    function focarEl(el) {
      if (!el) return;
      try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); }
      atual = { b: el.getAttribute('data-b'), id: el.getAttribute('data-id') || undefined };
      if (atual.b === 'carta') selecionar(atual.id);
      if (atual.b === 'pura' || atual.b === 'semfim') { const s = layer.querySelector('[data-ref="sub"]'); if (s) s.textContent = subtitulo(atual.b); }
    }
    function focarPadrao() { const a = padrao(); if (a) focarEl(a); return !!a; }
    function focado() { const a = doc.activeElement; return a && (dialogo ? elDlg : layer).contains(a) && a.getAttribute('data-b') ? a : null; }
    const PAINEL = { primario: 1, encher: 1, melhorar: 1 };
    function mover(dx, dy) {
      const a0 = focado() || padrao();
      if (!a0) return;
      if (!focado()) { focarEl(a0); return; }
      const viz = B.vizinho(botoes(), a0, dx, dy, layer), naFaixa = viz.naFaixa;
      let melhor = viz.el;
      if (tela === 'bancada' && !dialogo && dx) {
        const b0 = a0.getAttribute('data-b'), bm = melhor && melhor.getAttribute('data-b');
        if (dx > 0 && b0 === 'carta' && !(naFaixa && bm === 'carta')) melhor = elTela.querySelector('[data-ref="painel"] button[data-b]');
        else if (dx < 0 && PAINEL[b0] && !(bm && PAINEL[bm])) melhor = (sel[aba] && elTela.querySelector('[data-b="carta"][data-id="' + sel[aba] + '"]')) || melhor;
      }
      if (melhor) focarEl(melhor);
    }
    const DIR = B.DIR;
    function voltarNivel(sistema) {
      if (dialogo) { agir(elDlg.querySelector('[data-b="ignorar"]') || elDlg.querySelector('[data-b="fecharDlg"]') || elDlg.querySelector('[data-b]'), true); return true; }
      if (tela === 'bancada') { emitir('clique', { botao: 'voltar' }); api.bancada.fechar(); return true; }
      if (tela === 'fim') { if (!N.overReady(S)) return true; emitir('clique', { botao: 'titulo' }); api.titulo(); return true; }
      if (tela === 'pausa' && nivel !== 1) { nivel = nivel === 'sair' ? 2 : 1; atual = { b: nivel === 2 ? 'sair' : 'mais' }; desenharPausa(); focarPadrao(); return true; }
      if (tela === 'pausa' && (sistema || o.escFecha === false)) { if (!sistema) { emitir('clique', { botao: 'continuar' }); api.resume(); } return true; }
      return false;
    }
    function tecla(key, fase, ev) {
      if (!vivo || (!tela && !dialogo)) return false;
      if (ev && ev.target && /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName) && key !== 'Escape') return false;
      layer.classList.add('zmb-tec');
      if (key === 'Tab') {
        if (!dialogo) return false;
        if (fase !== 'up') {
          const l = botoes(), i = l.indexOf(doc.activeElement), d = ev && ev.shiftKey ? -1 : 1;
          if (l.length) focarEl(l[i < 0 ? (d > 0 ? 0 : l.length - 1) : (i + d + l.length) % l.length]);
        }
        return true;
      }
      const usa = DIR[key] || key === 'Enter' || key === ' ' || key === 'Spacebar' || key === 'Escape' || key === 'Esc' ||
        (tela === 'bancada' && /^[qQeEzZbB]$/.test(key));
      if (!usa) return false;
      if (fase === 'up') return (key !== 'Escape' && key !== 'Esc') || tela === 'bancada' || tela === 'fim' || !!dialogo || (tela === 'pausa' && (nivel !== 1 || o.escFecha === false));
      if (key === 'Escape' || key === 'Esc') return voltarNivel();
      if (ev && ev.repeat && !DIR[key]) return true;
      if (DIR[key]) { mover(DIR[key][0], DIR[key][1]); return true; }
      if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
        const el = focado() || padrao();
        if (dialogo && !focado()) { if (el) focarEl(el); return true; }
        if (el) { if (!focado()) focarEl(el); agir(el, true); }
        return true;
      }
      if (/^[qQeE]$/.test(key)) { const L = ['armas', 'evoluir', 'suprimentos'], i = L.indexOf(aba); trocarAba(L[(i + (/[eE]/.test(key) ? 1 : 2)) % 3], true); focarPadrao(); return true; }
      if (/^[zZ]$/.test(key)) { const d = layer.querySelector('[data-b="desfazer"]'); if (d) agir(d, true); return true; }
      if (/^[bB]$/.test(key)) { emitir('clique', { botao: 'voltar' }); api.bancada.fechar(); return true; }
      return false;
    }
    let ultimoPonteiro = '', ultimoClique = { b: '', t: 0 };
    function onClick(e) {
      const el = e.target && e.target.closest ? e.target.closest('[data-b]') : null;
      if (!el || !layer.contains(el)) {
        if (tela === 'titulo' && !dialogo && ultimoPonteiro === 'mouse' && !(e.target.closest && e.target.closest('.zmb-faixa'))) { emitir('clique', { botao: 'quintal' }); api.start(); }
        return;
      }
      e.preventDefault();
      const t = Date.now(), chave = el.getAttribute('data-b') + (el.getAttribute('data-id') || '');
      if (chave === ultimoClique.b && t - ultimoClique.t < 300) return;
      ultimoClique = { b: chave, t: t };
      agir(el, false);
    }
    function onPointerDown(e) {
      layer.classList.remove('zmb-tec');
      ultimoPonteiro = e.pointerType || '';
      if (e.pointerType === 'touch') o.toque(true);
      else if (e.pointerType === 'mouse') o.toque(false);
    }
    let mexeu = false;
    function onPointerMove(e) { if (e.pointerType === 'mouse') mexeu = true; }
    function onPointerOver(e) {
      if (e.pointerType !== 'mouse' || tela !== 'bancada' || dialogo || !mexeu) return;
      const el = e.target && e.target.closest ? e.target.closest('[data-b="carta"]') : null;
      if (el && el !== doc.activeElement) focarEl(el);
    }
    function onFocusIn(e) {
      const el = e.target;
      if (el && el.getAttribute && el.getAttribute('data-b') === 'carta' && tela === 'bancada') selecionar(el.getAttribute('data-id'));
    }
    layer.addEventListener('click', onClick);
    layer.addEventListener('pointerdown', onPointerDown);
    layer.addEventListener('pointerover', onPointerOver);
    layer.addEventListener('pointermove', onPointerMove);
    layer.addEventListener('focusin', onFocusIn);
    layer.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    function dispose() {
      if (!vivo) return;
      vivo = false;
      global.clearTimeout(confirmaT);
      layer.removeEventListener('click', onClick);
      layer.removeEventListener('pointerdown', onPointerDown);
      layer.removeEventListener('pointerover', onPointerOver);
      layer.removeEventListener('pointermove', onPointerMove);
      layer.removeEventListener('focusin', onFocusIn);
      if (layer.parentNode) layer.parentNode.removeChild(layer);
      B.tirarEstilo(doc);
    }
    return {
      sync: sync,
      tecla: tecla,
      cobre: function () { return vivo && (tela || dialogo) ? (tela || 'titulo') : null; },
      focar: function () { return vivo && (tela || dialogo) ? focarPadrao() : false; },
      dispose: dispose,
      mudouSave: function () { if (vivo && (tela === 'titulo' || tela === 'bancada')) { confirma = null; desenhar(); } },
      publica: {
        tela: function () { return dialogo ? 'dialogo:' + dialogo.tipo : tela; },
        oferecerRestauro: oferecerRestauro,
        guardar: guardar,
        voltar: function () { return vivo && (tela || dialogo) ? voltarNivel(true) : false; },
        redesenhar: redesenhar
      }
    };
  }
  global.AndreyZumbisUI = { versao: 2, criar: criar };
})(typeof window !== 'undefined' ? window : this);
