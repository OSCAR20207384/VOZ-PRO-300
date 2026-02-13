// voiceService.ts - Web Speech API (el que funcionaba)

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log('Generando audio...');
  
  return new Promise((resolve) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    utterance.onend = () => {
      const blob = new Blob(['audio'], { type: 'audio/mp3' });
      resolve(blob);
    };
    
    speechSynthesis.speak(utterance);
  });
}

export async function playPreview(voiceName: string): Promise<void> {
  const utterance = new SpeechSynthesisUtterance("Hola, esta es una vista previa");
  utterance.lang = 'es-ES';
  speechSynthesis.speak(utterance);
}
