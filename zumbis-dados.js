// zumbis-dados.js: cópia sem comentários; o fonte comentado mora no AndreyOS (andreyos-teaser/zumbis-dados.js).
(function (global) {
  'use strict';
  function congelar(o) {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
      Object.keys(o).forEach(function (k) { congelar(o[k]); });
      Object.freeze(o);
    }
    return o;
  }
  const TELA = { w: 256, h: 160 };
  const JOGADOR = { vel: 56, raio: 4, vidas: 3, invuln: 1.4 };
  const ARMAS = {
    pistolinha: {
      nome: 'Pistolinha', tipo: 'bala', tecla: 1, municao: 'balas',
      pente: 8, reserva0: 24, caixa: 14, recarga: 1.05, cad: 0.19,
      vel: 240, vida: 1.4, desvio: 0.04, dano: 1, knock: 1, peso: 0.9, alcance: 336,
      niveis: [
        { preco: 25, muda: { pente: 10 }, frase: 'pente de 10 balas' },
        { preco: 50, muda: { recarga: 0.9, cad: 0.17 }, frase: 'recarrega e atira mais rápido' },
        { preco: 70, muda: { pente: 12, recarga: 0.75 }, frase: 'pente de 12 e recarga ligeira' }
      ]
    },
    facao: {
      nome: 'Facão do Roçado', tipo: 'corpo', tecla: 2, municao: null,
      cad: 0.7, dano: 3, knock: 1.8, peso: 1, alcance: 17,
      arco: 120, golpe: 0.08, anim: 0.16, avanca: 4, parada: 0.04,
      niveis: [
        { preco: 20, muda: { alcance: 22 }, frase: 'corta mais longe' },
        { preco: 70, muda: { arco: 180, cad: 0.6 }, frase: 'corta meia volta, mais rápido' },
        { preco: 120, muda: { arco: 290, dano: 4 }, frase: 'corta quase uma volta, mais forte' }
      ]
    }
  };
  const INIMIGOS = {
    normal:   { hp: 2, vel: 15, r: 4.5, hitR: 5, peito: 6, pts: 10, knock: 70, ia: 'cambalear', passo: 5, grande: false, pago: 2 },
    corredor: { hp: 1, vel: 34, r: 4, hitR: 4.5, peito: 6, pts: 15, knock: 80, ia: 'perseguir', passo: 9, grande: false, pago: 2 },
    grandao:  { hp: 7, vel: 10, r: 6.5, hitR: 7, peito: 8, pts: 40, knock: 18, ia: 'perseguir', passo: 5, grande: true, pago: 7 }
  };
  const FASES = {
    quintal: {
      id: 'quintal', nome: 'Quintal',
      jogador: { x: 128, y: 114 },
      limites: { x0: 7, x1: 249, y0: 37, y1: 153 },
      ceu: 17,
      cerca: 28,
      varanda: 147,
      porteiras: [[40, 64], [188, 212]],
      trilha: [[118, 162], [124, 134], [148, 106], [176, 72], [196, 46], [200, 24]],
      zonaItens: { x0: 20, x1: 236, y0: 46, y1: 137 },
      obstaculos: [
        { tipo: 'pequi', x: 82, y: 76, r: 5, tiroDy: 3, tiroR: 3, copa: { alto: 34, meia: 18 } },
        { tipo: 'poste', x: 200, y: 100, r: 3, tiroDy: 6, tiroR: 3 },
        { tipo: 'cupim', x: 30, y: 126, r: 6, tiroDy: 5, tiroR: 6 },
        { tipo: 'toco', x: 150, y: 54, r: 4, tiroDy: 3, tiroR: 4 }
      ],
      luzes: [
        { x: 202, y: 98, r: 44, rgb: '255,204,124', a0: 1, a1: 0.55, pisca: true, lampada: { x: 202, y: 74, w: 2, h: 1 } }
      ],
      ondas: 'infinita'
    }
  };
  const ONDAS = {
    infinita: {
      base: 5, porOnda: 3,
      corredor: { desde: 3, fracao: [0.22, 0.06], max: 0.45 },
      grandao: { desde: 5, menos: 3, div: 2 },
      comunsNaFrente: 2,
      espera: { primeira: 1.6, outras: 1.0 },
      vivos: { base: 4, porOnda: 2, max: 22 },
      pressa: { porOnda: 0.035, max: 0.35 },
      intervalo: { base: 1.7, porOnda: 0.12, min: 0.5, sorteio: [0.75, 0.5] },
      bonus: 25,
      pausa: 3.2,
      municaoDesde: 2,
      cafeDesde: 3,
      recados: { 1: 'eles saem do escuro...', 3: 'cuidado: agora tem corredor', 5: 'lá vem o grandão' }
    }
  };
  const MODOS = {
    pura: { nome: 'NOITE PURA', fase: 'quintal', arsenal: false },
    semfim: { nome: 'NOITE SEM FIM', fase: 'quintal', arsenal: true }
  };
  const MELHORIAS = {
    coracao: { i: 0, nome: 'Coração Extra', v: [3, 4, 5, 6], preco: [50, 110, 200], versao: 'V1' },
    pe:      { i: 1, nome: 'Pé de Vento', v: [0, 0.07, 0.14, 0.21], preco: [35, 75, 140], versao: 'V1' },
    mao:     { i: 2, nome: 'Mão Ligeira', v: [1, 0.9, 0.8, 0.7], preco: [40, 90, 160], versao: 'V1' },
    ima:     { i: 3, nome: 'Ímã de Pequi', v: [10, 16, 22, 28], preco: [25, 55, 100], versao: 'V1' },
    faro:    { i: 4, nome: 'Faro do Guará', v: [[0.15, 0.06], [0.19, 0.08], [0.23, 0.1], [0.27, 0.12]], preco: [40, 90, 160], versao: 'V1' },
    casca:   { i: 5, nome: 'Casca Grossa', v: [1.4, 1.8, 2.2, 2.6], preco: [60, 130, 240], versao: 'V1' },
    pulo:    { i: 6, nome: 'Pulinho do Guará', v: [0, 30, 38, 46], preco: [100, 220, 400], versao: 'V2' }
  };
  const ECONOMIA = {
    PQ_POR_HP: 1.5,
    BONUS_ONDA: 0.15,
    coleta: 'chao',
    pequi: { vida: 18, valores: [10, 5, 2, 1], maxChao: 30, maxChaoToque: 20, puxa: 150 },
    semFim: { ateOnda: 8, antes: 0.8, depois: 0.6 },
    caixaCheia: 0.4,
    municao: {
      balas: { max: 180, caixa: 14, preco: 6, inicio: 24 },
      cartuchos: { max: 48, caixa: 8, preco: 8, inicio: 8 }
    },
    drop: { municao: 0.15, municaoFaltando: 0.15, abaixoDe: 0.25, cafe: 0.06 },
    credito: 0.4
  };
  const BANCADA = {
    armas: [
      { id: 'pistolinha', tecla: 1, nome: 'Pistolinha', preco: 0, niveis: [25, 50, 70], versao: 'V1' },
      { id: 'facao', tecla: 2, nome: 'Facão do Roçado', preco: 130, niveis: [20, 70, 120], versao: 'V1' },
      { id: 'trabuco', tecla: 3, nome: 'Trabuco da Vovó', preco: 200, niveis: [35, 75, 140], versao: 'V1' },
      { id: 'matraca', tecla: 4, nome: 'Matraca', preco: 280, niveis: [50, 90, 100], versao: 'V1' },
      { id: 'carabina', tecla: 5, nome: 'Carabina do Seu Zé', preco: 360, niveis: [50, 90, 100], versao: 'V1' },
      { id: 'macarico', tecla: 6, nome: 'Maçarico do Botijão', preco: 460, niveis: [80, 175, 320], versao: 'V2' },
      { id: 'morteiro', tecla: 7, nome: 'Morteiro de São João', preco: 540, niveis: [95, 210, 380], versao: 'V2' },
      { id: 'chinelo', tecla: 8, nome: 'Chinelo da Mãe', preco: 640, niveis: [110, 240, 440], versao: 'V2' },
      { id: 'caixasom', tecla: 9, nome: 'Caixa de Som de Forró', preco: 780, niveis: [125, 275, 500], versao: 'V2' }
    ],
    suprimentos: {
      municao: { nome: 'Encher munição' },
      cafe: { nome: 'Cafezinho', base: 25, porPartida: 2, porPausa: 1 },
      colete: { nome: 'Colete de couro', base: 40, porPartida: 2, porPausa: 1, guarda: 1 },
      buscape: { nome: 'Busca-pé', base: 60, versao: 'V2' }
    },
    receita: ['ima1', 'pistolinha.1', 'facao', 'coracao1', 'trabuco', 'trabuco.1', 'pe1', 'mao1', 'facao.1', 'carabina',
      'carabina.1', 'faro1', 'casca1', 'ima2', 'matraca', 'matraca.1', 'facao.2', 'coracao2', 'pe2', 'mao2', 'trabuco.2',
      'faro2', 'casca2', 'matraca.2', 'coracao3', 'carabina.2', 'ima3', 'pe3', 'mao3', 'faro3', 'casca3', 'pistolinha.2',
      'pistolinha.3', 'facao.3', 'trabuco.3', 'matraca.3', 'carabina.3']
  };
  global.AndreyZumbisDados = congelar({
    versao: 2,
    TELA: TELA, JOGADOR: JOGADOR, ARMAS: ARMAS, INIMIGOS: INIMIGOS, FASES: FASES, ONDAS: ONDAS,
    MODOS: MODOS, MELHORIAS: MELHORIAS, ECONOMIA: ECONOMIA, BANCADA: BANCADA
  });
})(typeof window !== 'undefined' ? window : this);
