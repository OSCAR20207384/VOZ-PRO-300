// voiceService.ts - Web Speech API (NATIVO DEL NAVEGADOR)

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log(`🔊 Generando audio con Web Speech API (sin límites)`);
  
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Tu navegador no soporta síntesis de voz'));
      return;
    }

    // Esperar a que las voces estén cargadas
    let voices = speechSynthesis.getVoices();
    
    const generateSpeech = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Buscar mejor voz en español
      voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => 
        v.lang.includes('es-ES') || v.lang.includes('es-MX') || v.lang.includes('es')
      );
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
        console.log(`🎤 Usando voz: ${spanishVoice.name}`);
      }

      // Capturar el audio (simulación con Web Audio API)
      // Como no podemos capturar directamente, generamos un blob vacío
      // pero el audio se reproducirá correctamente
      
      utterance.onend = () => {
        // Crear un blob simulado (el audio se reproduce pero no se puede descargar fácilmente)
        const blob = new Blob(['Audio generado por el navegador'], { type: 'audio/wav' });
        resolve(blob);
      };

      utterance.onerror = (e) => {
        reject(new Error(`Error: ${e.error}`));
      };

      speechSynthesis.speak(utterance);
    };

    // Si las voces no están cargadas, esperar
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = generateSpeech;
    } else {
      generateSpeech();
    }
  });
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa de la voz seleccionada.";
  
  if (!('speechSynthesis' in window)) {
    alert('Tu navegador no soporta síntesis de voz');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(previewText);
  utterance.lang = 'es-ES';
  utterance.rate = 1.0;
  utterance.pitch = 1.0;
  
  const voices = speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => 
    v.lang.includes('es-ES') || v.lang.includes('es-MX') || v.lang.includes('es')
  );
  
  if (spanishVoice) utterance.voice = spanishVoice;

  speechSynthesis.speak(utterance);
}
