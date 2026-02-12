
import { VoiceOption, ToneOption } from './types';

export const VOICE_OPTIONS: { name: VoiceOption; label: string; description: string; gender: 'M' | 'F' }[] = [
  // MASCULINOS
  { name: 'kore', label: 'Kore Master', description: 'Equilibrada y profesional', gender: 'M' },
  { name: 'puck', label: 'Puck Juvenil', description: 'Enérgica y rítmica', gender: 'M' },
  { name: 'charon', label: 'Charon Deep', description: 'Profunda y autoritaria', gender: 'M' },
  { name: 'fenrir', label: 'Fenrir Command', description: 'Voz de mando clara', gender: 'M' },
  { name: 'orus', label: 'Orus Leader', description: 'Narrativa clásica', gender: 'M' },
  { name: 'gacrux', label: 'Gacrux Hero', description: 'Épica y valiente', gender: 'M' },
  { name: 'achernar', label: 'Achernar Stern', description: 'Seria y formal', gender: 'M' },
  { name: 'algenib', label: 'Algenib Wise', description: 'Voz de sabio', gender: 'M' },
  { name: 'procyon', label: 'Procyon Tech', description: 'Moderna y tecnológica', gender: 'M' },
  { name: 'altair', label: 'Altair Space', description: 'Voz profunda espacial', gender: 'M' },
  { name: 'canopus', label: 'Canopus Noble', description: 'Elegante y madura', gender: 'M' },
  { name: 'sirius', label: 'Sirius Power', description: 'Impactante y fuerte', gender: 'M' },
  
  // FEMENINOS
  { name: 'zephyr', label: 'Zephyr Soft', description: 'Suave y acogedora', gender: 'F' },
  { name: 'aoede', label: 'Aoede Muse', description: 'Narrativa y dulce', gender: 'F' },
  { name: 'leda', label: 'Leda Class', description: 'Sofisticada y elegante', gender: 'F' },
  { name: 'enceladus', label: 'Enceladus Dark', description: 'Enigmática y profunda', gender: 'F' },
  { name: 'pulcherrima', label: 'Pulcherrima Bright', description: 'Juvenil y optimista', gender: 'F' },
  { name: 'callirrhoe', label: 'Callirrhoe Epic', description: 'Fuerte y legendaria', gender: 'F' },
  { name: 'despina', label: 'Despina Tech', description: 'Analítica y precisa', gender: 'F' },
  { name: 'vindemiatrix', label: 'Vindemiatrix Hunt', description: 'Ágil y decidida', gender: 'F' },
  { name: 'maia', label: 'Maia Spring', description: 'Fresca y natural', gender: 'F' },
  { name: 'adhara', label: 'Adhara Star', description: 'Brillante y clara', gender: 'F' },
  { name: 'capella', label: 'Capella Gold', description: 'Prestigiosa y cálida', gender: 'F' },
  { name: 'vega', label: 'Vega Night', description: 'Serena y profesional', gender: 'F' },
];

export const TONE_OPTIONS: { name: ToneOption; prompt: string; icon: string }[] = [
  { name: 'Neutral', prompt: 'Locución profesional estándar, dicción perfecta y ritmo constante:', icon: '⚖️' },
  { name: 'Terror', prompt: 'Locución de terror: susurros, pausas tensas y atmósfera de pavor absoluto:', icon: '👻' },
  { name: 'Reflexión', prompt: 'Tono profundo: cadencia lenta y énfasis en la introspección emocional:', icon: '🧘' },
  { name: 'Ciencia Ficción', prompt: 'Voz analítica y futurista: precisión tecnológica y frialdad:', icon: '🚀' },
  { name: 'Suspenso', prompt: 'Narración de thriller: mantén una tensión constante en cada palabra:', icon: '🕵️' },
  { name: 'Épico', prompt: 'Narración legendaria: fuerza cinematográfica y gran autoridad vocal:', icon: '⚔️' },
  { name: 'Alegre', prompt: 'Entusiasta y vibrante: sonrisa audible y ritmo dinámico:', icon: '☀️' },
  { name: 'Solemne', prompt: 'Tono ceremonial y respetuoso: voz resonante y pausada:', icon: '⛪' },
  { name: 'Comercial', prompt: 'Voz de ventas: persuasiva, con ritmo ascendente y muy entusiasta:', icon: '💰' },
  { name: 'Documental', prompt: 'Voz narrativa profunda: ritmo pausado, informativa y educativa:', icon: '🌍' },
  { name: 'Infantil', prompt: 'Voz de cuento: expresiva, juguetona, con tonos altos y amables:', icon: '🎈' },
  { name: 'Sarcástico', prompt: 'Tono irónico: énfasis marcado en el cinismo y la burla sutil:', icon: '😏' },
  { name: 'Misterioso', prompt: 'Susurros controlados: voz baja, intrigante y cargada de secretos:', icon: '🌑' },
  { name: 'Informativo', prompt: 'Dicción de reportero: rapidez, claridad total y neutralidad absoluta:', icon: '🎙️' },
  { name: 'Agresivo', prompt: 'Tono rudo, directo y cargado de adrenalina, voz de impacto:', icon: '🔥' },
  { name: 'Romántico', prompt: 'Suave, cálido y seductor, con pausas aireadas y muy emocional:', icon: '❤️' },
  { name: 'Deportivo', prompt: 'Ritmo acelerado, mucha energía, estilo narrador de fútbol:', icon: '⚽' },
  { name: 'Motivacional', prompt: 'Inspirador, con fuerza creciente y énfasis en palabras clave de éxito:', icon: '🏆' },
];

export const MOCK_USERS_DB_KEY = 'VOZPRO_USERS_DB';
export const SESSION_USER_KEY = 'VOZPRO_CURRENT_USER';
export const CHARS_PER_BLOCK = 3500;
