import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    console.log('=== OpenAI Whisper Transcribe API called ===');
    
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    
    if (!audioFile) {
      console.log('No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    console.log('Received audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: audioFile.size
    });

    // Check file size (OpenAI Whisper limit is 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      console.log('File too large:', audioFile.size);
      return NextResponse.json({ error: 'File too large (max 25MB)' }, { status: 400 });
    }

    console.log('Sending to OpenAI Whisper API...');
    
    // Create a new File object for OpenAI API
    const file = new File([audioFile], audioFile.name, {
      type: audioFile.type,
    });

    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['word']
    });

    console.log('OpenAI Whisper API response:', transcription);

    return NextResponse.json({ 
      text: transcription.text,
      language: transcription.language,
      duration: transcription.duration,
      segments: transcription.segments,
      words: transcription.words
    });
  } catch (error: any) {
    console.error('=== OpenAI Whisper API Error ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
      console.error('Response headers:', error.response.headers);
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to transcribe audio with OpenAI Whisper', 
        details: error.response?.data?.message || error.message,
        status: error.response?.status
      }, 
      { status: 500 }
    );
  }
}