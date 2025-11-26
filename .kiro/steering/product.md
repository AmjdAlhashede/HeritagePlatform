# Product Overview

## Zawamel Platform

A complete online platform for showcasing Zawamel performers and their content through multiple interfaces.

## Purpose

Provide a social-media-style platform where users can discover performers, browse their content, and consume audio/video media. The platform consists of three main components working together to deliver a seamless experience.

## Components

### Android App (User-Facing)
- Browse performers in a feed-style interface
- View detailed performer profiles with bio, images, and information
- Stream video content with adaptive quality
- Play audio content
- Download content for offline access
- No authentication required for users

### Web Admin Dashboard
- Secure admin-only access
- Manage performer profiles and information
- Upload and manage content (videos, audio)
- Process uploads with automatic audio extraction and adaptive streaming
- Manage admin accounts
- View analytics: trending content, popular items, performance reports

### Backend Server
- RESTful API serving both Android app and admin panel
- Content processing pipeline (FFmpeg for audio extraction, artwork, HLS/DASH)
- Analytics tracking and reporting
- File storage and streaming infrastructure
- Support for uploads up to 100MB

## Target Audience

- End users: Zawamel content consumers via Android devices
- Administrators: Content managers and platform operators

## Success Criteria

- Stable, scalable architecture ready for future expansion
- Smooth video/audio playback experience
- Efficient content management workflow
- Reliable offline download functionality
