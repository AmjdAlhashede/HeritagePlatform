# Zawamel Platform - Architecture

## Overview

The Zawamel Platform consists of three main components:

1. **Backend Server** - NestJS REST API
2. **Admin Dashboard** - React web application
3. **Android App** - Jetpack Compose mobile app

## System Architecture

```
┌─────────────────┐
│  Android App    │
│  (Jetpack       │
│   Compose)      │
└────────┬────────┘
         │
         │ HTTP/REST
         │
         ▼
┌─────────────────────────────────┐
│      Backend Server             │
│      (NestJS + PostgreSQL)      │
│                                 │
│  ┌──────────────────────────┐  │
│  │  API Layer               │  │
│  │  - Performers            │  │
│  │  - Content               │  │
│  │  - Upload                │  │
│  │  - Streaming             │  │
│  │  - Analytics             │  │
│  │  - Auth                  │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Media Processing        │  │
│  │  - FFmpeg                │  │
│  │  - HLS/DASH Generation   │  │
│  │  - Thumbnail Extraction  │  │
│  └──────────────────────────┘  │
│                                 │
│  ┌──────────────────────────┐  │
│  │  Database (PostgreSQL)   │  │
│  │  - Performers            │  │
│  │  - Content               │  │
│  │  - Admins                │  │
│  └──────────────────────────┘  │
└────────┬────────────────────────┘
         │
         │ HTTP/REST
         │
         ▼
┌─────────────────┐
│  Admin Panel    │
│  (React)        │
└─────────────────┘
```

## Backend Architecture

### Modular Structure

```
backend/
├── modules/
│   ├── performers/     # Performer CRUD
│   ├── content/        # Content management
│   ├── upload/         # File upload & processing
│   ├── streaming/      # Adaptive streaming
│   ├── analytics/      # Analytics & tracking
│   ├── auth/           # JWT authentication
│   └── admin/          # Admin management
```

### Data Flow

1. **Upload Flow**
   - Admin uploads video via dashboard
   - File saved to uploads directory
   - Background job processes file:
     - Extract audio with FFmpeg
     - Generate HLS segments
     - Create thumbnail
     - Update database

2. **Streaming Flow**
   - Android app requests content
   - Backend returns HLS playlist URL
   - ExoPlayer streams adaptive quality

3. **Analytics Flow**
   - App tracks views/downloads
   - Backend increments counters
   - Admin views reports

## Android App Architecture

### Clean Architecture Layers

```
presentation/  (UI Layer)
    ├── screens/
    ├── viewmodels/
    └── components/

domain/  (Business Logic)
    ├── models/
    ├── repositories/
    └── usecases/

data/  (Data Layer)
    ├── remote/  (API)
    ├── local/   (Room DB)
    └── repository/
```

### Key Features

- **Offline Support**: Room database caches content
- **Adaptive Streaming**: ExoPlayer with HLS
- **Downloads**: WorkManager for background downloads
- **No Auth**: Public content access

## Admin Dashboard Architecture

### Component Structure

```
src/
├── pages/          # Route pages
├── components/     # Reusable UI
├── services/       # API client
├── store/          # Zustand state
└── hooks/          # Custom hooks
```

### State Management

- Zustand for global state (auth)
- React Query for server state (future)
- Local state for UI

## Database Schema

### Performers Table
```sql
performers
├── id (uuid, PK)
├── name (varchar)
├── bio (text)
├── imageUrl (varchar)
├── location (varchar)
├── socialLinks (jsonb)
├── isActive (boolean)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Content Table
```sql
content
├── id (uuid, PK)
├── title (varchar)
├── description (text)
├── type (enum: video/audio)
├── originalFileUrl (varchar)
├── hlsUrl (varchar)
├── audioUrl (varchar)
├── thumbnailUrl (varchar)
├── duration (int)
├── fileSize (bigint)
├── viewCount (int)
├── downloadCount (int)
├── isProcessed (boolean)
├── isActive (boolean)
├── performerId (uuid, FK)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

### Admins Table
```sql
admins
├── id (uuid, PK)
├── email (varchar, unique)
├── password (varchar, hashed)
├── name (varchar)
├── isActive (boolean)
├── createdAt (timestamp)
└── updatedAt (timestamp)
```

## Security

- JWT tokens for admin authentication
- Bcrypt password hashing
- CORS configuration
- Input validation with class-validator
- SQL injection prevention (TypeORM)

## Scalability Considerations

- Horizontal scaling: Stateless backend
- CDN for media files
- Database connection pooling
- Caching layer (Redis - future)
- Message queue for processing (Bull - future)
- Load balancer for multiple instances

## Future Enhancements

- Push notifications
- User accounts and favorites
- Comments and ratings
- Live streaming support
- Multi-language support
- Advanced analytics
