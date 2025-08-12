# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend Development
```bash
cd backend

# Development server with hot reload
npm run dev

# Code quality
npm run lint          # ESLint checking
npm run lint:fix      # Fix auto-fixable linting errors
npm run format        # Prettier formatting
npm run type-check    # TypeScript type checking

# Testing
npm run test          # Run Jest tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report

# Production build
npm run build         # TypeScript compilation to dist/

# Database operations
npm run db:generate   # Generate Prisma client
npm run db:migrate    # Create and apply migrations (production)
npm run db:push       # Push schema changes (development)
npm run db:studio     # Launch Prisma Studio GUI
```

### Frontend Development
```bash
cd frontend

# Development with Vite HMR
npm run dev

# Production build
npm run build
npm run preview       # Preview production build
```

### Docker Development
```bash
# Start all services (recommended)
docker-compose up -d

# Check service health
curl http://localhost:5000/health
```

## Architecture

### Tech Stack
- **Backend**: Node.js + Express + TypeScript + Socket.io
- **Database**: PostgreSQL + Prisma ORM
- **Frontend**: TypeScript + Phaser.js (game world) + Fabric.js (drawing)
- **Real-time**: Socket.io for multiplayer communication
- **Authentication**: JWT tokens with rate limiting

### Project Structure
```
backend/src/
├── middleware/          # Express middleware (auth, validation, rate limiting)
├── routes/             # API endpoints (auth, pets, rooms)
├── schemas/            # Joi validation schemas
├── services/           # Business logic (roomManager)
├── types/              # TypeScript definitions
└── utils/              # Database connection, logging (Winston)

frontend/src/
├── components/         # Game components (Canvas, GameWorld)
├── services/           # API and Socket services
├── stores/             # Zustand state management
└── types/              # TypeScript definitions
```

### Key Features
- **Room System**: Multiplayer rooms with Socket.io
- **Pet Drawing**: Fabric.js canvas for drawing pets
- **Game World**: Phaser.js for pet simulation and movement
- **Real-time Sync**: Socket events for pet creation and movement

## Development Workflow

### Package Management
- Backend uses the clean package.json: `cp package-clean.json package.json` for development
- The current package.json may have excess dependencies from setup

### Database Schema
Uses Prisma with models: Users, Rooms, Pets, RoomMembers
- Always run `npm run db:generate` after schema changes
- Use `npm run db:push` for development schema updates

### Testing
- Jest configuration in backend/jest.config.js  
- Tests located in backend/src/__tests__/
- Aim for high test coverage on business logic

### Environment Setup
Required .env files:
- `/backend/.env`: DATABASE_URL, JWT_SECRET, FRONTEND_URL, PORT
- Frontend connects to backend via environment-configured URLs

## Socket.io Events
**Client → Server**: join-room, leave-room, pet-created, pet-moved
**Server → Client**: room-state, player-joined, player-left, pet-created, pet-moved

## Security Notes
- JWT authentication with configurable secrets
- Rate limiting on auth endpoints and general API
- Helmet for security headers
- Input validation via Joi schemas
- Non-root Docker containers with health checks