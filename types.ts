
export enum UserStatus {
  ACTIVO = 'ACTIVO',
  DESACTIVADO = 'DESACTIVADO'
}

export interface User {
  email: string;
  estado: UserStatus;
  nombre: string;
  fecha_inicio: string;
  fecha_expiracion: string;
  notas: string;
  dispositivos_activos: string[];
}

export interface AudioBlock {
  id: string;
  text: string;
  filename: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
}

// Cambiado a string para soportar voces dinámicas VIP
export type VoiceOption = string;

// Se agregaron 'Agresivo', 'Romántico', 'Deportivo' y 'Motivacional' para corregir errores de tipo en constants.ts
export type ToneOption = 
  | 'Neutral' | 'Terror' | 'Reflexión' | 'Ciencia Ficción' 
  | 'Suspenso' | 'Épico' | 'Alegre' | 'Solemne'
  | 'Comercial' | 'Documental' | 'Infantil' | 'Sarcástico' | 'Misterioso' | 'Informativo'
  | 'Agresivo' | 'Romántico' | 'Deportivo' | 'Motivacional';

export interface VoiceCloneProfile {
  id: string;
  name: string;
  description: string;
  analysisPrompt: string;
  isActive: boolean;
  gender?: 'M' | 'F';
}

export interface ProjectState {
  title: string;
  script: string;
  voice: VoiceOption;
  tone: ToneOption;
  isAutoDownload: boolean;
  blocks: AudioBlock[];
  isProcessing: boolean;
  activeCloneProfile?: VoiceCloneProfile;
}
