// voiceService.ts - Reproducción directa sin archivos

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log('🔊 Preparando audio...');
  
  // Reproducir inmediatamente
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    utterance.onend = () => {
      // Crear un blob pequeño que contenga el texto como referencia
      const textBlob = new Blob([`Audio de: ${text}`], { type: 'text/plain' });
      resolve(textBlob);
    };
    
    speechSynthesis.speak(utterance);
  });
}

export async function playPreview(voiceName: string): Promise<void> {
  const utterance = new SpeechSynthesisUtterance("Hola, esta es una vista previa");
  utterance.lang = 'es-ES';
  speechSynthesis.speak(utterance);
}
