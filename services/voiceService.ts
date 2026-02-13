// voiceService.ts - TTS con MP3 REAL descargable

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log(`🔊 Generando audio MP3...`);
  
  // Usar API pública gratuita que genera MP3 reales
  const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(text)}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Error ${response.status}`);
    }
    
    const audioBlob = await response.blob();
    
    // Asegurar que sea tipo MP3
    return new Blob([audioBlob], { type: 'audio/mpeg' });
    
  } catch (error) {
    console.error('Error generando audio:', error);
    throw new Error('No se pudo generar el audio. Intenta de nuevo.');
  }
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa de voz.";
  
  try {
    const audioBlob = await generateAudio('', previewText);
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    await audio.play();
  } catch (error) {
    console.error('Error en preview:', error);
    alert('No se pudo reproducir el preview');
  }
}
