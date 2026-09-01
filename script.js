// ---------------------------------------------
// Constantes de consumo (litros)
// ---------------------------------------------
const LITROS_BANHO_MIN = 9;      // por minuto de banho
const LITROS_TORNEIRA_MIN = 6;   // por minuto de torneira aberta
const LITROS_DESCARGA = 6;       // por descarga (caixa dual-flush)
const LITROS_ROUPA_CARGA = 120;  // por carga de máquina de lavar
const LITROS_CARRO_LAVAGEM = 500; // por lavagem com mangueira
const LITROS_JARDIM_MIN = 15;    // por minuto de rega com mangueira

const MEDIA_NACIONAL_DIA = 151;  // L/dia por pessoa (referência SNIS)
const TARIFA_M3 = 5.0;           // R$ por m³ (estimativa)

// ---------------------------------------------
// Animação do número no hero
// ---------------------------------------------
function animarContador(elementId, valorFinal, duracaoMs) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const inicio = performance.now();

  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracaoMs, 1);
    const atual = Math.round(valorFinal * progresso);
    el.textContent = atual.toLocaleString('pt-BR');
    if (progresso < 1) requestAnimationFrame(passo);
  }

  requestAnimationFrame(passo);
}

document.addEventListener('DOMContentLoaded', () => {
  animarContador('statLitros', MEDIA_NACIONAL_DIA, 1200);
});

// ---------------------------------------------
// Helpers
// ---------------------------------------------
function valorCampo(id) {
  const el = document.getElementById(id);
  const n = Number(el.value);
  return isNaN(n) || n < 0 ? 0 : n;
}

function formatarLitros(valor) {
  return `${Math.round(valor).toLocaleString('pt-BR')} L`;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ---------------------------------------------
// Cálculo principal
// ---------------------------------------------
function calcularConsumo() {
  const tempoBanho = valorCampo('tempoBanho');
  const banhos = valorCampo('banhos');
  const torneira = valorCampo('torneira');
  const descargas = valorCampo('descargas');
  const roupaSemana = valorCampo('roupa');
  const carroMes = valorCampo('carro');
  const jardim = valorCampo('jardim');

  const camposPreenchidos = [tempoBanho, banhos, torneira, descargas, roupaSemana, carroMes, jardim]
    .some((v) => v > 0);

  if (!camposPreenchidos) {
    alert('Preencha ao menos um campo para calcular o seu consumo.');
    return;
  }

  const consumoBanho = tempoBanho * banhos * LITROS_BANHO_MIN;
  const consumoTorneira = torneira * LITROS_TORNEIRA_MIN;
  const consumoDescarga = descargas * LITROS_DESCARGA;
  const consumoRoupa = (roupaSemana * LITROS_ROUPA_CARGA) / 7;
  const consumoCarro = (carroMes * LITROS_CARRO_LAVAGEM) / 30;
  const consumoJardim = jardim * LITROS_JARDIM_MIN;

  const categorias = [
    { nome: 'Banho', valor: consumoBanho, cor: '#1AA6B7' },
    { nome: 'Torneira', valor: consumoTorneira, cor: '#E8A33D' },
    { nome: 'Descarga', valor: consumoDescarga, cor: '#0E4B5C' },
    { nome: 'Lavar roupa', valor: consumoRoupa, cor: '#E0623F' },
    { nome: 'Lavar carro', valor: consumoCarro, cor: '#6C7A89' },
    { nome: 'Jardim', valor: consumoJardim, cor: '#5FA86A' },
  ].filter((c) => c.valor > 0);

  const consumoTotal = categorias.reduce((soma, c) => soma + c.valor, 0);
  const consumoMensal = consumoTotal * 30;
  const custoMensal = (consumoMensal / 1000) * TARIFA_M3;

  renderizarResultado(consumoTotal, consumoMensal, custoMensal, categorias);
}

// ---------------------------------------------
// Renderização
// ---------------------------------------------
function renderizarResultado(consumoTotal, consumoMensal, custoMensal, categorias) {
  const secao = document.getElementById('resultado');
  secao.hidden = false;

  document.getElementById('consumoDiario').textContent = Math.round(consumoTotal).toLocaleString('pt-BR');
  document.getElementById('consumoMensal').textContent = formatarLitros(consumoMensal);
  document.getElementById('custoMensal').textContent = formatarMoeda(custoMensal);

  const diferenca = consumoTotal - MEDIA_NACIONAL_DIA;
  const comparativoEl = document.getElementById('comparativoMedia');
  if (Math.abs(diferenca) < 5) {
    comparativoEl.textContent = 'Igual à média';
  } else if (diferenca > 0) {
    comparativoEl.textContent = `+${Math.round(diferenca)} L acima`;
  } else {
    comparativoEl.textContent = `${Math.round(diferenca)} L abaixo`;
  }

  // Classificação
  const badge = document.getElementById('classificacaoBadge');
  const texto = document.getElementById('classificacaoTexto');
  let classe, rotulo;

  if (consumoTotal <= 150) {
    classe = 'baixo';
    rotulo = '🟢 Consumo consciente';
  } else if (consumoTotal <= 250) {
    classe = 'moderado';
    rotulo = '🟡 Consumo moderado';
  } else {
    classe = 'elevado';
    rotulo = '🔴 Consumo elevado';
  }

  badge.className = `resultado__badge ${classe}`;
  texto.textContent = rotulo;

  // Barras de composição
  const container = document.getElementById('barrasConsumo');
  container.innerHTML = '';
  const maior = Math.max(...categorias.map((c) => c.valor));

  categorias
    .sort((a, b) => b.valor - a.valor)
    .forEach((c) => {
      const item = document.createElement('div');
      item.className = 'barra-item';

      const pctDoTotal = ((c.valor / consumoTotal) * 100).toFixed(0);
      const larguraBarra = ((c.valor / maior) * 100).toFixed(0);

      item.innerHTML = `
        <div class="barra-item__top">
          <span>${c.nome}</span>
          <strong>${formatarLitros(c.valor)} · ${pctDoTotal}%</strong>
        </div>
        <div class="barra-track">
          <div class="barra-fill" style="width:${larguraBarra}%; background:${c.cor}"></div>
        </div>
      `;
      container.appendChild(item);
    });

  // Dicas personalizadas
  const lista = document.getElementById('listaDicas');
  lista.innerHTML = '';
  gerarDicas(categorias, consumoTotal).forEach((dica) => {
    const li = document.createElement('li');
    li.textContent = dica;
    lista.appendChild(li);
  });

  secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function gerarDicas(categorias, consumoTotal) {
  const dicas = [];
  const mapa = Object.fromEntries(categorias.map((c) => [c.nome, c.valor]));

  if (mapa['Banho'] > 90) {
    dicas.push('Reduza o tempo de banho para até 5 minutos e feche o registro ao se ensaboar.');
  }
  if (mapa['Torneira'] > 30) {
    dicas.push('Feche a torneira enquanto escova os dentes ou ensaboa a louça.');
  }
  if (mapa['Descarga'] > 30) {
    dicas.push('Verifique se a caixa acoplada não está vazando — isso pode dobrar o gasto com descargas.');
  }
  if (mapa['Lavar roupa'] > 20) {
    dicas.push('Só ligue a máquina de lavar com carga completa.');
  }
  if (mapa['Lavar carro'] > 10) {
    dicas.push('Troque a mangueira pelo balde e pano ao lavar o carro — economiza até 80% da água.');
  }
  if (mapa['Jardim'] > 20) {
    dicas.push('Regue o jardim de manhã cedo ou à noite para reduzir a evaporação.');
  }

  if (dicas.length === 0) {
    dicas.push('Seus hábitos já estão alinhados com um consumo consciente. Continue assim!');
  }

  return dicas;
}

// ---------------------------------------------
// Compartilhar / copiar resultado
// ---------------------------------------------
function copiarResultado() {
  const diario = document.getElementById('consumoDiario').textContent;
  const mensal = document.getElementById('consumoMensal').textContent;
  const custo = document.getElementById('custoMensal').textContent;
  const classificacao = document.getElementById('classificacaoTexto').textContent;

  const texto =
    `Meu consumo de água estimado: ${diario} L/dia (${mensal}/mês, ${custo}/mês). ` +
    `Classificação: ${classificacao}. Calculado em ÁguaConsciente.`;

  if (navigator.clipboard) {
    navigator.clipboard.writeText(texto).then(() => {
      const btn = document.getElementById('btnCompartilhar');
      const original = btn.textContent;
      btn.textContent = 'Copiado!';
      setTimeout(() => (btn.textContent = original), 1800);
    });
  }
}

// ---------------------------------------------
// Limpar formulário
// ---------------------------------------------
function limparCampos() {
  document.getElementById('formCalculadora').reset();
  document.getElementById('resultado').hidden = true;
}

// ---------------------------------------------
// Listeners
// ---------------------------------------------
document.getElementById('btnCalcular').addEventListener('click', calcularConsumo);
document.getElementById('btnLimpar').addEventListener('click', limparCampos);
document.getElementById('btnCompartilhar').addEventListener('click', copiarResultado);

document.getElementById('formCalculadora').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    calcularConsumo();
  }
});
