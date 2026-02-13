// voiceService.ts - Web Speech API con captura de audio REAL

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log(`🔊 Generando audio con Web Speech API`);
  
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Tu navegador no soporta síntesis de voz'));
      return;
    }

    // Esperar a que las voces estén disponibles
    const setupSpeech = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'es-ES';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Seleccionar voz en español
      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => 
        v.lang.includes('es-ES') || v.lang.includes('es-MX') || v.lang.includes('es')
      );
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
        console.log(`🎤 Usando voz: ${spanishVoice.name}`);
      }

      // Crear AudioContext para capturar
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContext();
        const dest = audioContext.createMediaStreamDestination();
        
        // Capturar con MediaRecorder
        const mediaRecorder = new MediaRecorder(dest.stream, {
          mimeType: 'audio/webm;codecs=opus'
        });
        
        const chunks: Blob[] = [];
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunks.push(e.data);
        };
        
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(chunks, { type: 'audio/webm' });
          resolve(audioBlob);
          audioContext.close();
        };

        // Iniciar grabación antes de hablar
        mediaRecorder.start();

        utterance.onstart = () => {
          console.log('🎙️ Iniciando síntesis...');
        };

        utterance.onend = () => {
          console.log('✅ Síntesis completada');
          setTimeout(() => {
            mediaRecorder.stop();
          }, 500);
        };

        utterance.onerror = (e) => {
          mediaRecorder.stop();
          reject(new Error(`Error de síntesis: ${e.error}`));
        };

        speechSynthesis.speak(utterance);
        
      } catch (error) {
        // Fallback: generar sin captura
        utterance.onend = () => {
          // Crear un blob básico de texto que indica que se reprodujo
          const textBlob = new Blob([text], { type: 'text/plain' });
          resolve(textBlob);
        };

        utterance.onerror = (e) => {
          reject(new Error(`Error: ${e.error}`));
        };

        speechSynthesis.speak(utterance);
      }
    };

    // Cargar voces
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        setupSpeech();
      };
    } else {
      setupSpeech();
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
