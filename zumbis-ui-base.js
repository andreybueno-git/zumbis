// zumbis-ui-base.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-ui-base.js).
(function (global) {
  'use strict';
  const CSS = [
    '.zmb .zmb-ui{position:absolute;left:0;top:0;width:256px;height:160px;transform-origin:0 0;z-index:2;font-family:"VT323","Courier New",monospace;font-size:11px;line-height:1;font-variant-ligatures:none;font-feature-settings:"liga" 0,"clig" 0;color:#f4ead0;-webkit-user-select:none;user-select:none;touch-action:none;-webkit-tap-highlight-color:transparent;text-shadow:-1px 0 #05060a,1px 0 #05060a,0 -1px #05060a,0 1px #05060a}',
    '.zmb .zmb-ui[hidden],.zmb .zmb-ui [hidden]{display:none!important}',
    '.zmb .zmb-ui *{box-sizing:border-box}',
    '.zmb .zmb-ui .zmb-cx{position:absolute;left:0;top:0;width:256px;height:160px;pointer-events:none}',
    '.zmb .zmb-ui .zmb-b,.zmb .zmb-ui .zmb-faixa,.zmb .zmb-ui .zmb-link,.zmb .zmb-ui .zmb-bloq{pointer-events:auto}',
    '.zmb .zmb-ui .zmb-t{position:absolute;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin:0;padding:0;max-width:none;letter-spacing:normal}',
    '.zmb .zmb-ui .zmb-t.zmb-t2{white-space:normal;text-overflow:clip}',
    '.zmb .zmb-ui .zmb-b{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;margin:0;padding:0 3px;font:inherit;line-height:1;color:#f4ead0;text-shadow:inherit;text-transform:uppercase;white-space:nowrap;overflow:visible;background:#1a2233;border:1px solid #3b4660;border-radius:2px;box-shadow:0 0 0 1px #05060a;cursor:pointer;touch-action:manipulation;-webkit-tap-highlight-color:transparent;-webkit-appearance:none;appearance:none;min-width:0;min-height:0;max-width:none;letter-spacing:normal;text-align:center;text-indent:0;transform:none;transition:none}',
    '.zmb .zmb-ui .zmb-b::after{content:"";position:absolute;left:50%;top:50%;width:max(100%,var(--alvo,0px));height:max(100%,var(--alvo,0px));transform:translate(-50%,-50%)}',
    '.zmb .zmb-ui .zmb-b:focus{outline:none}',
    '.zmb .zmb-ui .zmb-b>span{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis}',
    '.zmb .zmb-ui .zmb-b .zmb-l2{text-transform:none;color:#cfe9a8}',
    '.zmb .zmb-ui.zmb-tec .zmb-b:focus{box-shadow:0 0 0 2px #ffd36e,0 0 0 3px #05060a}',
    '.zmb .zmb-ui.zmb-tec .zmb-b:focus::before{content:">";position:absolute;left:1px;top:50%;margin-top:-5px;font-size:10px;color:#ffd36e}',
    '.zmb .zmb-ui .zmb-b:hover{background:#222c42}',
    '.zmb .zmb-ui .zmb-b[aria-disabled="true"]{opacity:.5;cursor:default}',
    '.zmb .zmb-ui .zmb-b.is-sel{border-color:#ffd36e;background:#26304a}',
    '.zmb .zmb-ui .zmb-b.is-aba{border-color:#ffd36e;background:#2a2f22;color:#ffd36e}',
    '.zmb .zmb-ui .zmb-b.zmb-forte{background:#2c3f22;border-color:#8fd16a}',
    '.zmb .zmb-ui .zmb-b.zmb-perigo{border-color:#ff7a6a;color:#ffb3a8}',
    '.zmb .zmb-ui .zmb-b.is-breve{background:#11151f;border-style:dashed;color:#7f8796}',
    '.zmb .zmb-ui .zmb-b.is-espera{opacity:.35}',
    '.zmb .zmb-ui .zmb-b.is-confirma{background:#4a3a12;border-color:#ffd36e;color:#ffe9a0}',
    '.zmb .zmb-ui canvas{display:block;image-rendering:crisp-edges;image-rendering:pixelated}',
    '.zmb .zmb-ui .zmb-sil{filter:brightness(0) invert(.3);opacity:.8}',
    '.zmb .zmb-ui .zmb-ic{display:inline-block;vertical-align:-1px;margin-right:2px}',
    '.zmb .zmb-ui .zmb-ex{position:absolute;right:2px;top:1px;color:#ffd84a}',
    '.zmb .zmb-ui .zmb-tecla{position:absolute;left:2px;top:1px;color:#cfe9a8}',
    '.zmb .zmb-ui .zmb-selo{position:absolute;right:0;top:0;width:0;height:0;border-left:8px solid transparent;border-top:8px solid #ffd36e}',
    '.zmb .zmb-ui .zmb-b.zmb-carta{padding:0}',
    '.zmb .zmb-ui .zmb-cad{display:inline-block;position:relative;width:5px;height:4px;margin:0 2px 0 1px;background:#9aa3b2;vertical-align:0}',
    '.zmb .zmb-ui .zmb-cad::before{content:"";position:absolute;left:1px;top:-3px;width:3px;height:3px;border:1px solid #9aa3b2;border-bottom:0;border-radius:2px 2px 0 0}',
    '.zmb .zmb-ui .zmb-barra{display:inline-block;width:5px;height:5px;margin-right:1px;border:1px solid #9aa3b2;vertical-align:0}',
    '.zmb .zmb-ui .zmb-barra.is-on{background:#ffe27a;border-color:#ffe27a}',
    '.zmb .zmb-ui .zmb-faixa{position:absolute;left:4px;top:1px;width:248px;height:21px;display:flex;align-items:center;gap:4px;padding:0 2px 0 4px;background:rgba(12,16,30,.94);border:1px solid #ff9a8a;border-radius:2px;box-shadow:0 0 0 1px #05060a}',
    '.zmb .zmb-ui .zmb-faixa .zmb-fx{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}',
    '.zmb .zmb-ui .zmb-faixa .zmb-fx>span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.zmb .zmb-ui .zmb-faixa .zmb-b{position:relative;height:19px;flex:none}',
    '.zmb .zmb-ui .zmb-disco{position:relative;flex:none;width:10px;height:10px;background:#9aa3b2;border-radius:1px}',
    '.zmb .zmb-ui .zmb-disco::before{content:"";position:absolute;left:2px;top:0;width:6px;height:3px;background:#2b2f38}',
    '.zmb .zmb-ui .zmb-disco::after{content:"";position:absolute;left:1px;top:5px;width:8px;height:4px;background:#f4ead0}',
    '.zmb .zmb-ui .zmb-fundo{background:rgba(5,7,12,.55)}',
    '.zmb .zmb-ui .zmb-dlg{position:absolute;left:18px;top:22px;width:220px;height:118px;background:#0c1020;border:1px solid #ffd36e;border-radius:2px;box-shadow:0 0 0 1px #05060a,0 0 0 300px rgba(3,4,10,.6)}',
    '.zmb .zmb-ui .zmb-link{position:absolute;left:8px;top:52px;width:204px;height:22px;padding:2px 3px;overflow:hidden;word-break:break-all;white-space:normal;line-height:1;color:#cfe9a8;background:#05070c;border:1px solid #3b4660;-webkit-user-select:text;user-select:text}'
  ].join('\n');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function fmt(n) { return String(Math.max(0, Math.floor(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function maiusc(s) { return String(s || '').toUpperCase(); }
  function tem(o, k) { return o != null && typeof k === 'string' && Object.prototype.hasOwnProperty.call(o, k); }
  const ESTILO_ID = 'andrey-zumbis-ui-estilo';
  let estiloRefs = 0;
  function addEstilo(doc) {
    estiloRefs++;
    if (doc.getElementById(ESTILO_ID)) return;
    const s = doc.createElement('style');
    s.id = ESTILO_ID;
    s.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(s);
  }
  function tirarEstilo(doc) {
    estiloRefs = Math.max(0, estiloRefs - 1);
    if (estiloRefs) return;
    const s = doc.getElementById(ESTILO_ID);
    if (s && s.parentNode) s.parentNode.removeChild(s);
  }
  function nivelDano(d) { return Math.max(1, Math.min(5, Math.round(d))); }
  function nivelAlcance(a) { return a >= 200 ? 5 : a >= 100 ? 4 : a >= 50 ? 3 : a >= 25 ? 2 : 1; }
  function barras(rot, v, ref) {
    let h = '';
    for (let i = 0; i < 5; i++) h += '<i class="zmb-barra' + (i < v ? ' is-on' : '') + '"></i>';
    const dif = ref == null ? '' : v - ref > 0 ? ' (+' + (v - ref) + ')' : v - ref < 0 ? ' (' + (v - ref) + ')' : '';
    return '<span style="display:inline-block;width:40px">' + rot + '</span>' + h + '<span style="color:' + (v - ref > 0 ? '#cfe9a8' : '#ff9a8a') + '">' + dif + '</span>';
  }
  const DIR = { ArrowUp: [0, -1], Up: [0, -1], w: [0, -1], W: [0, -1], ArrowDown: [0, 1], Down: [0, 1], s: [0, 1], S: [0, 1],
    ArrowLeft: [-1, 0], Left: [-1, 0], a: [-1, 0], A: [-1, 0], ArrowRight: [1, 0], Right: [1, 0], d: [1, 0], D: [1, 0] };
  function centro(el, layer) {
    let x = el.offsetLeft, y = el.offsetTop, p = el.offsetParent;
    while (p && p !== layer && layer.contains(p)) { x += p.offsetLeft; y += p.offsetTop; p = p.offsetParent; }
    return { x: x + el.offsetWidth / 2, y: y + el.offsetHeight / 2 };
  }
  function vizinho(lista, a0, dx, dy, layer) {
    const c0 = centro(a0, layer), w0 = a0.offsetWidth, h0 = a0.offsetHeight;
    let melhor = null, mv = Infinity, naFaixa = false;
    lista.forEach(function (el) {
      if (el === a0) return;
      const c = centro(el, layer), ex = c.x - c0.x, ey = c.y - c0.y;
      const prim = dx ? ex * dx : ey * dy;
      if (prim <= 2) return;
      const faixa = dx ? Math.abs(ey) < (h0 + el.offsetHeight) / 2 - 1 : Math.abs(ex) < (w0 + el.offsetWidth) / 2 - 1;
      const v = prim + (dx ? Math.abs(ey) : Math.abs(ex)) * 2.5;
      if ((faixa && !naFaixa) || (faixa === naFaixa && v < mv)) { mv = v; melhor = el; naFaixa = faixa; }
    });
    return { el: melhor, naFaixa: naFaixa };
  }
  function copiar(texto, doc, pai, depois) {
    function reserva() {
      let ok = false;
      try {
        const ta = doc.createElement('textarea');
        ta.value = texto; ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:absolute;left:0;top:0;width:1px;height:1px;opacity:0';
        pai.appendChild(ta); ta.select();
        ok = !!doc.execCommand('copy');
        pai.removeChild(ta);
      } catch (e) { ok = false; }
      depois(ok);
    }
    try {
      const cb = global.navigator && global.navigator.clipboard;
      if (cb && cb.writeText) { cb.writeText(texto).then(function () { depois(true); }, reserva); return; }
    } catch (e) {   }
    reserva();
  }
  global.AndreyZumbisUIBase = {
    versao: 2,
    CSS: CSS, esc: esc, fmt: fmt, maiusc: maiusc, tem: tem, copiar: copiar, addEstilo: addEstilo, tirarEstilo: tirarEstilo,
    nivelDano: nivelDano, nivelAlcance: nivelAlcance, barras: barras, DIR: DIR, vizinho: vizinho,
    MIRAS: ['auto', 'assistida35', 'assistida50', 'livre'],
    MIRA_NOME: { auto: 'AUTOMÁTICA', assistida35: 'ASSISTIDA ±35', assistida50: 'ASSISTIDA ±50', livre: 'LIVRE' },
    CURTO: { pistolinha: 'PISTOLINHA', facao: 'FACÃO', trabuco: 'TRABUCO', matraca: 'MATRACA', carabina: 'CARABINA',
      coracao: 'CORAÇÃO', pe: 'PÉ DE VENTO', mao: 'MÃO LIGEIRA', ima: 'ÍMÃ', faro: 'FARO', casca: 'CASCA', pulo: 'PULINHO',
      municao: 'ENCHER', cafe: 'CAFEZINHO', colete: 'COLETE', buscape: 'BUSCA-PÉ' },
    FRASE: { pistolinha: 'a de sempre: acerta de longe', facao: 'fique perto: corta em arco', trabuco: 'perto é melhor',
      matraca: 'rajadas curtas acertam mais', carabina: 'atravessa a fila' },
    MOTIVO: { semPequis: 'faltam pequis', emBreve: 'chega em breve', max: 'já está no máximo', jaTem: 'você já tem',
      naPartida: 'abra a Bancada entre as ondas', somenteLeitura: 'este jogo é mais novo: recarregue', partida: 'compre entre as ondas',
      limitePausa: 'um por pausa', limitePartida: 'acabou nesta noite', vidaCheia: 'os corações estão cheios', guardado: 'já tem colete',
      naoTem: 'você ainda não tem', desconhecido: 'não deu', nada: 'nada a desfazer',
      mudou: 'mudou em outra aba: não desfiz' },
    ROTULO_INDISP: { partida: 'ENTRE ONDAS', limitePausa: '1 POR PAUSA', limitePartida: 'ACABOU', vidaCheia: 'VIDA CHEIA', guardado: 'JÁ TEM' },
    FRASE_SUP: { municao: 'enche a reserva de balas', cafe: 'devolve 1 coração', colete: 'segura uma mordida', buscape: 'chega em breve' }
  };
})(typeof window !== 'undefined' ? window : this);
