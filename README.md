# ReelShort - Short Drama Video Platform

A modern, full-stack web platform for uploading, discovering, and streaming short emotional dramas with blockchain integration.

## Features

### Core Functionality
- 🎬 **Video Upload & Management** - Upload and manage short drama videos
- 📺 **Custom Video Player** - Full-featured player with playback controls
- 💖 **Emotional Reactions** - React with emotions (happy, sad, shocked, etc.)
- 💬 **Comments System** - Nested comments with likes
- 📋 **Playlists** - Create and manage playlists
- 🔍 **Content Discovery** - Browse by mood, category, and trending
- 👤 **User Profiles** - User management with follows
- 🔐 **Authentication** - Email/password and Sui wallet authentication

### Technical Features
- ⚡ **Real-time Updates** - React Query for data synchronization
- 🎨 **Modern UI** - Tailwind CSS + Radix UI components
- 🔄 **Caching Layer** - Redis for improved performance
- 📦 **File Storage** - Local storage with plans for Walrus integration
- 🐳 **Docker Support** - Easy deployment with Docker Compose
- 🔒 **Secure** - JWT authentication, rate limiting, input validation

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite (build tool)
- React Router DOM (routing)
- Zustand (state management)
- React Query (data fetching)
- Tailwind CSS + Radix UI (styling)
- Axios (HTTP client)
- Sui blockchain integration

### Backend
- Node.js + Express
- PostgreSQL (database)
- Redis (caching)
- JWT (authentication)
- Multer (file uploads)
- FFmpeg (video processing - planned)

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose (optional but recommended)

### Option 1: Docker (Recommended)

1. **Clone the repository**
```bash
git clone <repository-url>
cd verta
```

2. **Create environment files**
```bash
# Frontend
cp .env.example .env

# Backend
cp server/.env.example server/.env
```

3. **Start services with Docker Compose**
```bash
docker-compose up -d
```

4. **Run database migrations**
```bash
docker-compose exec api npm run migrate
```

5. **Seed the database (optional)**
```bash
docker-compose exec api npm run seed
```

6. **Access the application**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/health

### Option 2: Manual Setup

#### Backend Setup

1. **Install dependencies**
```bash
cd server
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your PostgreSQL and Redis credentials
```

3. **Start PostgreSQL and Redis**
Make sure PostgreSQL and Redis are running on your system.

4. **Run migrations**
```bash
npm run migrate
```

5. **Seed database (optional)**
```bash
npm run seed
```

6. **Start server**
```bash
npm run dev
```

The API server will start on http://localhost:5000

#### Frontend Setup

1. **Install dependencies**
```bash
cd ..  # Back to root directory
npm install
```

2. **Configure environment**
```bash
cp .env.example .env
```

3. **Start development server**
```bash
npm run dev
```

The frontend will start on http://localhost:5173

## Project Structure

```
/
├── src/                    # Frontend source
│   ├── pages/             # Page components
│   ├── components/        # React components
│   ├── lib/               # Utilities, API, stores
│   └── hooks/             # Custom hooks
├── server/                # Backend API
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   ├── config/           # Configuration files
│   └── uploads/          # Uploaded files
├── database/             # Database migrations & seeds
├── public/               # Static assets
└── docker-compose.yml    # Docker configuration
```

## Environment Variables

**Frontend (.env)**
- `VITE_API_URL` - Backend API URL (default: http://localhost:5000/api)
- `VITE_SUI_NETWORK` - Sui blockchain network
- `VITE_SUI_RPC_URL` - Sui RPC endpoint

**Backend (server/.env)**
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 5000)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` - PostgreSQL config
- `REDIS_HOST`, `REDIS_PORT` - Redis config
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Allowed origins for CORS

## Development Workflow

### Starting the Application

**With Docker:**
```bash
docker-compose up
```

**Without Docker:**
```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
npm run dev
```

## Roadmap

- [ ] Walrus integration for decentralized storage
- [ ] FFmpeg video processing and transcoding
- [ ] HLS/DASH adaptive streaming
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] AI-powered content recommendations
- [ ] Blockchain rewards system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License

---

Built with ❤️ using React, Node.js, and Sui blockchain
