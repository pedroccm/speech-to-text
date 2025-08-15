// OpenAI Whisper Speech-to-Text utilities

export const transcribeAudioFile = async (audioFile: File): Promise<string> => {
  try {
    console.log('Transcribing file via OpenAI Whisper:', audioFile.name, audioFile.type, audioFile.size);
    
    const formData = new FormData();
    formData.append('audio', audioFile);

    const response = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to transcribe');
    }

    const data = await response.json();
    return data.text;
  } catch (error: any) {
    console.error('Transcription error:', error);
    throw new Error(`Failed to transcribe audio: ${error.message}`);
  }
};

export const transcribeAudioUrl = async (audioUrl: string): Promise<string> => {
  try {
    // Fetch the audio file from URL and convert to File object
    const response = await fetch(audioUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch audio file');
    }
    
    const audioBlob = await response.blob();
    const audioFile = new File([audioBlob], 'audio.mp3', { type: audioBlob.type });
    
    return await transcribeAudioFile(audioFile);
  } catch (error) {
    console.error('Error transcribing audio URL:', error);
    throw new Error('Failed to transcribe audio from URL');
  }
};

export const transcribeAudioBlob = async (audioBlob: Blob): Promise<string> => {
  try {
    // Keep the original MIME type from the blob
    const fileName = audioBlob.type.includes('webm') ? 'audio.webm' : 'audio.wav';
    const file = new File([audioBlob], fileName, { type: audioBlob.type });
    return await transcribeAudioFile(file);
  } catch (error) {
    console.error('Error transcribing audio blob:', error);
    throw new Error('Failed to transcribe audio blob');
  }
};