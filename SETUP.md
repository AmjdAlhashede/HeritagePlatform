# Heritage Platform - Setup Guide

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- FFmpeg (for media processing)
- Android Studio (for Android app)

---

## Automated Setup (Recommended)

### Linux/Mac:
```bash
chmod +x SETUP.sh
./SETUP.sh
```

### Manual Setup:

#### 1. Backend
```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

#### 2. Admin Dashboard
```bash
cd admin-dashboard
npm install
cp .env.example .env
npm run dev
```

#### 3. Database
```bash
createdb heritage
cd backend
npm run init
```

**Login credentials:**
- Email: admin@heritage.com
- Password: admin123

---

## Android App Setup

1. Open `android-app` in Android Studio
2. Wait for Gradle sync
3. Run on emulator or device

**Note:** Use `10.0.2.2` for emulator instead of `localhost`

---

## Documentation

- [API Documentation](./docs/API.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Backend README](./backend/README.md)
- [Admin Dashboard README](./admin-dashboard/README.md)
- [Android App README](./android-app/README.md)
