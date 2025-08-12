# Meet Your Dog 🐕

A multiplayer web game where players can draw their pets and watch them interact in a virtual world.

## Features

- **User Authentication**: Simple username-based login
- **Room System**: Create or join multiplayer rooms
- **Pet Drawing**: Draw your pet using Fabric.js canvas
- **Real-time Multiplayer**: Watch pets from all players move around
- **Interactive World**: Pets walk on roads and paths built with Phaser.js

## Tech Stack

### Backend
- Node.js + Express.js + TypeScript
- Socket.io for real-time communication
- PostgreSQL + Prisma ORM
- JWT authentication

### Frontend
- TypeScript
- Phaser.js 3 for game world
- Fabric.js for drawing canvas
- Vite for development server

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or use Docker)
- Git

### Option 1: Docker (Recommended)

```bash
# Clone the repository
git clone <your-repo-url>
cd meet-your-dog

# Edit .env file with secure passwords:
# - Set POSTGRES_PASSWORD to a secure password
# - Set JWT_SECRET to a secure random string (min 32 characters)
# - Update other variables as needed

# Start all services
docker-compose up -d

# Wait for services to start, then visit:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Health Check: http://localhost:5000/health
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- PostgreSQL 15+

#### Backend Setup
```bash
cd backend

# Use clean package.json (recommended)
cp package-clean.json package.json

# Install dependencies
npm install

# Set up environment
cp .env .env
# Edit .env with your database credentials and secure secrets

# Set up database
npm run db:push
npm run db:generate

# Run linting and tests
npm run lint
npm run test

# Start development server
npm run dev
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Game Flow

1. **Login**: Enter your username
2. **Room Selection**: Join existing room or create new one
3. **Pet Drawing**: Draw your dog or cat on the canvas
4. **Game World**: Watch your pet and others walk around

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with username

### Rooms
- `GET /api/rooms` - Get all active rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details

### Pets
- `POST /api/pets` - Create pet
- `PATCH /api/pets/:id/position` - Update pet position
- `GET /api/pets/room/:roomId` - Get pets in room

## Socket Events

### Client to Server
- `join-room` - Join a game room
- `leave-room` - Leave a game room
- `pet-created` - Create new pet
- `pet-moved` - Update pet position

### Server to Client
- `room-state` - Initial room state
- `player-joined` - Player joined room
- `player-left` - Player left room
- `pet-created` - New pet created
- `pet-moved` - Pet position updated

## Database Schema

```sql
Users: id, username, createdAt
Rooms: id, name, maxPlayers, currentPlayers, createdAt
Pets: id, userId, roomId, drawingData, position, type, createdAt
RoomMembers: id, roomId, userId, joinedAt, isActive
```

## Development

### Backend Development
```bash
cd backend

# Development with hot reload
npm run dev

# Code quality
npm run lint          # Check for linting errors
npm run lint:fix      # Fix auto-fixable linting errors
npm run format        # Format code with Prettier
npm run type-check    # TypeScript type checking

# Testing
npm run test          # Run tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report

# Build
npm run build         # Build for production
```

### Frontend Development
```bash
cd frontend
npm run dev     # Starts Vite dev server with HMR
npm run build   # Build for production
npm run preview # Preview production build
```

### Database Operations
```bash
cd backend

# Generate Prisma client
npm run db:generate

# Create and apply migrations (production)
npm run db:migrate

# Push schema changes (development)
npm run db:push

# Database GUI
npm run db:studio
```

## Production Deployment

### Using Docker
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
1. Set up PostgreSQL database
2. Configure environment variables
3. Build frontend: `npm run build`
4. Run database migrations
5. Start backend server: `npm start`

## Environment Variables

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/meetyourdog
JWT_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
PORT=5000
```

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details