// voiceService.ts - StreamElements TTS (GRATIS, SIN API KEY)

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log(`🔄 Generando audio con StreamElements TTS`);
  
  // StreamElements permite TTS gratis sin API key
  const voice = 'Conchita'; // Voz en español
  const url = `https://api.streamelements.com/kappa/v2/speech?voice=${voice}&text=${encodeURIComponent(text)}`;
  
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`StreamElements falló: ${response.status}`);
  }
  
  return await response.blob();
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
