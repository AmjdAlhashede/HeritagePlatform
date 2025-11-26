# Heritage Admin Dashboard

Web-based admin panel for managing the Heritage Platform.

## Features

- Admin authentication
- Performer management
- Content management
- File upload interface
- Analytics dashboard
- Admin user management

## Tech Stack

- React 18
- TypeScript
- Vite
- Material-UI
- Zustand (state management)
- React Router
- Axios

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Update API base URL in `.env`

4. Start development server:
```bash
npm run dev
```

The app will run on http://localhost:5173

## Build

```bash
npm run build
```

## Project Structure

```
src/
├── components/      # Reusable UI components
├── pages/           # Page components
├── services/        # API services
├── store/           # State management
├── App.tsx          # Root component
└── main.tsx         # Entry point
```
