/**
 * RiskEngine — Motor determinístico de análise de risco para Recife.
 *
 * Substitui 100% a dependência do Gemini. Usa dados reais de:
 * - Open-Meteo (precipitação, temperatura)
 * - Cálculo harmônico de marés (client-side)
 *
 * Aplica thresholds baseados em dados históricos de alagamentos em Recife
 * e gera RiskAnalysis completo com templates em português.
 *
 * ZERO dependência de LLM — todos os textos são templates pré-definidos.
 */

import type {
  RiskAnalysis,
  RiskLevel,
  RiskBreakdown,
  WeatherData,
  TideData,
  TimelineEvent,
  RiskZone,
  FloodHistory,
  GroundingSource,
} from '../types';

import { fetchWeatherForecast } from './weatherService';
import { predictTides } from './tideService';
import { CacheManager } from './cacheManager';

// ── Cache ──────────────────────────────────────────────────
const riskCache = new CacheManager<RiskAnalysis>('risk_analysis_recife_v6', 10);

// ── Thresholds de precipitação (mm/h) ──────────────────────
// Baseado no histórico de alagamentos em Recife:
// - 30mm/h já causa alagamentos pontuais
// - 50mm/h alaga vias principais
// - 100mm/h é catastrófico (ex: maio/2022)
function precipitationToRisk(mmh: number): RiskLevel {
  if (mmh < 10) return 'baixo';
  if (mmh < 30) return 'médio';
  if (mmh < 50) return 'alto';
  if (mmh < 100) return 'crítico';
  return 'extremo';
}

// ── Thresholds de altura da maré (metros) ──────────────────
// Recife: amplitude típica 1.0-2.8m. Maré >2.5m já causa
// refluxo nos canais e alagamento em áreas baixas.
function tideToRisk(height: number): RiskLevel {
  if (height < 1.5) return 'baixo';
  if (height < 2.0) return 'médio';
  if (height < 2.5) return 'alto';
  if (height < 3.0) return 'crítico';
  return 'extremo';
}

// ── Risco geotécnico (deslizamentos) ───────────────────────
// Baseado em chuva acumulada em 24h (saturação do solo)
function precipitationAccumulatedToRisk(totalMm: number): RiskLevel {
  if (totalMm < 20) return 'baixo';
  if (totalMm < 50) return 'médio';
  if (totalMm < 100) return 'alto';
  if (totalMm < 150) return 'crítico';
  return 'extremo';
}

// ── Levels ordered ─────────────────────────────────────────
const LEVEL_ORDER: RiskLevel[] = ['baixo', 'médio', 'alto', 'crítico', 'extremo'];

/**
 * Risco de ALAGAMENTO: requer a COMBINAÇÃO de chuva + maré alta.
 *
 * Em Recife (cidade abaixo do nível do mar), o alagamento ocorre
 * quando a chuva forte coincide com a maré alta — a maré impede
 * o escoamento da água pelos canais, causando refluxo e transbordamento.
 *
 * - Chuva sem maré alta: a água escoa, risco baixo/médio
 * - Maré alta sem chuva: não há água acumulando, risco baixo
 * - Chuva + maré alta: SEM os dois fatores, o risco dispara
 */
function floodRisk(rain: RiskLevel, tide: RiskLevel): RiskLevel {
  const rainIdx = LEVEL_ORDER.indexOf(rain);
  const tideIdx = LEVEL_ORDER.indexOf(tide);

  // Se algum fator é baixo, não há combinação perigosa
  if (rainIdx <= 1 && tideIdx <= 1) {
    // Ambos baixo ou médio → sem alagamento significativo
    return 'baixo';
  }

  // Pelo menos um fator é alto ou pior
  if (rainIdx >= 2 && tideIdx >= 2) {
    // AMBOS ≥ alto: combinação perigosa
    const minIdx = Math.min(rainIdx, tideIdx);
    // Sobe 1 nível adicional pela combinação
    return LEVEL_ORDER[Math.min(minIdx + 1, 4)];
  }

  if (rainIdx >= 2 && tideIdx < 2) {
    // Chuva forte mas maré baixa → escoa parcialmente
    return LEVEL_ORDER[Math.min(rainIdx - 1, 4)];
  }

  if (tideIdx >= 2 && rainIdx < 2) {
    // Maré alta mas sem chuva → refluxo leve, pouco impacto
    return LEVEL_ORDER[Math.max(tideIdx - 1, 1)];
  }

  return 'médio';
}

/**
 * Risco combinado geral: alagamento + deslizamento (geotécnico).
 *
 * Deslizamento é independente de maré — depende de chuva acumulada
 * em áreas de morro (Casa Amarela, Nova Descoberta, etc.).
 */
function combinedRisk(meteo: RiskLevel, hydro: RiskLevel, geo: RiskLevel): RiskLevel {
  const flood = floodRisk(meteo, hydro);
  const floodIdx = LEVEL_ORDER.indexOf(flood);
  const geoIdx = LEVEL_ORDER.indexOf(geo);

  return LEVEL_ORDER[Math.max(floodIdx, geoIdx)];
}

// ── Templates de resumo por nível de risco ──────────────────
// Linguagem direta, sem jargões, foco na população

interface SummaryTemplate {
  what: string;
  where: string;
  actions: string[];
  title: string;
  message: string;
  technicalDetails: string;
  generalRecs: string[];
  slopesRecs: string[];
  plainsRecs: string[];
}

function getTemplate(
  level: RiskLevel,
  meteoLevel: RiskLevel,
  hydroLevel: RiskLevel,
  maxPrecip: number,
  maxTide: number,
  peakHour: string,
  neighborhoods: string[]
): SummaryTemplate {
  const bairros = neighborhoods.slice(0, 5).join(', ');
  const rainHigh = LEVEL_ORDER.indexOf(meteoLevel) >= 2;
  const tideHigh = LEVEL_ORDER.indexOf(hydroLevel) >= 2;

  const riskCause = rainHigh && tideHigh
    ? 'Chuva forte COMBINADA com maré alta — situação crítica para alagamentos'
    : rainHigh
      ? 'Chuva forte (maré baixa — escoamento parcial)'
      : tideHigh
        ? 'Maré alta (sem chuva significativa — risco limitado)'
        : 'Condições estáveis';

  const templates: Record<RiskLevel, SummaryTemplate> = {
    baixo: {
      what: `Tempo estável em Recife. Previsão de até ${maxPrecip}mm de chuva nas próximas horas, sem risco de alagamentos.`,
      where: 'Nenhum bairro em risco imediato.',
      actions: [
        'Acompanhe a previsão do tempo ao longo do dia',
        'Mantenha bueiros e calhas limpos perto da sua casa',
        'Cadastre-se no SMS da Defesa Civil: 40199',
      ],
      title: 'Recife em Normalidade',
      message: 'Sem risco de alagamentos hoje.',
      technicalDetails: `Precipitação máx: ${maxPrecip}mm. Maré máx: ${maxTide}m. Condições dentro da normalidade operacional.`,
      generalRecs: ['Aproveite o dia com segurança'],
      slopesRecs: ['Sem risco para áreas de morro'],
      plainsRecs: ['Sem risco para áreas de planície'],
    },

    médio: {
      what: rainHigh && tideHigh
        ? `Atenção, recifense! Chuva de ${maxPrecip}mm combinada com maré de ${maxTide}m. Podem ocorrer alagamentos pontuais em áreas baixas.`
        : rainHigh
          ? `Chuva de ${maxPrecip}mm prevista. Sem maré alta, o escoamento deve ocorrer, mas fique atento a pontos baixos.`
          : `Maré de ${maxTide}m prevista, sem chuva significativa. Risco limitado, mas atenção em áreas muito baixas.`,
      where: `Fique de olho em: ${bairros}.`,
      actions: [
        'Evite passar por ruas alagadas — mesmo com carro alto',
        'Não estacione em áreas baixas ou próximas a canais',
        'Fique atento às atualizações da Defesa Civil',
        'Separe documentos e itens importantes em local alto',
      ],
      title: 'Atenção: Possibilidade de Alagamentos',
      message: rainHigh && tideHigh
        ? `Chuva de ${maxPrecip}mm e maré de ${maxTide}m — fique atento!`
        : `Possibilidade de alagamentos pontuais — acompanhe a previsão.`,
      technicalDetails: `${riskCause}. Precipitação máx: ${maxPrecip}mm. Maré máx: ${maxTide}m às ${peakHour}.`,
      generalRecs: [
        'Evite áreas alagadas',
        'Mantenha-se informado pelos canais oficiais',
      ],
      slopesRecs: ['Atenção em áreas de barreira — observe rachaduras no solo'],
      plainsRecs: ['Evite trafegar em ruas próximas a canais durante a maré alta'],
    },

    alto: {
      what: rainHigh && tideHigh
        ? `Alerta importante! Chuva forte de ${maxPrecip}mm COMBINADA com maré de ${maxTide}m às ${peakHour}. Esta combinação é perigosa: a maré alta impede o escoamento, causando transbordamento de canais. ALTO RISCO de alagamentos.`
        : `Alerta! ${rainHigh ? `Chuva forte de ${maxPrecip}mm` : `Maré alta de ${maxTide}m`}. ${rainHigh && !tideHigh ? 'A água pode escoar lentamente. Fique atento a pontos baixos.' : 'Refluxo nos canais possivel. Evite áreas baixas.'}`,
      where: `Áreas críticas: ${bairros} e bairros próximos a canais. Evite essas regiões!`,
      actions: [
        'NÃO enfrente ruas alagadas — a força da água pode arrastar veículos',
        'Se estiver em área de risco, vá para local seguro IMEDIATAMENTE',
        'Evite deslocamentos desnecessários nas próximas horas',
        'Desligue a eletricidade se a água começar a entrar em casa',
        'Tenha uma mochila de emergência pronta com água e documentos',
      ],
      title: 'ALERTA: Alto Risco de Alagamentos em Recife',
      message: rainHigh && tideHigh
        ? `ATENÇÃO: ${maxPrecip}mm de chuva + maré de ${maxTide}m. Risco alto de alagamento!`
        : `Alerta de alagamento: ${rainHigh ? 'chuva forte' : 'maré alta'}. Evite áreas baixas!`,
      technicalDetails: `${riskCause}. Precipitação máx: ${maxPrecip}mm. Maré máx: ${maxTide}m às ${peakHour}. Canais podem transbordar.`,
      generalRecs: [
        'Evite deslocamentos',
        'Procure locais elevados se estiver em área de risco',
        'Acompanhe a Defesa Civil PE no Twitter/X',
      ],
      slopesRecs: [
        'ALERTA MORRO: Risco de deslizamento. Evacue se notar rachaduras ou inclinação de árvores/poste',
        'Não fique em casa se houver barreira próxima',
      ],
      plainsRecs: [
        'ALERTA PLANÍCIE: Saia de áreas baixas. A água sobe rápido com maré alta',
        'Coloque móveis e eletrônicos em altura elevada',
      ],
    },

    crítico: {
      what: rainHigh && tideHigh
        ? `PERIGO REAL! Chuva torrencial de até ${maxPrecip}mm COMBINADA com maré de ${maxTide}m às ${peakHour}. Esta combinação é EXTREMAMENTE PERIGOSA — a água NÃO VAI ESCOAR. Alagamentos severos como os de maio/2022 são prováveis. Não espere — aja agora para proteger sua vida!`
        : `PERIGO! ${rainHigh ? `Chuva torrencial de ${maxPrecip}mm` : `Maré excepcional de ${maxTide}m`}. ${rainHigh ? 'Mesmo com maré baixa, este volume de chuva é muito perigoso.' : 'Mesmo sem chuva, esta altura de maré causa refluxo severo.'}`,
      where: `EVACUE áreas baixas: ${bairros}. Estas regiões DEVEM ser evacuadas. A água pode subir mais de 1 metro em minutos.`,
      actions: [
        'EVACUE áreas de risco IMEDIATAMENTE — sua vida em primeiro lugar',
        'NÃO espere a água subir — saia antes que seja tarde',
        'Leve apenas documentos, remédios e água',
        'Avise vizinhos, especialmente idosos e pessoas com dificuldade',
        'Ligue 199 (Defesa Civil) ou 193 (Bombeiros) em emergência',
      ],
      title: 'PERIGO: Alagamento Severo Iminente',
      message: `URGENTE: ${maxPrecip}mm de chuva + maré ${maxTide}m. EVACUE áreas baixas!`,
      technicalDetails: `${riskCause}. Precipitação máx: ${maxPrecip}mm. Maré máx: ${maxTide}m às ${peakHour}. Condições similares ao evento de maio/2022. Alagamentos generalizados esperados.`,
      generalRecs: [
        'EVACUAÇÃO IMEDIATA de áreas de risco',
        'Contate a Defesa Civil: 199',
        'Siga instruções das autoridades',
      ],
      slopesRecs: [
        'PERIGO EXTREMO: Evacue morros e barreiras agora. Deslizamentos iminentes!',
        'Não espere o deslizamento acontecer',
      ],
      plainsRecs: [
        'PERIGO EXTREMO: Água pode subir 1m+ em minutos. Saia AGORA!',
        'Vá para andares altos ou abrigos designados',
      ],
    },

    extremo: {
      what: rainHigh && tideHigh
        ? `EMERGÊNCIA! Chuva catastrófica de até ${maxPrecip}mm COMBINADA com maré de ${maxTide}m. Recife está sob AMEAÇA EXTREMA — a água NÃO VAI ESCOAR. Esta é uma situação de risco de vida. Todas as áreas abaixo do nível do mar estão em perigo. Aja AGORA!`
        : `EMERGÊNCIA! ${rainHigh ? `Chuva catastrófica de ${maxPrecip}mm` : `Maré excepcional de ${maxTide}m`}. Risco extremo para a população. Evacue IMEDIATAMENTE!`,
      where: `TODAS as áreas de baixada em Recife: ${bairros}. Evacuação em massa necessária.`,
      actions: [
        'EVACUE IMEDIATAMENTE — esta é uma emergência com risco de vida',
        'Vá para o local alto mais próximo: prédios públicos, igrejas, escolas',
        'NÃO tente salvar objetos — salve vidas',
        'Leve APENAS documentos, remédios essenciais e água',
        'Se estiver ilhado, ligue 193 (Bombeiros) e sinalize sua posição',
      ],
      title: 'EMERGÊNCIA: Catástrofe por Alagamento em Recife',
      message: `EMERGÊNCIA: Chuva de ${maxPrecip}mm + maré ${maxTide}m. EVACUE JÁ! Risco de vida!`,
      technicalDetails: `${riskCause}. Precipitação máx: ${maxPrecip}mm. Maré máx: ${maxTide}m às ${peakHour}. Evento extremo com potencial catastrófico. Alagamentos generalizados, transbordamento de canais e rios, deslizamentos em encostas.`,
      generalRecs: [
        'EVACUAÇÃO EM MASSA',
        'Emergência: 193 (Bombeiros)',
        'Defesa Civil: 199',
      ],
      slopesRecs: [
        'EVACUE JÁ: Deslizamentos catastróficos iminentes em todas as áreas de morro',
      ],
      plainsRecs: [
        'EVACUE JÁ: Inundação severa em todas as áreas de baixada. Risco de morte!',
      ],
    },
  };

  return templates[level];
}

// ── Zonas de Risco Estáticas (bairros de Recife) ────────────
// Polígonos aproximados — representam áreas de atenção, não delimitações oficiais

const RECIFE_RISK_ZONES: RiskZone[] = [
  {
    id: 'bv',
    name: 'Boa Viagem',
    level: 'baixo',
    description: 'Planície costeira. Alagamentos frequentes em maré alta com chuva. Canais da Av. Boa Viagem e Av. Domingos Ferreira transbordam.',
    polygon: [[-8.120, -34.890], [-8.120, -34.900], [-8.096, -34.900], [-8.096, -34.890]],
  },
  {
    id: 'centro',
    name: 'Centro / São José',
    level: 'baixo',
    description: 'Área baixa, densamente urbanizada. Alagamentos históricos. Rio Capibaribe próximo.',
    polygon: [[-8.060, -34.870], [-8.060, -34.880], [-8.050, -34.880], [-8.050, -34.870]],
  },
  {
    id: 'pina',
    name: 'Pina / Brasília Teimosa',
    level: 'baixo',
    description: 'Zona de mangue aterrado, muito baixa. Alaga com maré alta + chuva.',
    polygon: [[-8.090, -34.875], [-8.090, -34.890], [-8.072, -34.890], [-8.072, -34.875]],
  },
  {
    id: 'torre',
    name: 'Torre / Madalena',
    level: 'baixo',
    description: 'Próximo ao Rio Capibaribe. Alagamentos quando rio transborda.',
    polygon: [[-8.040, -34.900], [-8.040, -34.910], [-8.025, -34.910], [-8.025, -34.900]],
  },
  {
    id: 'afogados',
    name: 'Afogados / IPSEP',
    level: 'baixo',
    description: 'Região baixa com canais. Alagamentos frequentes.',
    polygon: [[-8.075, -34.900], [-8.075, -34.915], [-8.058, -34.915], [-8.058, -34.900]],
  },
  {
    id: 'cordeiro',
    name: 'Cordeiro / Várzea',
    level: 'baixo',
    description: 'Próximo ao Rio Capibaribe, área baixa. Alagamentos sazonais.',
    polygon: [[-8.035, -34.930], [-8.035, -34.945], [-8.015, -34.945], [-8.015, -34.930]],
  },
  {
    id: 'caxanga',
    name: 'Caxangá',
    level: 'baixo',
    description: 'Margem do Rio Capibaribe. Transbordamento em chuvas fortes.',
    polygon: [[-8.020, -34.950], [-8.020, -34.965], [-8.005, -34.965], [-8.005, -34.950]],
  },
  {
    id: 'janga',
    name: 'Janga / Pau Amarelo',
    level: 'baixo',
    description: 'Litoral norte. Alagamentos costeiros com maré alta.',
    polygon: [[-7.940, -34.830], [-7.940, -34.845], [-7.920, -34.845], [-7.920, -34.830]],
  },
  {
    id: 'olinda',
    name: 'Olinda (baixada)',
    level: 'baixo',
    description: 'Cidade vizinha, áreas baixas junto ao mar. Mesmo sistema de risco.',
    polygon: [[-8.000, -34.840], [-8.000, -34.855], [-7.985, -34.855], [-7.985, -34.840]],
  },
  {
    id: 'jaboatao',
    name: 'Jaboatão / Barra de Jangada',
    level: 'baixo',
    description: 'Litoral sul, foz do Rio Jaboatão. Alagamentos com maré alta.',
    polygon: [[-8.170, -34.920], [-8.170, -34.935], [-8.145, -34.935], [-8.145, -34.920]],
  },
  {
    id: 'casa-amarela',
    name: 'Casa Amarela / Alto do Mandu',
    level: 'baixo',
    description: 'Área de morros. Risco de deslizamento em chuvas fortes.',
    polygon: [[-8.025, -34.920], [-8.025, -34.935], [-8.010, -34.935], [-8.010, -34.920]],
  },
  {
    id: 'ibura',
    name: 'Ibura / Jordão',
    level: 'baixo',
    description: 'Zona sul, área baixa com canais. Um dos bairros mais afetados em chuvas.',
    polygon: [[-8.110, -34.930], [-8.110, -34.950], [-8.085, -34.950], [-8.085, -34.930]],
  },
];

// ── Histórico de Alagamentos Reais ──────────────────────────
// Eventos documentados baseados em registros da Defesa Civil,
// notícias e relatórios públicos

const RECIFE_FLOOD_HISTORY: FloodHistory[] = [
  {
    id: 'hist-2022-05-25',
    date: '25/05/2022',
    time: '15:30',
    areas: ['Boa Viagem', 'Pina', 'Ibura', 'Jordão', 'Afogados'],
    cause: 'rain',
    severity: 'severe',
    lat: -8.091,
    lng: -34.885,
    details: 'Chuva de 93mm em 3h. 33 pontos de alagamento. Vias bloqueadas na Zona Sul.',
  },
  {
    id: 'hist-2022-05-28',
    date: '28/05/2022',
    time: '06:00',
    areas: ['Casa Amarela', 'Dois Unidos', 'Água Fria', 'Linha do Tiro'],
    cause: 'rain',
    severity: 'severe',
    lat: -8.020,
    lng: -34.915,
    details: 'Chuva de 122mm em 12h. Deslizamentos em áreas de morro. Mortes registradas.',
  },
  {
    id: 'hist-2022-06-01',
    date: '01/06/2022',
    time: '22:00',
    areas: ['Boa Viagem', 'Centro', 'Santo Amaro', 'Torre'],
    cause: 'both',
    severity: 'severe',
    lat: -8.060,
    lng: -34.875,
    details: 'Chuva + maré alta (2.3m). Canais transbordaram. 40+ pontos de alagamento.',
  },
  {
    id: 'hist-2023-03-08',
    date: '08/03/2023',
    time: '14:00',
    areas: ['Boa Viagem', 'Pina', 'Imbiribeira'],
    cause: 'tide',
    severity: 'moderate',
    lat: -8.095,
    lng: -34.883,
    details: 'Maré de 2.5m causou refluxo nos canais. Alagamentos mesmo sem chuva forte.',
  },
  {
    id: 'hist-2023-04-18',
    date: '18/04/2023',
    time: '16:45',
    areas: ['Ibura', 'Jordão', 'COHAB', 'Boa Viagem'],
    cause: 'rain',
    severity: 'moderate',
    lat: -8.100,
    lng: -34.940,
    details: 'Chuva de 60mm em 2h. Alagamentos na Zona Sul. Transporte público paralisado.',
  },
  {
    id: 'hist-2023-06-15',
    date: '15/06/2023',
    time: '08:30',
    areas: ['Várzea', 'Caxangá', 'Torre', 'Madalena'],
    cause: 'rain',
    severity: 'severe',
    lat: -8.030,
    lng: -34.935,
    details: 'Chuva de 110mm em 6h. Rio Capibaribe transbordou. Bairros da Zona Oeste alagados.',
  },
  {
    id: 'hist-2023-07-05',
    date: '05/07/2023',
    time: '10:00',
    areas: ['Boa Viagem', 'Setúbal', 'Piedade'],
    cause: 'both',
    severity: 'severe',
    lat: -8.115,
    lng: -34.895,
    details: 'Chuva de 85mm + maré 2.6m. Avenida Boa Viagem intransitável. Aeroporto fechado por 2h.',
  },
  {
    id: 'hist-2024-01-12',
    date: '12/01/2024',
    time: '17:00',
    areas: ['Boa Viagem', 'Pina', 'Brasília Teimosa'],
    cause: 'rain',
    severity: 'moderate',
    lat: -8.080,
    lng: -34.880,
    details: 'Chuva de verão com 45mm em 1h. Alagamentos rápidos em pontos baixos.',
  },
  {
    id: 'hist-2024-03-22',
    date: '22/03/2024',
    time: '05:00',
    areas: ['Casa Amarela', 'Nova Descoberta', 'Macaxeira'],
    cause: 'rain',
    severity: 'severe',
    lat: -8.018,
    lng: -34.925,
    details: 'Chuva noturna de 95mm. Deslizamentos em áreas de morro na Zona Norte.',
  },
  {
    id: 'hist-2024-05-10',
    date: '10/05/2024',
    time: '13:00',
    areas: ['Ibura', 'Jordão', 'COHAB', 'Barro'],
    cause: 'both',
    severity: 'severe',
    lat: -8.095,
    lng: -34.945,
    details: 'Chuva de 78mm + maré 2.4m. Alagamentos generalizados na Zona Sul. Escolas fechadas.',
  },
  {
    id: 'hist-2024-06-03',
    date: '03/06/2024',
    time: '20:00',
    areas: ['Centro', 'Santo Amaro', 'Afogados', 'Derby'],
    cause: 'rain',
    severity: 'moderate',
    lat: -8.055,
    lng: -34.900,
    details: 'Chuva de 55mm em 1.5h no centro. Trânsito parado. Metrô com lentidão.',
  },
  {
    id: 'hist-2025-02-19',
    date: '19/02/2025',
    time: '16:00',
    areas: ['Boa Viagem', 'Imbiribeira', 'Ipsep'],
    cause: 'rain',
    severity: 'moderate',
    lat: -8.098,
    lng: -34.900,
    details: 'Chuva de verão de 40mm em 30min. Alagamentos localizados na Zona Sul.',
  },
];

// ── Affected neighborhoods (dinâmicos) ──────────────────────
// Bairros prioritários de acordo com o risco

function getAffectedNeighborhoods(level: RiskLevel): string[] {
  const all = RECIFE_RISK_ZONES.map(z => z.name);

  if (level === 'baixo') return [];
  if (level === 'médio') return all.filter((_, i) => i % 4 === 0); // 3 bairros
  if (level === 'alto') return all.filter((_, i) => i % 2 === 0); // metade
  // crítico ou extremo: todos
  return all;
}

// ── Timeline (previsão hora a hora) ────────────────────────

function generateTimeline(
  weather: WeatherData[],
  tides: TideData[],
  hours: number = 24
): TimelineEvent[] {
  const timeline: TimelineEvent[] = [];
  const now = new Date();

  for (let h = 0; h < Math.min(hours, weather.length, tides.length); h++) {
    const w = weather[h];
    const t = tides[h];

    const rainRisk = precipitationToRisk(w?.precipitation ?? 0);
    const tideRisk = tideToRisk(t?.height ?? 1.0);

    const rainIdx = LEVEL_ORDER.indexOf(rainRisk);
    const tideIdx = LEVEL_ORDER.indexOf(tideRisk);

    let riskType: 'rain' | 'tide' | 'combined' = 'rain';
    let intensity: number;

    if (rainIdx >= 3 && tideIdx >= 2) {
      riskType = 'combined';
      intensity = Math.max(rainIdx, tideIdx) * 25 + 10;
    } else if (rainIdx > tideIdx) {
      riskType = 'rain';
      intensity = rainIdx * 25;
    } else {
      riskType = 'tide';
      intensity = tideIdx * 25;
    }

    const tHour = new Date(now.getTime() + h * 3600000);
    const hourStr = `${String(tHour.getHours()).padStart(2, '0')}:00`;

    timeline.push({
      hour: hourStr,
      riskType,
      intensity: Math.min(100, Math.max(0, intensity)),
      label: '',
    });
  }

  return timeline;
}

// ── API Principal ──────────────────────────────────────────

export interface RiskEngineOptions {
  /** Forçar refresh ignorando cache */
  forceRefresh?: boolean;
}

/**
 * Analisa o risco de alagamento em Recife usando apenas dados determinísticos.
 *
 * @returns RiskAnalysis completo, pronto para renderização
 */
export async function analyzeRisk(
  options: RiskEngineOptions = {}
): Promise<RiskAnalysis> {
  const { forceRefresh = false } = options;

  // Check cache
  if (!forceRefresh) {
    const cached = riskCache.get();
    if (cached) return cached;
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString('pt-BR');
  const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Busca dados em paralelo
  const [weather, tides] = await Promise.all([
    fetchWeatherForecast(),
    predictTides(24),
  ]);

  // ── Cálculo de níveis ──────────────────────────────────

  // Meteorológico: pico de precipitação nas próximas 24h
  const maxPrecipitation = weather.length > 0
    ? Math.max(...weather.slice(0, 24).map(w => w.precipitation))
    : 0;

  // Acumulado 24h para risco geotécnico
  const totalPrecipitation = weather.length > 0
    ? weather.slice(0, 24).reduce((sum, w) => sum + w.precipitation, 0)
    : 0;

  // Hidrológico: altura máxima da maré nas próximas 24h
  const maxTideHeight = tides.length > 0
    ? Math.max(...tides.map(t => t.height))
    : 1.0;

  // Pico (hora da maré mais alta)
  const peakTide = tides.length > 0
    ? tides.reduce((max, t) => t.height > max.height ? t : max, tides[0])
    : { time: '--:--', height: 1.0, type: 'high' as const };

  const meteoLevel = precipitationToRisk(maxPrecipitation);
  const hydroLevel = tideToRisk(maxTideHeight);
  const geoLevel = precipitationAccumulatedToRisk(totalPrecipitation);
  const overallLevel = combinedRisk(meteoLevel, hydroLevel, geoLevel);

  // ── Geração de conteúdo ────────────────────────────────

  const neighborhoods = getAffectedNeighborhoods(overallLevel);
  const template = getTemplate(overallLevel, meteoLevel, hydroLevel, maxPrecipitation, maxTideHeight, peakTide.time, neighborhoods);

  // Atualiza zonas de risco com nível dinâmico
  const riskZones: RiskZone[] = RECIFE_RISK_ZONES.map(zone => ({
    ...zone,
    level: neighborhoods.includes(zone.name) ? overallLevel : 'baixo',
  }));

  // Timeline
  const timeline = generateTimeline(weather, tides, 24);

  // Fontes de dados (grounding — agora são fontes de dados, não de busca)
  const sources: GroundingSource[] = [
    { title: 'Open-Meteo (previsão meteorológica)', uri: 'https://open-meteo.com/' },
    { title: 'TICON-4 (constantes harmônicas)', uri: 'https://doi.org/10.17882/53698' },
    { title: 'Porto do Recife (dados de maré)', uri: 'https://www.marinha.mil.br/chm/' },
    { title: 'Defesa Civil Recife', uri: 'https://defesacivil.recife.pe.gov.br/' },
  ];

  // ── Monta RiskAnalysis ─────────────────────────────────

  const analysis: RiskAnalysis = {
    level: overallLevel,
    breakdown: {
      meteorological: meteoLevel,
      hydrological: hydroLevel,
      geotechnical: geoLevel,
    },
    summary: {
      what: template.what,
      where: template.where,
      actions: template.actions,
    },
    title: template.title,
    message: template.message,
    technicalDetails: template.technicalDetails,
    recommendations: {
      general: template.generalRecs,
      slopes: template.slopesRecs,
      plains: template.plainsRecs,
    },
    affectedNeighborhoods: neighborhoods,
    liveWeather: weather.slice(0, 24).map(w => ({
      time: w.time,
      temp: w.temp,
      precipitation: w.precipitation,
      condition: w.condition,
    })),
    liveTides: tides,
    sources,
    history: RECIFE_FLOOD_HISTORY,
    riskZones,
    timeline,
    lastUpdate: `${dateStr} às ${timeStr}`,
    isStale: false,
  };

  // Cache
  riskCache.set(analysis);

  return analysis;
}

// ── Utilitários exportados ──────────────────────────────────
export {
  precipitationToRisk,
  tideToRisk,
  precipitationAccumulatedToRisk,
  floodRisk,
  combinedRisk,
  getTemplate,
  RECIFE_RISK_ZONES,
  RECIFE_FLOOD_HISTORY,
};
