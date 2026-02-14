// voiceService.ts - Captura de audio REAL como WebM

let audioContext: AudioContext | null = null;

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log('🎤 Grabando audio real...');
  
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Tu navegador no soporta síntesis de voz'));
      return;
    }

    // Inicializar AudioContext
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    // Crear destino para grabar
    const dest = audioContext.createMediaStreamDestination();
    
    // Configurar MediaRecorder
    let mediaRecorder: MediaRecorder;
    try {
      mediaRecorder = new MediaRecorder(dest.stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
    } catch (e) {
      // Fallback si opus no está disponible
      mediaRecorder = new MediaRecorder(dest.stream);
    }

    const chunks: Blob[] = [];

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'audio/webm' });
      console.log(`✅ Audio grabado: ${blob.size} bytes`);
      resolve(blob);
    };

    // Crear utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Buscar voz en español
    const loadVoices = () => {
      const voices = speechSynthesis.getVoices();
      const spanishVoice = voices.find(v => 
        v.lang.startsWith('es-ES') || 
        v.lang.startsWith('es-MX') || 
        v.lang.startsWith('es')
      );
      
      if (spanishVoice) {
        utterance.voice = spanishVoice;
        console.log(`🎤 Voz seleccionada: ${spanishVoice.name}`);
      }

      // Empezar a grabar ANTES de hablar
      mediaRecorder.start();
      console.log('🔴 Grabación iniciada');

      utterance.onstart = () => {
        console.log('▶️ Síntesis iniciada');
      };

      utterance.onend = () => {
        console.log('⏹️ Síntesis completada, deteniendo grabación...');
        setTimeout(() => {
          mediaRecorder.stop();
        }, 500);
      };

      utterance.onerror = (e) => {
        console.error('❌ Error en síntesis:', e.error);
        mediaRecorder.stop();
        reject(new Error(`Error de síntesis: ${e.error}`));
      };

      // Hablar
      speechSynthesis.speak(utterance);
    };

    // Cargar voces
    const voices = speechSynthesis.getVoices();
    if (voices.length === 0) {
      speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    } else {
      loadVoices();
    }
  });
}

export async function playPreview(voiceName: string): Promise<void> {
  const previewText = "Hola, esta es una vista previa de voz.";
  
  if (!('speechSynthesis' in window)) {
    alert('Tu navegador no soporta síntesis de voz');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(previewText);
  utterance.lang = 'es-ES';
  utterance.rate = 1.0;
  
  const voices = speechSynthesis.getVoices();
  const spanishVoice = voices.find(v => v.lang.startsWith('es'));
  if (spanishVoice) utterance.voice = spanishVoice;

  speechSynthesis.speak(utterance);
}
