# Speech-to-Text Application

A modern, real-time speech-to-text transcription web application with dual transcription methods for maximum compatibility and accuracy.

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![OpenAI](https://img.shields.io/badge/OpenAI-Whisper-412991?style=flat-square&logo=openai)](https://openai.com/research/whisper)

## Features

### Dual Transcription Methods
- **Web Speech API**: Real-time, offline transcription with live feedback
- **OpenAI Whisper**: High-accuracy cloud transcription with advanced language support

### User Experience
- **Auto-Copy**: Automatically copy transcripts to clipboard after recording
- **Keyboard Shortcuts**: Space to record, Ctrl+C to copy, Ctrl+D to clear
- **Multi-Language Support**: 20+ languages for Web Speech API
- **Progressive Enhancement**: Graceful fallback when Web Speech API is unavailable
- **Responsive Design**: Works seamlessly on desktop and mobile devices

### Advanced Features
- **Real-time Timer**: Track recording duration
- **Live Transcription**: See text appear as you speak (Web Speech API)
- **File Upload**: Upload audio files for transcription via OpenAI Whisper
- **Export Options**: Copy to clipboard or download as text file
- **Error Recovery**: Smart error handling with helpful user guidance

## Quick Start

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm
- OpenAI API key (for Whisper transcription)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/speech-to-text.git
   cd speech-to-text
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   # Create .env.local file
   echo "OPENAI_API_KEY=your-openai-api-key-here" > .env.local
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Getting Started
1. **Choose Transcription Method**: Select between Web Speech (real-time) or OpenAI (high-accuracy)
2. **Select Language**: Choose your language (Web Speech API only)
3. **Start Recording**: Click the microphone button or press Space
4. **Speak Clearly**: Your speech will be transcribed in real-time or after processing
5. **Manage Transcript**: Copy, clear, or export your transcription

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Space` | Start/Stop recording |
| `Ctrl+C` | Copy transcript to clipboard |
| `Ctrl+D` | Clear transcript |

### Browser Compatibility
- **Recommended**: Chrome, Edge, Opera (full Web Speech API support)
- **Limited**: Firefox, Safari (OpenAI Whisper method only)
- **Mobile**: iOS Safari, Chrome Mobile (OpenAI Whisper recommended)

## Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/speech-to-text)

1. Connect your GitHub repository to Vercel
2. Add `OPENAI_API_KEY` environment variable
3. Deploy automatically

### Other Platforms

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Set environment variables**
   ```bash
   export OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Start the production server**
   ```bash
   npm start
   ```

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: UI library with latest features
- **TypeScript**: Type-safe development
- **TailwindCSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icon library

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **OpenAI API**: Whisper speech-to-text model
- **MediaRecorder API**: Browser audio recording

### Audio Processing
- **Web Speech API**: Browser-native speech recognition
- **MediaRecorder**: Real-time audio capture
- **Multiple Formats**: WebM, MP4, WAV, OGG support

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for Whisper transcription |

### Supported Languages (Web Speech API)

- English (US, UK)
- Spanish (Spain, Mexico)
- French, German, Italian
- Portuguese (Brazil)
- Chinese (Mandarin)
- Japanese, Korean
- Russian, Hindi, Arabic
- Dutch, Swedish, Danish
- Norwegian, Finnish, Polish

## API Reference

### POST /api/transcribe

Transcribe audio using OpenAI Whisper.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Audio file (max 25MB)

**Response:**
```json
{
  "text": "Transcribed text content",
  "language": "en",
  "duration": 15.6,
  "segments": [...],
  "words": [...]
}
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Performance

- **Real-time Processing**: Web Speech API provides instant feedback
- **Efficient Audio Handling**: Optimized MediaRecorder configuration
- **Minimal Bundle**: Tree-shaking and code splitting
- **Mobile Optimized**: Responsive design with touch-friendly controls

## Security

- **API Key Protection**: Environment variables for sensitive data
- **Input Validation**: File type and size validation
- **CORS Configuration**: Secure API endpoint setup
- **No Audio Storage**: Audio is processed and discarded immediately

## Limitations

### Current Limitations
- **Browser Support**: Web Speech API limited to Chromium browsers
- **File Size**: 25MB limit for OpenAI Whisper uploads
- **API Costs**: OpenAI charges per minute of audio processed
- **Network Dependency**: OpenAI method requires internet connection

### Planned Improvements
- Enhanced error handling and retry mechanisms
- Audio compression before upload
- Transcript history and session management
- Real-time collaborative editing
- Mobile app development