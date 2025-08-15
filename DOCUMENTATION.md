# Speech-to-Text Application Documentation

## Overview

A modern web application that provides real-time speech-to-text transcription using two different methods:
- **Web Speech API** (browser-native, works offline)
- **OpenAI Whisper** (cloud-based, higher accuracy)

## Setup and Deployment Instructions

### Prerequisites

- Node.js 18+ and npm/pnpm
- OpenAI API key (for Whisper transcription)
- Modern browser (Chrome, Edge, Safari recommended)

### Local Development Setup

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd Speech-To-Text
   npm install
   # or
   pnpm install
   ```

2. **Environment Configuration**:
   Create a `.env.local` file in the root directory:
   ```env
   OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Run Development Server**:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Deployment

#### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add `OPENAI_API_KEY` environment variable in Vercel dashboard
3. Deploy automatically on push to main branch

#### Other Platforms
1. Build the application:
   ```bash
   npm run build
   npm start
   ```
2. Ensure environment variables are set on your hosting platform
3. Deploy the generated `.next` folder

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for Whisper transcription |

## API/Architecture Decisions

### Technology Stack

- **Framework**: Next.js 15 with App Router
- **UI Library**: React 19 with Radix UI components
- **Styling**: TailwindCSS 4.x
- **Speech Recognition**: 
  - Web Speech API (browser native)
  - OpenAI Whisper API (cloud service)
- **Audio Processing**: MediaRecorder API for recording

### Architecture Design

#### Frontend Architecture
```
app/
├── page.tsx                 # Main speech-to-text interface
├── layout.tsx              # Root layout with global styles
├── globals.css             # Global styles and TailwindCSS
└── api/
    └── transcribe/
        └── route.ts        # OpenAI Whisper API endpoint

lib/
└── aiml-stt.ts            # OpenAI transcription utilities

components/
└── ui/                    # Reusable UI components (Radix UI based)
```

#### Key Design Decisions

1. **Dual Transcription Methods**:
   - **Web Speech API**: Real-time, offline, free, but limited browser support
   - **OpenAI Whisper**: High accuracy, broad format support, but requires API costs

2. **Progressive Enhancement**:
   - App gracefully degrades when Web Speech API is unavailable
   - Automatically switches to OpenAI method in unsupported browsers
   - No blocking error screens - always functional

3. **Audio Format Support**:
   - Primary: WebM with Opus codec
   - Fallbacks: MP4, WAV, OGG
   - Dynamic MIME type detection and selection

4. **State Management**:
   - React hooks for local state management
   - No external state library needed for this scope
   - Real-time UI updates for transcription status

#### API Design

**POST /api/transcribe**
- Accepts FormData with audio file
- File size limit: 25MB (OpenAI Whisper limit)
- Supported formats: WebM, MP4, WAV, OGG
- Returns: Transcription text with metadata

```typescript
Response: {
  text: string;           // Transcribed text
  language: string;       // Detected language
  duration: number;       // Audio duration
  segments: Array;        // Time-segmented transcription
  words: Array;          // Word-level timestamps
}
```

### User Experience Features

1. **Keyboard Shortcuts**:
   - `Space`: Start/Stop recording
   - `Ctrl+C`: Copy transcript to clipboard
   - `Ctrl+D`: Clear transcript

2. **Auto-Copy Feature**:
   - Optional automatic clipboard copy after recording ends
   - User-configurable toggle

3. **Real-time Feedback**:
   - Recording timer
   - Live transcription display (Web Speech API)
   - Progress indicators for processing

4. **Responsive Design**:
   - Mobile-friendly interface
   - Touch-optimized controls
   - Adaptive layout for different screen sizes

## Known Limitations and Future Improvements

### Current Limitations

#### Browser Compatibility
- **Web Speech API**: Limited to Chromium-based browsers (Chrome, Edge, Opera)
- **Firefox/Safari**: Web Speech API support varies or is disabled by default
- **Mobile browsers**: Inconsistent Web Speech API support

#### Technical Constraints
- **File Size**: 25MB limit for OpenAI Whisper uploads
- **Network Dependency**: OpenAI method requires internet connection
- **API Costs**: OpenAI Whisper charges per minute of audio processed
- **Language Support**: Web Speech API language support varies by browser

#### User Experience
- **No offline backup**: When both methods fail, no fallback available
- **No audio playback**: Cannot review recorded audio before transcription
- **Single session**: No transcript history or session management

### Future Improvements

#### Short-term Enhancements

1. **Enhanced Audio Support**:
   - Audio file upload from device storage
   - Support for more audio formats (MP3, FLAC, etc.)
   - Audio compression before upload to reduce costs

2. **Better Error Handling**:
   - Retry mechanisms for failed transcriptions
   - Better network error recovery
   - Graceful degradation strategies

3. **User Experience**:
   - Transcript editing capabilities
   - Export options (TXT, PDF, DOCX)
   - Undo/redo functionality
   - Search within transcripts

#### Medium-term Features

1. **Session Management**:
   - Save transcripts locally (localStorage/IndexedDB)
   - Transcript history and organization
   - Named sessions and projects

2. **Advanced Transcription**:
   - Speaker identification and diarization
   - Custom vocabulary/terminology support
   - Real-time translation capabilities
   - Punctuation and formatting improvements

3. **Collaboration Features**:
   - Share transcripts via links
   - Real-time collaborative editing
   - Comments and annotations

#### Long-term Roadmap

1. **AI Integration**:
   - Smart summarization of long transcripts
   - Key topic extraction and tagging
   - Sentiment analysis and insights
   - Integration with other AI models (Claude, GPT-4, etc.)

2. **Enterprise Features**:
   - User authentication and accounts
   - Team workspaces and permissions
   - API access for developers
   - Custom model training and fine-tuning

3. **Platform Extensions**:
   - Desktop application (Electron)
   - Mobile app (React Native)
   - Browser extensions for meeting transcription
   - Integration with video conferencing tools (Zoom, Teams, etc.)

## Development Approach

### Code Organization

1. **Component Structure**:
   - Single main component (`page.tsx`) with all transcription logic
   - Reusable UI components in `/components/ui/`
   - Utility functions in `/lib/`

2. **State Management Philosophy**:
   - Local state with React hooks
   - Minimal external dependencies
   - Clear separation of concerns

3. **Error Handling Strategy**:
   - Graceful degradation over hard failures
   - User-friendly error messages
   - Automatic fallback mechanisms

### Testing Strategy

Currently minimal testing setup. Recommended additions:

1. **Unit Tests**:
   - Audio processing functions
   - API route handlers
   - Utility functions

2. **Integration Tests**:
   - Full transcription workflows
   - Browser compatibility testing
   - API error scenarios

3. **E2E Tests**:
   - Complete user journeys
   - Cross-browser testing
   - Mobile device testing

### Performance Considerations

1. **Optimization Implemented**:
   - Efficient audio chunk processing
   - Minimal re-renders with proper React patterns
   - Lazy loading of heavy components

2. **Areas for Improvement**:
   - Audio compression before upload
   - Streaming transcription for long audio
   - Worker threads for audio processing
   - CDN optimization for assets

### Security Considerations

1. **Current Measures**:
   - Environment variable protection for API keys
   - Input validation for file uploads
   - CORS configuration for API routes

2. **Future Security Enhancements**:
   - Rate limiting for API endpoints
   - File type validation and sanitization
   - User authentication and authorization
   - Audit logging for transcription activities

---

*Last updated: January 2025*