# Zawamel Platform API Documentation

## Base URL
```
http://localhost:3000/api
```

## Authentication

Admin endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

## Public Endpoints

### Get Performers List
```http
GET /performers?page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "اسم المؤدي",
      "bio": "نبذة عن المؤدي",
      "imageUrl": "https://...",
      "location": "الموقع",
      "socialLinks": {},
      "isActive": true,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Get Performer Details
```http
GET /performers/:id
```

### Get Content List
```http
GET /content?page=1&limit=20&performerId=uuid
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "title": "عنوان المحتوى",
      "description": "وصف",
      "type": "video",
      "originalFileUrl": "https://...",
      "hlsUrl": "https://.../playlist.m3u8",
      "audioUrl": "https://...",
      "thumbnailUrl": "https://...",
      "duration": 180,
      "fileSize": 50000000,
      "viewCount": 1000,
      "downloadCount": 500,
      "isProcessed": true,
      "performer": {},
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {}
}
```

### Get Content Details
```http
GET /content/:id
```

### Track View
```http
POST /content/:id/view
```

### Track Download
```http
POST /content/:id/download
```

## Admin Endpoints

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

**Response:**
```json
{
  "access_token": "jwt-token",
  "admin": {
    "id": "uuid",
    "email": "admin@example.com",
    "name": "Admin Name"
  }
}
```

### Create Performer
```http
POST /performers
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "اسم المؤدي",
  "bio": "نبذة",
  "imageUrl": "https://...",
  "location": "الموقع",
  "socialLinks": {}
}
```

### Update Performer
```http
PUT /performers/:id
Authorization: Bearer <token>
```

### Delete Performer
```http
DELETE /performers/:id
Authorization: Bearer <token>
```

### Get Trending Content
```http
GET /analytics/trending?limit=10
Authorization: Bearer <token>
```

### Get Popular Content
```http
GET /analytics/popular?limit=10
Authorization: Bearer <token>
```

### Get Admins
```http
GET /admin
Authorization: Bearer <token>
```

### Create Admin
```http
POST /admin
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "new@example.com",
  "password": "password",
  "name": "Admin Name"
}
```

## Error Responses

```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

## Status Codes

- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error
