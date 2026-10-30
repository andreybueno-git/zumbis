// zumbis-save.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-save.js).
(function (global) {
  'use strict';
  const VERSAO_SAVE = 1;
  const PREFIXO = 'andreyos.zumbis.';
  const CHAVES = {
    save: PREFIXO + 'save', bak: PREFIXO + 'save.bak', corrompido: PREFIXO + 'save.corrompido', antes: PREFIXO + 'save.antes',
    opcoes: PREFIXO + 'opcoes', recorde: PREFIXO + 'recorde', teste: PREFIXO + 'teste'
  };
  const MAX = 9999999;
  const N_ARMAS = 9, N_MEL = 7, N_FASES = 7;
  const CONHECIDOS = ['v', 'rev', 'criado', 'salvo', 'dif', 'lib', 'pequis', 'ganho', 'gasto', 'arm', 'eq', 'mel', 'fases', 'sf', 'top', 'est', 'run', 'ck'];
  function inteiro(v, a, b, padrao) {
    if (typeof v !== 'number' && typeof v !== 'string') return padrao;
    v = Math.floor(Number(v));
    if (!isFinite(v)) return padrao;
    return v < a ? a : v > b ? b : v;
  }
  function tem(o, k) { return o != null && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k); }
  function lista(n, fn) { const out = []; for (let i = 0; i < n; i++) out.push(fn(i)); return out; }
  function copia(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
  function fnv1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return h >>> 0;
  }
  function ck(o) {
    const c = {};
    Object.keys(o).forEach(function (k) { if (k !== 'ck') c[k] = o[k]; });
    return fnv1a(JSON.stringify(c));
  }
  function novo(seg) {
    seg = seg || 0;
    return {
      v: VERSAO_SAVE, rev: 0, criado: seg, salvo: seg,
      dif: 'n', lib: 1,
      pequis: 0, ganho: 0, gasto: 0,
      arm: [0, -1, -1, -1, -1, -1, -1, -1, -1], eq: 0,
      mel: [0, 0, 0, 0, 0, 0, 0],
      fases: lista(N_FASES, function () { return [0, 0, 0, 0, 0, 0, 0]; }),
      sf: lista(N_FASES, function () { return [0, 0, 0]; }),
      top: [],
      est: { partidas: 0, abates: 0, pequis: 0, segundos: 0 },
      run: null
    };
  }
  function normalizar(o, seg) {
    const n = novo(seg);
    if (!o || typeof o !== 'object' || Array.isArray(o)) return n;
    const r = { v: VERSAO_SAVE };
    r.rev = inteiro(o.rev, 0, 2e9, 0);
    r.criado = inteiro(o.criado, 0, 1e11, n.criado);
    r.salvo = inteiro(o.salvo, 0, 1e11, n.salvo);
    r.dif = o.dif === 'f' || o.dif === 'd' ? o.dif : 'n';
    r.lib = inteiro(o.lib, 1, N_FASES, 1);
    r.ganho = inteiro(o.ganho, 0, MAX, 0);
    r.gasto = inteiro(o.gasto, 0, MAX, 0);
    if (r.gasto > r.ganho) r.gasto = r.ganho;
    r.pequis = r.ganho - r.gasto;
    r.arm = lista(N_ARMAS, function (i) { return inteiro(Array.isArray(o.arm) ? o.arm[i] : null, -1, 3, n.arm[i]); });
    if (r.arm[0] < 0) r.arm[0] = 0;
    r.eq = inteiro(o.eq, 0, N_ARMAS - 1, 0);
    if (r.arm[r.eq] < 0) r.eq = 0;
    r.mel = lista(N_MEL, function (i) { return inteiro(Array.isArray(o.mel) ? o.mel[i] : 0, 0, 3, 0); });
    r.fases = lista(N_FASES, function (i) {
      const f = Array.isArray(o.fases) && Array.isArray(o.fases[i]) ? o.fases[i] : [];
      return lista(7, function (j) { return inteiro(f[j], 0, MAX, 0); });
    });
    r.sf = lista(N_FASES, function (i) {
      const f = Array.isArray(o.sf) && Array.isArray(o.sf[i]) ? o.sf[i] : [];
      return lista(3, function (j) { return inteiro(f[j], 0, MAX, 0); });
    });
    r.top = (Array.isArray(o.top) ? o.top : []).filter(Array.isArray).slice(0, 5).map(function (t) {
      return [inteiro(t[0], 0, MAX, 0), inteiro(t[1], 0, N_FASES, 0), t[2] === 'f' || t[2] === 'd' ? t[2] : 'n', inteiro(t[3], 0, 99991231, 0)];
    });
    const e = o.est && typeof o.est === 'object' ? o.est : {};
    r.est = {};
    Object.keys(n.est).forEach(function (k) { r.est[k] = inteiro(e[k], 0, 2e9, 0); });
    r.run = o.run && typeof o.run === 'object' && !Array.isArray(o.run) ? o.run : null;
    Object.keys(o).forEach(function (k) { if (CONHECIDOS.indexOf(k) < 0) r[k] = o[k]; });
    return r;
  }
  const MIGRA = {
    0: function (recorde, seg) { const s = novo(seg); s.sf[0][1] = inteiro(recorde, 0, MAX, 0); return s; }
  };
  function migrar(o, seg) {
    let v = typeof o === 'number' || typeof o === 'string' ? 0 : (o && typeof o.v === 'number' ? o.v : 0);
    let cur = o;
    while (v < VERSAO_SAVE && MIGRA[v]) { cur = MIGRA[v](cur, seg); v++; }
    return normalizar(cur, seg);
  }
  function decodificar(raw) {
    if (raw == null) return { falta: true };
    let o;
    try { o = JSON.parse(raw); } catch (e) { return { ruim: 'json' }; }
    if (!o || typeof o !== 'object' || Array.isArray(o)) return { ruim: 'forma' };
    if (typeof o.v !== 'number' || !isFinite(o.v) || o.v < 1) return { ruim: 'versao' };
    if (o.v > VERSAO_SAVE) return { futuro: o };
    let c;
    try { c = ck(o); } catch (e) { return { ruim: 'ck' }; }
    if (o.ck !== c) return { ruim: 'ck' };
    return { ok: o };
  }
  function abrirTexto(raw, seg) {
    try {
      const d = decodificar(raw);
      if (d.ok) d.ok = migrar(d.ok, seg);
      else if (d.futuro) d.futuro = normalizar(d.futuro, seg);
      else return d;
      JSON.stringify(d.ok || d.futuro);
      return d;
    } catch (e) { return { ruim: 'forma' }; }
  }
  const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  function b64(str) {
    let out = '';
    for (let i = 0; i < str.length; i += 3) {
      const a = str.charCodeAt(i), b = str.charCodeAt(i + 1), c = str.charCodeAt(i + 2);
      const n = (a << 16) | ((b || 0) << 8) | (c || 0);
      out += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (i + 1 < str.length ? B64[(n >> 6) & 63] : '') + (i + 2 < str.length ? B64[n & 63] : '');
    }
    return out;
  }
  function deB64(s) {
    let out = '';
    for (let i = 0; i < s.length; i += 4) {
      const q = [0, 1, 2, 3].map(function (k) { return i + k < s.length ? B64.indexOf(s[i + k]) : -2; });
      if (q[0] < 0 || q[1] < 0 || q[2] === -1 || q[3] === -1) return null;
      const n = (q[0] << 18) | (q[1] << 12) | ((q[2] < 0 ? 0 : q[2]) << 6) | (q[3] < 0 ? 0 : q[3]);
      out += String.fromCharCode((n >> 16) & 255);
      if (q[2] >= 0) out += String.fromCharCode((n >> 8) & 255);
      if (q[3] >= 0) out += String.fromCharCode(n & 255);
    }
    return out;
  }
  function lerBackup(codigo) {
    try {
      const t = String(codigo == null ? '' : codigo);
      if (t.length > 3000) return null;
      const m = /^ZMB1-([A-Za-z0-9_-]{1,1000})-([a-z0-9]{1,8})$/.exec(t.trim().replace(/^.*#r=/, ''));
      if (!m) return null;
      const j = deB64(m[1]);
      if (j === null || fnv1a(j).toString(36) !== m[2]) return null;
      const p = JSON.parse(j);
      if (!Array.isArray(p) || p[0] !== 1 || p.length < 9) return null;
      const s = normalizar({ dif: p[1], lib: p[2], ganho: p[3], gasto: p[4], arm: p[5], eq: p[6], mel: p[7], fases: p[8] }, 0);
      return { dif: s.dif, lib: s.lib, pequis: s.pequis, ganho: s.ganho, gasto: s.gasto, arm: s.arm, eq: s.eq, mel: s.mel,
        fases: s.fases.map(function (f) { return f.slice(0, 4); }) };
    } catch (e) { return null; }
  }
  function acesso(fn) {
    function st() { return fn ? fn() : null; }
    return {
      get: function (k) { try { const s = st(); return s ? s.getItem(k) : null; } catch (e) { return null; } },
      set: function (k, v) { try { const s = st(); if (!s) return false; s.setItem(k, v); return true; } catch (e) { return false; } },
      del: function (k) { try { const s = st(); if (s) s.removeItem(k); return !!s; } catch (e) { return false; } }
    };
  }
  function abrir(op) {
    op = op || {};
    const A = acesso(op.armazenamento);
    const chave = op.chave || CHAVES.save, chaveBak = chave + '.bak', chaveRuim = chave + '.corrompido', chaveAntes = chave + '.antes';
    function seg() { return Math.floor((op.agora ? op.agora() : Date.now()) / 1000); }
    let mem, estado, somenteLeitura = false, bak = false, gravou = false;
    let gravavel = A.set(CHAVES.teste, '1');
    if (gravavel) A.del(CHAVES.teste);
    let opcoesMem = null;
    const raw = A.get(chave);
    if (!gravavel && raw != null) gravavel = A.set(chave, raw);
    const d = abrirTexto(raw, seg());
    if (d.ok) {
      mem = d.ok; estado = 'ok';
      if (A.get(chaveBak) !== raw) A.set(chaveBak, raw);
    } else if (d.futuro) {
      mem = d.futuro; estado = 'versaoNova'; somenteLeitura = true;
    } else {
      if (!d.falta) A.set(chaveRuim, raw);
      const b = d.falta ? { falta: true } : abrirTexto(A.get(chaveBak), seg());
      if (b.ok) { mem = b.ok; estado = 'restaurado'; bak = true; }
      else {
        const legado = parseInt(A.get(CHAVES.recorde), 10);
        mem = isFinite(legado) && legado > 0 ? migrar(legado, seg()) : novo(seg());
        estado = !d.falta ? 'corrompido' : isFinite(legado) && legado > 0 ? 'migrado' : 'novo';
      }
    }
    function finalizar(s) {
      const r = normalizar(s, seg());
      r.salvo = seg();
      r.ck = ck(r);
      return r;
    }
    const P = {
      estado: function () {
        const aviso = estado === 'versaoNova' ? 'versaoNova' : (estado === 'corrompido' || estado === 'restaurado') ? 'corrompido' : !gravavel ? 'semArmazenamento' : null;
        return { estado: estado, aviso: aviso, gravavel: gravavel, somenteLeitura: somenteLeitura, bak: bak, rev: mem.rev };
      },
      ler: function () { return copia(mem); },
      saldo: function () { return mem.pequis; },
      reler: function () {
        if (somenteLeitura) return false;
        const d = abrirTexto(A.get(chave), seg());
        if (d.ok && (d.ok.rev | 0) > (mem.rev | 0)) { mem = d.ok; return true; }
        return false;
      },
      gravou: function () { return gravou; },
      commit: function (fn) {
        let base = mem;
        if (!somenteLeitura) {
          const atual = abrirTexto(A.get(chave), seg());
          if (atual.ok && (atual.ok.rev | 0) >= (mem.rev | 0)) base = atual.ok;
        }
        const s = copia(base);
        if (fn && fn(s) === false) { mem = base; return false; }
        s.rev = (base.rev | 0) + 1;
        mem = finalizar(s);
        gravou = false;
        if (somenteLeitura) return true;
        gravou = A.set(chave, JSON.stringify(mem));
        gravavel = gravou;
        if (gravou && estado !== 'ok') estado = 'ok';
        return true;
      },
      creditar: function (n) {
        n = Math.floor(n);
        if (!(n > 0)) return false;
        return P.commit(function (s) { s.ganho = Math.min(MAX, s.ganho + n); s.est.pequis = Math.min(2e9, s.est.pequis + n); });
      },
      opcoes: function () {
        if (opcoesMem) return copia(opcoesMem);
        try {
          const o = JSON.parse(A.get(CHAVES.opcoes) || '{}'), r = {};
          if (!o || typeof o !== 'object' || Array.isArray(o)) return r;
          Object.keys(o).forEach(function (k) { const v = o[k]; if (typeof v === 'string' || typeof v === 'boolean' || (typeof v === 'number' && isFinite(v))) r[k] = v; });
          return r;
        } catch (e) { return {}; }
      },
      mudarOpcoes: function (patch) {
        const o = opcoesMem || P.opcoes();
        Object.keys(patch || {}).forEach(function (k) { o[k] = patch[k]; });
        const ok = A.set(CHAVES.opcoes, JSON.stringify(o));
        opcoesMem = ok ? null : o;
        return ok;
      },
      zerar: function () {
        if (somenteLeitura) return false;
        const atual = abrirTexto(A.get(chave), seg());
        const s = novo(seg());
        s.rev = Math.max(mem.rev | 0, atual.ok ? atual.ok.rev | 0 : 0) + 1;
        mem = finalizar(s);
        estado = 'novo'; bak = false;
        gravou = A.set(chave, JSON.stringify(mem));
        gravavel = gravou;
        return true;
      },
      exportar: function () {
        const j = JSON.stringify([1, mem.dif, mem.lib, mem.ganho, mem.gasto, mem.arm, mem.eq, mem.mel, mem.fases.map(function (f) { return f.slice(0, 4); })]);
        return 'ZMB1-' + b64(j) + '-' + fnv1a(j).toString(36);
      },
      restaurar: function (codigo) {
        const b = lerBackup(codigo);
        if (!b || somenteLeitura) return false;
        const atual = A.get(chave), guardado = abrirTexto(A.get(chaveAntes), seg());
        if (!guardado.ok || (guardado.ok.ganho | 0) <= (mem.ganho | 0)) A.set(chaveAntes, atual != null ? atual : JSON.stringify(finalizar(mem)));
        return P.commit(function (s) {
          s.dif = b.dif; s.lib = b.lib; s.ganho = b.ganho; s.gasto = b.gasto; s.arm = b.arm; s.eq = b.eq; s.mel = b.mel;
          s.fases = s.fases.map(function (f, i) { return b.fases[i].concat(f.slice(4)); });
        });
      }
    };
    return P;
  }
  function num(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }
  const IMA = ['só pega o que encosta', 'puxa pequis de pertinho', 'puxa pequis de perto', 'puxa pequis de longe'];
  function descreveMelhoria(id, v, i) {
    switch (id) {
      case 'coracao': return v + ' corações';
      case 'pe': return v > 0 ? 'atirando, anda ' + Math.round(v * 100) + '% mais rápido' : 'atirando, anda mais devagar';
      case 'mao': return v < 1 ? 'recarrega ' + Math.round((1 - v) * 100) + '% mais rápido' : 'recarrega no tempo normal';
      case 'ima': return IMA[i] || IMA[IMA.length - 1];
      case 'faro': return 'de 100 zumbis: ' + Math.round(v[0] * 100) + ' caixas, ' + Math.round(v[1] * 100) + ' cafés';
      case 'casca': return num(v) + ' s sem levar outra mordida';
      default: return String(v);
    }
  }
  function vaga(D, id) { const a = D.BANCADA.armas; for (let i = 0; i < a.length; i++) if (a[i].id === id) return a[i]; return null; }
  function precoSuprimento(D, id, fase) {
    const sup = D.BANCADA.suprimentos[id];
    if (!sup || !sup.base) return null;
    return Math.round(sup.base * (1 + 0.1 * ((fase || 1) - 1)));
  }
  function item(D, s, p, id) {
    const m = /^(arma|nivel|melhoria|sup):([a-z]+)$/.exec(String(id || ''));
    if (!m) return null;
    const tipo = m[1], k = m[2], saldo = s.pequis;
    let it = null;
    if (tipo === 'arma' || tipo === 'nivel') {
      const vg = vaga(D, k);
      if (!vg) return null;
      const i = vg.tecla - 1, nivel = s.arm[i], tem = nivel >= 0, def = D.ARMAS[k];
      if (tipo === 'arma') {
        it = { id: id, aba: 'armas', tipo: 'arma', nome: vg.nome, tecla: vg.tecla, nivel: tem ? nivel : -1, max: 3, preco: vg.preco };
        const emMaos = p ? p.emMaos === k : s.eq === i;
        it.estado = !def ? 'emBreve' : tem ? (emMaos ? 'emMaos' : 'sua') : saldo >= vg.preco ? 'venda' : 'semPequis';
        it.inicial = s.eq === i;
        it.antes = tem ? 'sua' : 'não tem'; it.depois = tem ? '' : 'pente cheio e 1 caixa';
      } else {
        if (!def || !tem) return null;
        const prox = def.niveis[nivel];
        it = { id: id, aba: 'evoluir', tipo: 'nivel', nome: vg.nome, tecla: vg.tecla, nivel: nivel, max: def.niveis.length,
          preco: prox ? prox.preco : null, antes: nivel > 0 ? def.niveis[nivel - 1].frase : 'do jeito que veio',
          depois: prox ? prox.frase : '' };
        it.estado = !prox ? 'max' : saldo >= prox.preco ? 'venda' : 'semPequis';
      }
    } else if (tipo === 'melhoria') {
      if (!tem(D.MELHORIAS, k)) return null;
      const M = D.MELHORIAS[k];
      const nivel = s.mel[M.i], preco = M.preco[nivel];
      it = { id: id, aba: 'evoluir', tipo: 'melhoria', nome: M.nome, nivel: nivel, max: M.preco.length, preco: nivel < M.preco.length ? preco : null,
        antes: M.versao === 'V1' ? descreveMelhoria(k, M.v[nivel], nivel) : '', depois: M.versao === 'V1' && nivel < M.preco.length ? descreveMelhoria(k, M.v[nivel + 1], nivel + 1) : '' };
      it.estado = M.versao !== 'V1' ? 'emBreve' : nivel >= M.preco.length ? 'max' : saldo >= preco ? 'venda' : 'semPequis';
    } else {
      if (!tem(D.BANCADA.suprimentos, k)) return null;
      const sup = D.BANCADA.suprimentos[k];
      it = { id: id, aba: 'suprimentos', tipo: 'suprimento', nome: sup.nome, nivel: 0, max: 0, preco: precoSuprimento(D, k, p ? p.fase : 1) };
      if (sup.versao && sup.versao !== 'V1') it.estado = 'emBreve';
      else if (!p) { it.estado = 'indisponivel'; it.motivo = 'partida'; }
      else if (k === 'municao') {
        const E = D.ECONOMIA.municao.balas, falta = E.max - (p.reservas.balas || 0);
        const caixas = Math.min(Math.floor(saldo / E.preco), Math.floor(falta / E.caixa));
        it.preco = E.preco; it.caixas = Math.max(0, caixas);
        it.antes = (p.reservas.balas || 0) + ' balas'; it.depois = Math.min(E.max, (p.reservas.balas || 0) + it.caixas * E.caixa) + ' balas';
        it.estado = falta < E.caixa ? 'max' : caixas >= 1 ? 'venda' : 'semPequis';
        if (it.estado === 'venda') it.preco = caixas * E.preco;
      } else {
        const c = p[k] || { partida: 0, pausa: 0, guardado: 0 };
        const limite = c.partida >= sup.porPartida ? 'limitePartida' : c.pausa >= sup.porPausa ? 'limitePausa' :
          k === 'cafe' && p.vidas >= p.vidasMax ? 'vidaCheia' : k === 'colete' && c.guardado >= sup.guarda ? 'guardado' : null;
        it.antes = k === 'cafe' ? p.vidas + ' corações' : c.guardado + ' colete';
        it.depois = k === 'cafe' ? (p.vidas + 1) + ' corações' : (c.guardado + 1) + ' colete';
        if (limite) { it.estado = 'indisponivel'; it.motivo = limite; }
        else it.estado = saldo >= it.preco ? 'venda' : 'semPequis';
      }
    }
    it.faltam = it.estado === 'semPequis' && it.preco != null ? Math.max(0, it.preco - saldo) : 0;
    it.confirmar = it.estado === 'venda' && it.preco > 0 && it.preco > saldo * 0.5;
    return it;
  }
  function passoDaReceita(D, s, r) {
    let m = /^([a-z]+)(\d)$/.exec(r);
    if (m && tem(D.MELHORIAS, m[1])) return { id: 'melhoria:' + m[1], feito: s.mel[D.MELHORIAS[m[1]].i] >= +m[2] };
    m = /^([a-z]+)\.(\d)$/.exec(r);
    const vg = vaga(D, m ? m[1] : r);
    if (!vg) return null;
    if (m) return { id: 'nivel:' + m[1], feito: s.arm[vg.tecla - 1] >= +m[2] };
    return { id: 'arma:' + r, feito: s.arm[vg.tecla - 1] >= 0 };
  }
  function catalogo(D, s, p) {
    const ids = [];
    D.BANCADA.armas.forEach(function (a) { ids.push('arma:' + a.id); });
    D.BANCADA.armas.forEach(function (a) { ids.push('nivel:' + a.id); });
    Object.keys(D.MELHORIAS).forEach(function (k) { ids.push('melhoria:' + k); });
    Object.keys(D.BANCADA.suprimentos).forEach(function (k) { ids.push('sup:' + k); });
    const itens = ids.map(function (id) { return item(D, s, p, id); }).filter(Boolean);
    let selo = null;
    for (let i = 0; i < D.BANCADA.receita.length && !selo; i++) {
      const pr = passoDaReceita(D, s, D.BANCADA.receita[i]);
      if (!pr || pr.feito) continue;
      const it = item(D, s, p, pr.id);
      if (it && it.estado !== 'emBreve' && it.estado !== 'max') selo = pr.id;
    }
    itens.forEach(function (it) { it.selo = it.id === selo; });
    return { saldo: s.pequis, itens: itens, selo: selo };
  }
  function aplicar(D, s, id) {
    const it = item(D, s, null, id);
    if (!it) return { ok: false, motivo: 'desconhecido', id: id };
    if (it.tipo === 'suprimento') return { ok: false, motivo: 'partida', id: id };
    if (it.estado === 'emBreve' || it.estado === 'max') return { ok: false, motivo: it.estado, id: id };
    if (it.estado === 'sua' || it.estado === 'emMaos') return { ok: false, motivo: 'jaTem', id: id };
    if (s.pequis < it.preco) return { ok: false, motivo: 'semPequis', id: id, faltam: it.preco - s.pequis };
    const k = id.split(':')[1];
    const campo = it.tipo === 'melhoria' ? 'mel' : 'arm';
    const i = it.tipo === 'melhoria' ? D.MELHORIAS[k].i : it.tecla - 1;
    const de = s[campo][i];
    s[campo][i] = it.tipo === 'arma' ? 0 : de + 1;
    s.gasto += it.preco;
    s.pequis = s.ganho - s.gasto;
    return { ok: true, id: id, tipo: it.tipo, chave: k, preco: it.preco, campo: campo, i: i, de: de, para: s[campo][i] };
  }
  function desfazer(s, compra) {
    if (!compra || !compra.ok) return false;
    if (compra.campo && s[compra.campo][compra.i] !== compra.para) return false;
    if (compra.campo) s[compra.campo][compra.i] = compra.de;
    s.gasto = Math.max(0, s.gasto - compra.preco);
    s.pequis = s.ganho - s.gasto;
    return true;
  }
  function ligarBancada(o) {
    const D = o.D, N = o.N, S = o.S;
    let visita = [], pediuPersistir = false;
    function perfil() { const s = o.prog().ler(); return { arm: s.arm, mel: s.mel, eq: s.eq }; }
    function negar(id, motivo) {
      o.emit('deny', { item: id, motivo: motivo });
      o.depois();
      return { ok: false, motivo: motivo, item: id, saldo: o.saldo() };
    }
    function comprar(id) {
      const P = o.prog();
      if (!S.alive) return { ok: false, motivo: 'fechado', item: id };
      if (S.state === 'playing') return negar(id, 'naPartida');
      if (P.estado().somenteLeitura) return negar(id, 'somenteLeitura');
      o.gravarCredito();
      const foto = N.foto(S), m = /^sup:([a-z]+)$/.exec(String(id || ''));
      if (m) {
        const it = item(D, P.ler(), N.resumoLoja(S), id);
        if (!it || it.estado !== 'venda') return negar(id, it ? (it.motivo || it.estado) : 'desconhecido');
        let pago = false, gasto = 0;
        P.commit(function (s) { if (s.pequis < it.preco) return false; s.gasto += it.preco; s.pequis = s.ganho - s.gasto; pago = true; gasto = s.gasto; });
        if (!pago) return negar(id, 'semPequis');
        N.suprimento(S, m[1], it.caixas || 0);
        visita.push({ id: id, preco: it.preco, foto: foto, compra: null, gasto: gasto });
        o.emit('buy', it.caixas ? { item: id, caixas: it.caixas } : { item: id });
      } else {
        let compra = null;
        P.commit(function (s) { compra = aplicar(D, s, id); return compra.ok; });
        if (!compra || !compra.ok) return negar(id, compra ? compra.motivo : 'desconhecido');
        N.comprou(S, compra, perfil());
        visita.push({ id: id, preco: compra.preco, foto: foto, compra: compra });
        if (!pediuPersistir) { pediuPersistir = true; o.persistir(); }
        o.emit(compra.tipo === 'arma' ? 'buy' : 'upgrade', compra.tipo === 'arma' ? { item: id } : { item: id, nivel: compra.para });
      }
      o.depois();
      return { ok: true, item: id, saldo: o.saldo(), gravou: P.gravou() };
    }
    function desfazerUltima() {
      const v = visita.pop();
      if (!v || !S.alive) return { ok: false, motivo: 'nada', saldo: o.saldo() };
      let feito = false;
      o.prog().commit(function (s) {
        if (v.compra) feito = desfazer(s, v.compra);
        else if (s.gasto === v.gasto) { s.gasto = Math.max(0, s.gasto - v.preco); s.pequis = s.ganho - s.gasto; feito = true; }
        return feito;
      });
      if (!feito) return negar(v.id, 'mudou');
      N.voltar(S, v.foto);
      o.emit('undo', { item: v.id });
      o.depois();
      return { ok: true, item: v.id, saldo: o.saldo() };
    }
    function equipar(armaId) {
      const P = o.prog(), vg = vaga(D, armaId);
      if (!vg || !D.ARMAS[armaId]) return negar('arma:' + armaId, 'desconhecido');
      if (P.estado().somenteLeitura) return negar('arma:' + armaId, 'somenteLeitura');
      let tem = false;
      P.commit(function (s) { if (s.arm[vg.tecla - 1] < 0) return false; tem = true; s.eq = vg.tecla - 1; });
      if (!tem) return negar('arma:' + armaId, 'naoTem');
      N.perfil(S, perfil());
      o.emit('equip', { item: 'arma:' + armaId });
      o.depois();
      return { ok: true, item: 'arma:' + armaId };
    }
    function verCatalogo() {
      o.gravarCredito();
      const P = o.prog(), c = catalogo(D, P.ler(), N.resumoLoja(S)), u = visita[visita.length - 1];
      c.desfazer = u ? { item: u.id, preco: u.preco } : null;
      c.salvamento = P.estado();
      c.aberta = S.state === 'shop';
      return c;
    }
    return { comprar: comprar, desfazer: desfazerUltima, equipar: equipar, catalogo: verCatalogo, novaVisita: function () { visita = []; } };
  }
  global.AndreyZumbisSave = {
    versao: 2, VERSAO_SAVE: VERSAO_SAVE, CHAVES: CHAVES,
    abrir: abrir, novo: novo, normalizar: normalizar, migrar: migrar, ck: ck, fnv1a: fnv1a,
    decodificar: decodificar, lerBackup: lerBackup, ligarBancada: ligarBancada,
    loja: { catalogo: catalogo, item: item, aplicar: aplicar, desfazer: desfazer, precoSuprimento: precoSuprimento }
  };
})(typeof window !== 'undefined' ? window : this);
