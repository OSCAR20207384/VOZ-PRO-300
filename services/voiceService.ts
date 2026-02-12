
import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceOption, ToneOption, VoiceCloneProfile } from '../types';
import { TONE_OPTIONS } from '../constants';

/**
 * Decodifica una cadena base64 a un Uint8Array de forma segura.
 */
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodifica datos PCM crudos (16-bit) devueltos por la API a un AudioBuffer.
 * Se usa el desplazamiento (offset) correcto para evitar distorsiones o errores de memoria.
 */
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // Aseguramos que el buffer esté alineado a 2 bytes para Int16
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Convierte un AudioBuffer a un Blob MP3 utilizando lamejs.
 * Optimizado para ser procesado en pequeños fragmentos y evitar bloqueos.
 */
function audioBufferToMp3(buffer: AudioBuffer): Blob {
  const lame = (window as any).lamejs;
  if (!lame) {
    console.error("Lamejs no detectado en el window. Se requiere para exportar a MP3.");
    return new Blob([], { type: 'audio/mp3' });
  }

  const channels = 1; // Mono para máxima compatibilidad y menor peso
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new lame.Mp3Encoder(channels, sampleRate, 128);
  const mp3Data: Uint8Array[] = [];
  
  const samples = buffer.getChannelData(0);
  const sampleBlockSize = 1152;
  
  for (let i = 0; i < samples.length; i += sampleBlockSize) {
    const sampleChunk = samples.subarray(i, i + sampleBlockSize);
    const int16Samples = new Int16Array(sampleChunk.length);
    for (let j = 0; j < sampleChunk.length; j++) {
      // Hard clipping para evitar distorsión digital
      let s = Math.max(-1, Math.min(1, sampleChunk[j]));
      int16Samples[j] = s < 0 ? s * 32768 : s * 32767;
    }
    const mp3buf = mp3encoder.encodeBuffer(int16Samples);
    if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
  }
  
  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) mp3Data.push(new Uint8Array(mp3buf));
  
  return new Blob(mp3Data, { type: 'audio/mp3' });
}

export const analyzeVoiceReference = async (audioBase64: string, apiKey: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: audioBase64, mimeType: "audio/mp3" } },
          { text: "Analiza el timbre y tono de esta voz. Devuelve solo los parámetros técnicos para replicarla en TTS." }
        ]
      }
    });
    return response.text || "ADN Vocal detectado.";
  } catch (e: any) {
    console.error("Error en análisis:", e);
    throw e;
  }
};

export const generateAudio = async (
  text: string, 
  voice: VoiceOption, 
  apiKey: string,
  tone: ToneOption = 'Neutral',
  cloneProfile?: VoiceCloneProfile
): Promise<Blob> => {
  const toneOption = TONE_OPTIONS.find(t => t.name === tone);
  const toneInstruction = toneOption?.prompt || '';
  const cloneInstruction = cloneProfile ? `ADN: ${cloneProfile.analysisPrompt}` : '';
  
  // Prompt ultra-minimalista para reducir el tiempo de razonamiento del modelo
  const prompt = `${toneInstruction} ${cloneInstruction}. Lee: "${text}"`;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: voice } 
          } 
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("La API no devolvió datos de audio.");

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const buffer = await decodeAudioData(decode(base64Audio), ctx, 24000, 1);
    return audioBufferToMp3(buffer);
  } catch (e) {
    console.error("Error en generación:", e);
    throw e;
  }
};

export const playPreview = async (voice: VoiceOption, apiKey: string, tone: ToneOption = 'Neutral', cloneProfile?: VoiceCloneProfile) => {
  const blob = await generateAudio("Voz lista.", voice, apiKey, tone, cloneProfile);
  const audio = new Audio(URL.createObjectURL(blob));
  await audio.play();
};
