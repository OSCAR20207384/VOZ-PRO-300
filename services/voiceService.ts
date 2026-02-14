// voiceService.ts - Grabación con límite de tiempo

export async function generateAudio(apiKey: string, text: string): Promise<Blob> {
  console.log('🎤 Generando audio...');
  
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Tu navegador no soporta síntesis de voz'));
      return;
    }

    // Crear síntesis
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    // Seleccionar voz
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(v => v.lang.includes('es'));
    if (spanishVoice) {
      utterance.voice = spanishVoice;
      console.log(`🎤 Voz: ${spanishVoice.name}`);
    }

    // Variables de control
    let audioChunks: Blob[] = [];
    let recorder: MediaRecorder | null = null;
    let isRecording = false;

    try {
      // Crear AudioContext y destino
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const dest = audioContext.createMediaStreamDestination();
      
      // Crear MediaRecorder con timeslice
      recorder = new MediaRecorder(dest.stream);
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0 && isRecording) {
          audioChunks.push(e.data);
          console.log(`📦 Chunk: ${e.data.size} bytes`);
        }
      };

      recorder.onstop = () => {
        isRecording = false;
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log(`✅ Total: ${blob.size} bytes`);
        audioContext.close();
        resolve(blob);
      };

      // Iniciar grabación con intervalo de 100ms
      recorder.start(100);
      isRecording = true;
      console.log('🔴 Grabación iniciada');

    } catch (error) {
      console.error('❌ Error al crear grabador:', error);
    }

    // Eventos de síntesis
    utterance.onstart = () => {
      console.log('▶️ Reproduciendo...');
    };

    utterance.onend = () => {
      console.log('⏹️ Síntesis terminada');
      
      // Detener grabación después de medio segundo
      setTimeout(() => {
        if (recorder && isRecording) {
          recorder.stop();
        }
      }, 500);
    };

    utterance.onerror = (e) => {
      console.error('❌ Error:', e.error);
      if (recorder && isRecording) {
        recorder.stop();
      }
      reject(new Error(`Error: ${e.error}`));
    };

    // Hablar
    speechSynthesis.speak(utterance);

    // LÍMITE DE SEGURIDAD: detener después de 30 segundos máximo
    setTimeout(() => {
      if (recorder && isRecording) {
        console.warn('⚠️ Tiempo límite alcanzado, deteniendo...');
        recorder.stop();
        speechSynthesis.cancel();
      }
    }, 30000);
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
