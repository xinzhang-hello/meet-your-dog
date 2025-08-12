import http from 'http';
import { Server } from 'socket.io';
import app from './app';
import RoomManager from './services/roomManager';
import { authenticateSocket } from './middleware/auth';
import { AuthenticatedSocket } from './types';

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://localhost:5173',
      process.env.FRONTEND_URL || 'http://localhost:3000'
    ],
    methods: ['GET', 'POST']
  }
});

const roomManager = new RoomManager();

// Socket authentication middleware
io.use(authenticateSocket as any);

io.on('connection', (socket: any) => {
  console.log(`User ${socket.user.username} connected`);

  // Join room
  socket.on('join-room', async (roomId: string) => {
    try {
      await roomManager.joinRoom(roomId, socket.user.id, socket);
      socket.join(roomId);
      
      // Send current room state
      const roomState = await roomManager.getRoomState(roomId);
      socket.emit('room-state', roomState);
      
      // Notify other players
      socket.to(roomId).emit('player-joined', {
        userId: socket.user.id,
        username: socket.user.username
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  // Leave room
  socket.on('leave-room', async (roomId: string) => {
    try {
      await roomManager.leaveRoom(roomId, socket.user.id);
      socket.leave(roomId);
      
      socket.to(roomId).emit('player-left', {
        userId: socket.user.id,
        username: socket.user.username
      });
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  // Pet created
  socket.on('pet-created', async (data: any) => {
    try {
      const pet = await roomManager.createPet(data.roomId, socket.user.id, data);
      io.to(data.roomId).emit('pet-created', pet);
    } catch (error: any) {
      socket.emit('error', { message: error.message });
    }
  });

  // Pet moved
  socket.on('pet-moved', (data: any) => {
    socket.to(data.roomId).emit('pet-moved', {
      petId: data.petId,
      position: data.position,
      userId: socket.user.id
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log(`User ${socket.user.username} disconnected`);
    roomManager.handleDisconnect(socket.user.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});