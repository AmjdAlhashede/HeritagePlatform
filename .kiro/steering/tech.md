# Technology Stack

## Android App

### Core Technologies
- **Language**: Kotlin
- **UI Framework**: Jetpack Compose
- **Architecture**: MVVM with Clean Architecture principles
- **Networking**: Retrofit + OkHttp
- **Media Playback**: ExoPlayer (for adaptive streaming)
- **Image Loading**: Coil
- **Dependency Injection**: Hilt
- **Async**: Kotlin Coroutines + Flow

### Build System
- Gradle with Kotlin DSL
- Minimum SDK: 24 (Android 7.0)
- Target SDK: Latest stable

## Backend Server

### Recommended Stack
Choose one of:
- **Node.js + NestJS** (TypeScript, modular architecture)
- **Django** (Python, batteries-included)
- **Laravel** (PHP, elegant syntax)

### Database
- **Primary**: PostgreSQL
- Consider Redis for caching and session management

### Media Processing
- **FFmpeg**: Audio extraction, thumbnail generation, transcoding
- **HLS/DASH**: Adaptive streaming format generation

### Storage
- Local filesystem or cloud storage (S3, Google Cloud Storage)

### Authentication
- JWT tokens for admin authentication
- Role-based access control

## Admin Dashboard

### Frontend Stack
- **Framework**: React or Vue.js
- **UI Library**: Material-UI, Ant Design, or Tailwind CSS
- **State Management**: Redux/Zustand or Pinia
- **HTTP Client**: Axios
- **Build Tool**: Vite or Create React App

## Common Commands

### Backend (Example for Node.js/NestJS)
```bash
# Install dependencies
npm install

# Run development server
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Run migrations
npm run migration:run
```

### Android App
```bash
# Build debug APK
./gradlew assembleDebug

# Run on connected device
./gradlew installDebug

# Run tests
./gradlew test

# Run lint
./gradlew lint
```

### Admin Dashboard
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Run tests
npm run test
```

## Environment Setup

### Backend Environment Variables
```
DATABASE_URL=postgresql://user:password@localhost:5432/zawamel
JWT_SECRET=your-secret-key
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=100MB
FFMPEG_PATH=/usr/bin/ffmpeg
PORT=3000
```

### Android App
- Configure base API URL in `local.properties` or build config
- No special environment setup required for users

### Admin Dashboard
```
VITE_API_BASE_URL=http://localhost:3000/api
```

## Development Tools

- **API Testing**: Postman or Insomnia
- **Database Client**: pgAdmin or DBeaver
- **Version Control**: Git
- **Code Quality**: ESLint/Prettier (JS/TS), ktlint (Kotlin)
