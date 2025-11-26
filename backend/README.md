# Heritage Backend

Backend server for the Heritage Platform built with NestJS, TypeScript, and PostgreSQL.

## Features

- RESTful API for performers and content management
- Admin authentication with JWT
- Media processing with FFmpeg
- Adaptive streaming (HLS/DASH)
- Analytics tracking
- PostgreSQL database

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- FFmpeg

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update `.env` with your database credentials

4. Run database migrations:
```bash
npm run migration:run
```

5. Start development server:
```bash
npm run start:dev
```

The server will run on http://localhost:3000

## API Endpoints

### Public Endpoints
- `GET /api/performers` - List all performers
- `GET /api/performers/:id` - Get performer details
- `GET /api/content` - List all content
- `GET /api/content/:id` - Get content details

### Admin Endpoints (Requires Authentication)
- `POST /api/auth/login` - Admin login
- `POST /api/performers` - Create performer
- `PUT /api/performers/:id` - Update performer
- `DELETE /api/performers/:id` - Delete performer
- `GET /api/analytics/trending` - Get trending content
- `GET /api/analytics/popular` - Get popular content

## Scripts

- `npm run start:dev` - Start development server
- `npm run build` - Build for production
- `npm run start:prod` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code

## Project Structure

```
src/
├── modules/
│   ├── performers/    # Performer management
│   ├── content/       # Content management
│   ├── upload/        # File upload & processing
│   ├── streaming/     # Adaptive streaming
│   ├── analytics/     # Analytics & reports
│   ├── auth/          # Authentication
│   └── admin/         # Admin management
├── common/            # Shared utilities
├── app.module.ts      # Root module
└── main.ts            # Entry point
```
