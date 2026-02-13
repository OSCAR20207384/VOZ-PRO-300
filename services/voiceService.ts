// voiceService.ts - Sistema Multi-API con rotación automática

interface VoiceConfig {
  model: string;
  voice?: string;
  speed?: number;
}

// Detectar tipo de API según formato de la key
function detectAPIType(apiKey: string): 'gemini' | 'deepseek' | 'longcat' | 'unknown' {
  const key = apiKey.trim();
  
  // Google Gemini: comienza con "AIza"
  if (key.startsWith('AIza')) return 'gemini';
  
  // DeepSeek: comienza con "sk-" y contiene "deepseek"
  if (key.startsWith('sk-') && key.toLowerCase().includes('deepseek')) return 'deepseek';
  
  // LongCat: comienza con "lc-" o formato específico
  if (key.startsWith('lc-') || key.startsWith('sk-lc')) return 'longcat';
  
  // Si empieza con "sk-" pero no es deepseek, asumir estándar OpenAI-compatible
  if (key.startsWith('sk-')) return 'longcat'; // LongCat usa formato OpenAI
  
  return 'unknown';
}

// ==================== GEMINI TEXT-TO-SPEECH ====================
async function generateGeminiAudio(apiKey: string, text: string): Promise<Blob> {
  // Gemini usa la API de Google Cloud Text-to-Speech
  const endpoint = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;
  
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'es-ES',
        name: 'es-ES-Neural2-A', // Voz española neural
        ssmlGender: 'FEMALE'
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 1.0,
        pitch: 0.0
      }
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Gemini API Error:', error);
    throw new Error(`Gemini falló: ${response.status} - ${error}`);
  }

  const data = await response.json();
  
  // Google devuelve audio en Base64
  const audioContent = data.audioContent;
  const binaryString = atob(audioContent);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'audio/mpeg' });
}

// ==================== DEEPSEEK TEXT-TO-SPEECH ====================
async function generateDeepSeekAudio(apiKey: string, text: string): Promise<Blob> {
  // DeepSeek usa formato OpenAI-compatible
  const response = await fetch('https://api.deepseek.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1', // Modelo estándar de TTS
      input: text,
      voice: 'nova', // Opciones: alloy, echo, fable, onyx, nova, shimmer
      response_format: 'mp3',
      speed: 1.0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('DeepSeek API Error:', error);
    throw new Error(`DeepSeek falló: ${response.status} - ${error}`);
  }

  // DeepSeek devuelve audio directo
  return await response.blob();
}

// ==================== LONGCAT TEXT-TO-SPEECH ====================
async function generateLongCatAudio(apiKey: string, text: string): Promise<Blob> {
  // LongCat usa formato OpenAI con su endpoint específico
  const response = await fetch('https://api.longcat.ai/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: 'alloy', // Opciones según LongCat
      response_format: 'mp3',
      speed: 1.0
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('LongCat API Error:', error);
    throw new Error(`LongCat falló: ${response.status} - ${error}`);
  }

  return await response.blob();
}

// ==================== FUNCIÓN PRINCIPAL MULTI-API ====================
export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  const apiType = detectAPIType(apiKey);
  
  console.log(`🔄 Usando API: ${apiType.toUpperCase()} para generar audio`);
  
  try {
    switch (apiType) {
      case 'gemini':
        return await generateGeminiAudio(apiKey, text);
      
      case 'deepseek':
        return await generateDeepSeekAudio(apiKey, text);
      
      case 'longcat':
        return await generateLongCatAudio(apiKey, text);
      
      default:
        throw new Error(`Tipo de API no reconocido. Key: ${apiKey.substring(0, 8)}...`);
    }
  } catch (error: any) {
    console.error(`❌ Error en ${apiType}:`, error.message);
    throw error; // Re-lanzar para que el sistema de rotación lo maneje
  }
}

// ==================== PREVIEW DE VOZ ====================
export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa de la voz seleccionada.";
  
  // Usar una key activa del localStorage para el preview
  const savedKeys = localStorage.getItem('VOZPRO_KEYS_V3');
  const savedEnabled = localStorage.getItem('VOZPRO_ENABLED_V3');
  
  if (!savedKeys || !savedEnabled) {
    console.warn('No hay keys configuradas para preview');
    return;
  }
  
  const keys = JSON.parse(savedKeys);
  const enabled = JSON.parse(savedEnabled);
  
  // Buscar primera key activa
  const firstActiveKey = Object.keys(keys).find(
    id => enabled[id] && keys[id]?.trim()
  );
  
  if (!firstActiveKey) {
    alert('Configura al menos una API Key para escuchar previews');
    return;
  }
  
  try {
    const audioBlob = await generateAudio(keys[firstActiveKey], previewText);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (error) {
    console.error('Error en preview:', error);
    alert('No se pudo reproducir el preview');
  }
}
