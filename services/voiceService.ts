// voiceService.ts - VERSIÓN CON APIs TTS GRATUITAS REALES

function detectAPIType(apiKey: string): 'google' | 'elevenlabs' | 'playht' | 'wellsaid' | 'unknown' {
  const key = apiKey.trim();
  
  // Google Cloud TTS: "AIza..."
  if (key.startsWith('AIza')) return 'google';
  
  // ElevenLabs: "ak_..." o "sk_..."
  if (key.startsWith('ak_') || (key.startsWith('sk_') && key.length > 40)) return 'elevenlabs';
  
  // Play.ht: formato específico
  if (key.includes('playht') || key.startsWith('ph_')) return 'playht';
  
  // WellSaid Labs
  if (key.startsWith('ws_')) return 'wellsaid';
  
  return 'unknown';
}

// GOOGLE CLOUD TTS (GRATIS: 1M caracteres/mes)
async function generateGoogleTTS(apiKey: string, text: string): Promise<Blob> {
  const response = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: { languageCode: 'es-ES', name: 'es-ES-Neural2-A', ssmlGender: 'FEMALE' },
        audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0.0 }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Google TTS Error:', error);
    throw new Error(`Google TTS falló: ${response.status}`);
  }
  
  const data = await response.json();
  const binary = atob(data.audioContent);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  
  return new Blob([bytes], { type: 'audio/mpeg' });
}

// ELEVENLABS (GRATIS: 10,000 caracteres/mes)
async function generateElevenLabsTTS(apiKey: string, text: string): Promise<Blob> {
  const response = await fetch(
    'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM',
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.5, similarity_boost: 0.5 }
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('ElevenLabs Error:', error);
    throw new Error(`ElevenLabs falló: ${response.status}`);
  }
  
  return await response.blob();
}

// PLAY.HT (GRATIS con límites)
async function generatePlayHtTTS(apiKey: string, text: string): Promise<Blob> {
  const response = await fetch(
    'https://api.play.ht/api/v2/tts',
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-User-ID': 'YOUR_USER_ID', // Reemplazar con tu User ID
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        voice: 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json',
        output_format: 'mp3'
      })
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error('Play.ht Error:', error);
    throw new Error(`Play.ht falló: ${response.status}`);
  }
  
  return await response.blob();
}

// FUNCIÓN PRINCIPAL
export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  const apiType = detectAPIType(apiKey);
  console.log(`🔄 Usando API: ${apiType.toUpperCase()} para generar audio`);
  
  try {
    switch (apiType) {
      case 'google':
        return await generateGoogleTTS(apiKey, text);
      
      case 'elevenlabs':
        return await generateElevenLabsTTS(apiKey, text);
      
      case 'playht':
        return await generatePlayHtTTS(apiKey, text);
      
      default:
        throw new Error(`Tipo de API no reconocido. Key: ${apiKey.substring(0, 8)}...`);
    }
  } catch (error: any) {
    console.error(`❌ Error en ${apiType}:`, error.message);
    throw error;
  }
}

// PREVIEW DE VOZ
export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa de la voz seleccionada.";
  
  const savedKeys = localStorage.getItem('VOZPRO_KEYS_V3');
  const savedEnabled = localStorage.getItem('VOZPRO_ENABLED_V3');
  
  if (!savedKeys || !savedEnabled) {
    console.warn('No hay keys configuradas para preview');
    return;
  }
  
  const keys = JSON.parse(savedKeys);
  const enabled = JSON.parse(savedEnabled);
  
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
