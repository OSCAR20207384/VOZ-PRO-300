// voiceService.ts - VoiceRSS (GRATIS 350 req/día)

function detectAPIType(apiKey: string): 'voicerss' | 'freetts' | 'unknown' {
  const key = apiKey.trim();
  
  // VoiceRSS: formato alfanumérico
  if (key.length === 32 && !key.includes('_')) return 'voicerss';
  
  // Cualquier otra
  return 'freetts';
}

// VoiceRSS API (GRATIS)
async function generateVoiceRSS(apiKey: string, text: string): Promise<Blob> {
  const params = new URLSearchParams({
    key: apiKey,
    src: text,
    hl: 'es-es',
    v: 'Rosa', // Voz femenina en español
    c: 'MP3',
    f: '44khz_16bit_stereo',
    r: '0' // velocidad normal
  });

  const url = `https://api.voicerss.org/?${params.toString()}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const error = await response.text();
    console.error('VoiceRSS Error:', error);
    throw new Error(`VoiceRSS falló: ${response.status}`);
  }

  const contentType = response.headers.get('content-type');
  
  // Verificar si hay error en la respuesta
  if (contentType?.includes('text/plain') || contentType?.includes('text/html')) {
    const errorText = await response.text();
    throw new Error(`VoiceRSS error: ${errorText}`);
  }
  
  return await response.blob();
}

// API GRATUITA DE RESPALDO (FreeTTS - sin key)
async function generateFreeTTS(text: string): Promise<Blob> {
  // Usar TTS gratuito de responsivevoice como fallback
  const url = `https://code.responsivevoice.org/getvoice.php?t=${encodeURIComponent(text)}&tl=es-ES&sv=&vn=&pitch=0.5&rate=0.5&vol=1`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`FreeTTS falló: ${response.status}`);
  }
  
  return await response.blob();
}

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  const apiType = detectAPIType(apiKey);
  console.log(`🔄 Usando API: ${apiType.toUpperCase()}`);
  
  try {
    if (apiType === 'voicerss' && apiKey.length > 10) {
      return await generateVoiceRSS(apiKey, text);
    } else {
      return await generateFreeTTS(text);
    }
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa de voz.";
  
  try {
    // Intentar con FreeTTS (sin key)
    const audioBlob = await generateFreeTTS(previewText);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (error) {
    console.error('Error en preview:', error);
    
    // Fallback a Web Speech API
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(previewText);
      utterance.lang = 'es-ES';
      speechSynthesis.speak(utterance);
    }
  }
}
