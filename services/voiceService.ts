// voiceService.ts - CON AUDIXA (100% GRATIS)

function detectAPIType(apiKey: string): 'audixa' | 'elevenlabs' | 'unknown' {
  const key = apiKey.trim();
  
  // Audixa API (empieza con "adx_")
  if (key.startsWith('adx_')) return 'audixa';
  
  // ElevenLabs
  if (key.startsWith('ak_') || key.startsWith('sk_')) return 'elevenlabs';
  
  return 'unknown';
}

// AUDIXA TTS (GRATIS SIN LÍMITES)
async function generateAudixaTTS(apiKey: string, text: string): Promise<Blob> {
  const response = await fetch('https://api.audixa.ai/v1/text-to-speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      voice_id: 'es-ES-Standard-A',
      speed: 1.0,
      audio_format: 'mp3'
    })
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Audixa Error:', error);
    throw new Error(`Audixa falló: ${response.status} - ${error}`);
  }

  return await response.blob();
}

// ELEVENLABS (backup)
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

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  const apiType = detectAPIType(apiKey);
  console.log(`🔄 Usando API: ${apiType.toUpperCase()}`);
  
  try {
    switch (apiType) {
      case 'audixa':
        return await generateAudixaTTS(apiKey, text);
      
      case 'elevenlabs':
        return await generateElevenLabsTTS(apiKey, text);
      
      default:
        throw new Error(`API no reconocida. Key: ${apiKey.substring(0, 8)}...`);
    }
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una prueba de voz.";
  
  const savedKeys = localStorage.getItem('VOZPRO_KEYS_V3');
  const savedEnabled = localStorage.getItem('VOZPRO_ENABLED_V3');
  
  if (!savedKeys || !savedEnabled) return;
  
  const keys = JSON.parse(savedKeys);
  const enabled = JSON.parse(savedEnabled);
  
  const firstActiveKey = Object.keys(keys).find(
    id => enabled[id] && keys[id]?.trim()
  );
  
  if (!firstActiveKey) {
    alert('Configura al menos una API Key');
    return;
  }
  
  try {
    const audioBlob = await generateAudio(keys[firstActiveKey], previewText);
    const audio = new Audio(URL.createObjectURL(audioBlob));
    await audio.play();
  } catch (error) {
    console.error('Error en preview:', error);
  }
}
