# Heritage Android App

Android application for the Heritage Platform built with Jetpack Compose.

## Features

- Browse performers in a feed-style interface
- View performer profiles with bio and information
- Stream video content with adaptive quality (HLS)
- Play audio content
- Download content for offline access
- No login required

## Tech Stack

- Kotlin
- Jetpack Compose
- MVVM + Clean Architecture
- Hilt (Dependency Injection)
- Retrofit (Networking)
- ExoPlayer (Media Playback)
- Coil (Image Loading)
- Room (Local Database)

## Requirements

- Android Studio Hedgehog or later
- Minimum SDK: 24 (Android 7.0)
- Target SDK: 34

## Setup

1. Open project in Android Studio
2. Sync Gradle files
3. Update API base URL in `app/build.gradle.kts` if needed
4. Run on emulator or device

## Build

```bash
# Debug build
./gradlew assembleDebug

# Release build
./gradlew assembleRelease
```

## Project Structure

```
app/src/main/java/com/zawamel/app/
├── data/              # Data layer
│   ├── remote/        # API services
│   ├── local/         # Room database
│   └── repository/    # Repository implementations
├── domain/            # Business logic
│   ├── model/         # Domain models
│   ├── repository/    # Repository interfaces
│   └── usecase/       # Use cases
├── presentation/      # UI layer
│   ├── performers/    # Performer screens
│   ├── feed/          # Content feed
│   ├── player/        # Media player
│   ├── downloads/     # Downloads management
│   ├── theme/         # App theme
│   └── navigation/    # Navigation
└── di/                # Dependency injection
```
