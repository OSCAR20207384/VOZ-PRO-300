// voiceService.ts - Genera MP3 reales descargables

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log('🔊 Generando MP3 descargable...');
  
  // Dividir texto en fragmentos de máximo 200 caracteres (límite de Google TTS)
  const maxLength = 200;
  const fragments = [];
  
  for (let i = 0; i < text.length; i += maxLength) {
    fragments.push(text.substring(i, i + maxLength));
  }
  
  // Generar audio para cada fragmento
  const audioBlobs = [];
  
  for (const fragment of fragments) {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=es&client=tw-ob&q=${encodeURIComponent(fragment)}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error generando audio: ${response.status}`);
    }
    
    const blob = await response.blob();
    audioBlobs.push(blob);
    
    // Pausa breve entre peticiones
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  // Combinar todos los fragmentos en un solo blob MP3
  const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
  
  // IMPORTANTE: Reproducir el audio automáticamente
  const audioUrl = URL.createObjectURL(combinedBlob);
  const audio = new Audio(audioUrl);
  audio.play();
  
  return combinedBlob;
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
  }
}
