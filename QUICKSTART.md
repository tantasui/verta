# Quick Start Guide

Get ReelShort up and running in minutes!

## Prerequisites

- Node.js 18+ installed
- Docker and Docker Compose installed (recommended)

## Option 1: Quick Start with Docker (Recommended)

```bash
# 1. Clone and navigate to the project
cd verta

# 2. Create environment files
cp .env.example .env
cp server/.env.example server/.env

# 3. Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# 4. Wait for services to be healthy (about 10 seconds)
docker-compose ps

# 5. Run database migrations
docker-compose exec api npm run migrate

# 6. Seed the database with sample data (optional)
docker-compose exec api npm run seed

# 7. Install frontend dependencies
npm install

# 8. Start the frontend
npm run dev
```

**Access the app:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Option 2: Manual Setup (Without Docker)

### Step 1: Install PostgreSQL and Redis

**On macOS (using Homebrew):**
```bash
brew install postgresql@15 redis
brew services start postgresql@15
brew services start redis
```

**On Ubuntu/Debian:**
```bash
sudo apt-get install postgresql-15 redis-server
sudo systemctl start postgresql
sudo systemctl start redis-server
```

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database and user
CREATE DATABASE reelshort;
CREATE USER postgres WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE reelshort TO postgres;
\q
```

### Step 3: Setup Backend

```bash
# Install backend dependencies
cd server
npm install

# Create environment file
cp .env.example .env

# Edit .env with your database password
# Update DB_PASSWORD=your_password

# Run migrations
npm run migrate

# Seed database (optional)
npm run seed

# Start backend server
npm run dev
```

Backend will run on http://localhost:5000

### Step 4: Setup Frontend

Open a new terminal:

```bash
# Go back to project root
cd ..

# Install dependencies
npm install

# Add axios if not installed
npm install axios

# Create environment file
cp .env.example .env

# Start frontend
npm run dev
```

Frontend will run on http://localhost:5173

## Default Login Credentials

After seeding the database, you can use these test accounts:

**User 1:**
- Email: alice@example.com
- Password: (create account via register)

**User 2:**
- Email: bob@example.com
- Password: (create account via register)

Or connect with your Sui wallet!

## Testing the API

```bash
# Check API health
curl http://localhost:5000/health

# Get all dramas
curl http://localhost:5000/api/dramas

# Get trending dramas
curl http://localhost:5000/api/dramas/trending/list
```

## Common Issues

### Port Already in Use

If port 5000 or 5173 is already in use:

```bash
# Change backend port in server/.env
PORT=5001

# Update frontend .env to match
VITE_API_URL=http://localhost:5001/api
```

### Database Connection Failed

1. Make sure PostgreSQL is running:
   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status postgresql
   ```

2. Check credentials in `server/.env`

### Redis Connection Failed

1. Make sure Redis is running:
   ```bash
   # macOS
   brew services list

   # Linux
   sudo systemctl status redis-server
   ```

## Next Steps

1. **Register an account** - Go to http://localhost:5173 and create an account
2. **Upload a video** - Try uploading your first drama
3. **Explore features** - Browse dramas, create playlists, add reactions
4. **Check the API** - Visit http://localhost:5000/health

## Stop Services

**Docker:**
```bash
docker-compose down
```

**Manual:**
```bash
# Stop backend (Ctrl+C in backend terminal)
# Stop frontend (Ctrl+C in frontend terminal)

# Stop PostgreSQL and Redis (macOS)
brew services stop postgresql@15
brew services stop redis

# Stop PostgreSQL and Redis (Linux)
sudo systemctl stop postgresql
sudo systemctl stop redis-server
```

## Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review API routes in `server/routes/`
- Check logs: `docker-compose logs api` (Docker) or check terminal output (manual)

Happy coding! 🎬
