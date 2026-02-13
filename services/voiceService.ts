// voiceService.ts - AUDIXA v2 CORRECTO (Async Workflow)

function detectAPIType(apiKey: string): 'audixa' | 'elevenlabs' | 'unknown' {
  const key = apiKey.trim();
  if (key.startsWith('adx_')) return 'audixa';
  if (key.startsWith('ak_') || key.startsWith('sk_')) return 'elevenlabs';
  return 'unknown';
}

// AUDIXA TTS (Sistema Asíncrono)
async function generateAudixaTTS(apiKey: string, text: string): Promise<Blob> {
  // Paso 1: Enviar solicitud de generación
  const ttsResponse = await fetch('https://api.audixa.ai/v2/tts', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: text,
      voice: 'am_ethan', // Voz en inglés, cambia según necesites
      model: 'base',
      speed: 1.0
    })
  });

  if (!ttsResponse.ok) {
    const error = await ttsResponse.text();
    console.error('Audixa TTS Error:', error);
    throw new Error(`Audixa TTS falló: ${ttsResponse.status}`);
  }

  const { generation_id } = await ttsResponse.json();
  console.log(`📝 Generation ID: ${generation_id}`);

  // Paso 2: Polling del estado hasta que esté listo
  let audioUrl = null;
  let attempts = 0;
  const maxAttempts = 30; // 30 segundos máximo

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo

    const statusResponse = await fetch(`https://api.audixa.ai/v2/status?generation_id=${generation_id}`, {
      headers: { 'x-api-key': apiKey }
    });

    if (!statusResponse.ok) {
      throw new Error(`Error al consultar estado: ${statusResponse.status}`);
    }

    const statusData = await statusResponse.json();
    console.log(`🔄 Estado: ${statusData.status}`);

    if (statusData.status === 'Completed') {
      audioUrl = statusData.url;
      break;
    } else if (statusData.status === 'Failed') {
      throw new Error('Generación de audio falló en Audixa');
    }

    attempts++;
  }

  if (!audioUrl) {
    throw new Error('Timeout: Audio no generado en 30 segundos');
  }

  // Paso 3: Descargar el audio
  console.log(`⬇️ Descargando audio desde: ${audioUrl}`);
  const audioResponse = await fetch(audioUrl);
  
  if (!audioResponse.ok) {
    throw new Error(`Error descargando audio: ${audioResponse.status}`);
  }

  return await audioResponse.blob();
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
        throw new Error(`Tipo de API no reconocido. Key: ${apiKey.substring(0, 8)}...`);
    }
  } catch (error: any) {
    console.error(`❌ Error:`, error.message);
    throw error;
  }
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hello, this is a voice preview test.";
  
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
