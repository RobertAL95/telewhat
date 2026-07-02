'use strict';

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

/**
 * Solicita acceso al micrófono e inicia la captura de audio binario.
 */
export async function startAudioRecording(): Promise<void> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error("El navegador no soporta la grabación de audio nativa.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  audioChunks = [];
  
  // Determinamos el formato de compresión óptimo según el navegador
  const options = MediaRecorder.isTypeSupported('audio/webm')
    ? { mimeType: 'audio/webm' }
    : { mimeType: 'audio/ogg' };

  mediaRecorder = new MediaRecorder(stream, options);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start(10); // Captura fragmentos cada 10ms para evitar pérdida de buffers
  console.log("🎙️ utils/audio: Grabación de micrófono iniciada.");
}

/**
 * Detiene la grabación, libera el hardware del micrófono y retorna el archivo empaquetado.
 */
export function stopAudioRecording(): Promise<File> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder) {
      return reject("No hay ninguna grabación activa en este momento.");
    }

    mediaRecorder.onstop = () => {
      // 1. Unificamos todos los fragmentos binarios acumulados en la RAM
      const audioBlob = new Blob(audioChunks, { type: mediaRecorder?.mimeType || 'audio/webm' });
      
      // 2. Apagamos físicamente el hardware del micrófono (el puntito rojo del navegador)
      mediaRecorder?.stream.getTracks().forEach(track => track.stop());
      
      // 3. Empaquetamos el Blob como un archivo File listo para handleSend
      const extension = mediaRecorder?.mimeType.includes('ogg') ? 'ogg' : 'webm';
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.${extension}`, {
        type: audioBlob.type,
      });

      // 4. Reseteamos los punteros globales de grabación
      mediaRecorder = null;
      audioChunks = [];
      
      console.log(`🎙️ utils/audio: Grabación finalizada con éxito. Tamaño: ${(audioFile.size / 1024).toFixed(2)} KB`);
      resolve(audioFile);
    };

    mediaRecorder.stop();
  });
}

/**
 * Cancela de forma abrupta la grabación actual y apaga el micrófono sin retornar datos.
 */
export function cancelAudioRecording(): void {
  if (mediaRecorder) {
    mediaRecorder.onstop = null; // Removemos el listener para ignorar los buffers residuales
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
    mediaRecorder = null;
    audioChunks = [];
    console.warn("🎙️ utils/audio: Grabación abortada y hardware liberado.");
  }
}