# Project Structure

## Monorepo Organization

```
ZawamelPlatform/
├── .kiro/
│   └── steering/           # AI assistant guidance documents
├── android-app/            # Android application
├── backend/                # Backend server
├── admin-dashboard/        # Web admin panel
├── docs/                   # Shared documentation
└── README.md              # Project overview
```

## Android App Structure

```
android-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/zawamel/
│   │   │   │   ├── data/           # Data layer (repositories, API, local DB)
│   │   │   │   ├── domain/         # Business logic (use cases, models)
│   │   │   │   ├── presentation/   # UI layer (screens, viewmodels)
│   │   │   │   │   ├── performers/ # Performer list & profile screens
│   │   │   │   │   ├── feed/       # Content feed screens
│   │   │   │   │   ├── player/     # Video/audio player screens
│   │   │   │   │   └── downloads/  # Offline downloads management
│   │   │   │   └── di/             # Dependency injection modules
│   │   │   └── res/                # Resources (layouts, strings, etc.)
│   │   └── test/                   # Unit tests
│   └── build.gradle.kts
└── gradle/
```

## Backend Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── performers/         # Performer management
│   │   ├── content/            # Content CRUD operations
│   │   ├── upload/             # File upload & processing
│   │   ├── streaming/          # Adaptive streaming endpoints
│   │   ├── analytics/          # Trending & popular tracking
│   │   ├── auth/               # Admin authentication
│   │   └── admin/              # Admin user management
│   ├── common/                 # Shared utilities, guards, filters
│   ├── config/                 # Configuration files
│   └── database/               # Migrations, seeds
├── uploads/                    # Uploaded files (gitignored)
├── processed/                  # Processed media files (gitignored)
├── tests/                      # Integration & unit tests
└── package.json
```

## Admin Dashboard Structure

```
admin-dashboard/
├── src/
│   ├── components/             # Reusable UI components
│   ├── pages/
│   │   ├── Login/              # Admin login
│   │   ├── Performers/         # Performer management
│   │   ├── Content/            # Content management
│   │   ├── Upload/             # Upload interface
│   │   ├── Analytics/          # Analytics dashboard
│   │   └── Admins/             # Admin user management
│   ├── services/               # API client services
│   ├── store/                  # State management
│   ├── utils/                  # Helper functions
│   ├── hooks/                  # Custom React hooks
│   └── App.tsx                 # Root component
├── public/                     # Static assets
└── package.json
```

## Conventions

### File Naming
- **Android**: PascalCase for classes, camelCase for files
- **Backend**: kebab-case for files, PascalCase for classes
- **Admin Dashboard**: PascalCase for components, camelCase for utilities

### Code Organization
- **Separation of Concerns**: Keep data, business logic, and presentation layers distinct
- **Feature-Based**: Group related functionality by feature/module
- **Reusability**: Extract common logic into shared utilities
- **Single Responsibility**: Each file/class should have one clear purpose

### API Conventions
- RESTful endpoints: `/api/performers`, `/api/content`, etc.
- Use proper HTTP methods: GET, POST, PUT, DELETE
- Consistent response format: `{ success: boolean, data: any, error?: string }`
- Pagination for list endpoints: `?page=1&limit=20`

### Database Conventions
- Table names: plural, snake_case (e.g., `performers`, `content_items`)
- Foreign keys: `{table}_id` (e.g., `performer_id`)
- Timestamps: `created_at`, `updated_at`
- Soft deletes: `deleted_at` column

### Media Processing
- Original uploads: `/uploads/original/`
- Processed files: `/uploads/processed/{content_id}/`
- HLS segments: `/uploads/processed/{content_id}/hls/`
- Thumbnails: `/uploads/processed/{content_id}/thumbnails/`
- Audio extracts: `/uploads/processed/{content_id}/audio/`

### Documentation
- README.md in each component directory
- API documentation using Swagger/OpenAPI
- Inline comments for complex business logic
- Architecture decision records (ADRs) in `/docs/adr/`
