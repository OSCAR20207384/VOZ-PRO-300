// voiceService.ts - Captura audio real como WebM

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log('🎤 Capturando audio real...');
  
  return new Promise((resolve, reject) => {
    // Crear síntesis de voz
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Seleccionar voz en español
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) utterance.voice = spanishVoice;
    
    // Crear contexto de audio para grabar
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const dest = audioContext.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream);
    const chunks: Blob[] = [];
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      resolve(blob);
      audioContext.close();
    };
    
    // Iniciar grabación y síntesis simultáneamente
    recorder.start();
    
    utterance.onstart = () => {
      console.log('▶️ Reproduciendo y grabando...');
    };
    
    utterance.onend = () => {
      setTimeout(() => {
        recorder.stop();
        console.log('✅ Audio capturado');
      }, 500);
    };
    
    utterance.onerror = (e) => {
      recorder.stop();
      reject(new Error(`Error: ${e.error}`));
    };
    
    // Reproducir
    speechSynthesis.speak(utterance);
  });
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa";
  
  const utterance = new SpeechSynthesisUtterance(previewText);
  utterance.lang = 'es-ES';
  
  const voices = speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.includes('es'));
  if (spanishVoice) utterance.voice = spanishVoice;
  
  speechSynthesis.speak(utterance);
}
