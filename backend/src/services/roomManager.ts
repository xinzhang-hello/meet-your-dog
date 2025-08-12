import prisma from '../utils/database';
import { AuthenticatedSocket, RoomState, CreatePetData } from '../types';

class RoomManager {
  private activeConnections: Map<string, AuthenticatedSocket>;

  constructor() {
    this.activeConnections = new Map(); // userId -> socket
  }

  async joinRoom(roomId: string, userId: string, socket: AuthenticatedSocket) {
    // Check if room exists and has space
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        _count: {
          select: { roomMembers: { where: { isActive: true } } }
        }
      }
    });

    if (!room) {
      throw new Error('Room not found');
    }

    if (room._count.roomMembers >= room.maxPlayers) {
      throw new Error('Room is full');
    }

    // Add or update room member
    await prisma.roomMember.upsert({
      where: {
        roomId_userId: {
          roomId,
          userId
        }
      },
      update: {
        isActive: true,
        joinedAt: new Date()
      },
      create: {
        roomId,
        userId,
        isActive: true
      }
    });

    // Update room current players count
    const currentPlayers = await prisma.roomMember.count({
      where: { roomId, isActive: true }
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { currentPlayers }
    });

    // Store active connection
    this.activeConnections.set(userId, socket);
  }

  async leaveRoom(roomId: string, userId: string) {
    // Deactivate room member
    await prisma.roomMember.updateMany({
      where: {
        roomId,
        userId,
        isActive: true
      },
      data: { isActive: false }
    });

    // Update room current players count
    const currentPlayers = await prisma.roomMember.count({
      where: { roomId, isActive: true }
    });

    await prisma.room.update({
      where: { id: roomId },
      data: { currentPlayers }
    });

    // Remove active connection
    this.activeConnections.delete(userId);
  }

  async getRoomState(roomId: string): Promise<any> {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: {
        roomMembers: {
          where: { isActive: true },
          include: { user: { select: { id: true, username: true } } }
        },
        pets: {
          include: { user: { select: { id: true, username: true } } }
        }
      }
    });

    return room;
  }

  async createPet(roomId: string, userId: string, petData: CreatePetData) {
    // Verify user is in room
    const roomMember = await prisma.roomMember.findFirst({
      where: {
        roomId,
        userId,
        isActive: true
      }
    });

    if (!roomMember) {
      throw new Error('User not in room');
    }

    const pet = await prisma.pet.create({
      data: {
        userId,
        roomId,
        drawingData: petData.drawingData,
        imageData: petData.imageData || null,
        type: petData.type,
        position: petData.position || { x: 100, y: 100 } as any
      },
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    return pet;
  }

  async handleDisconnect(userId: string) {
    // Mark all user's room memberships as inactive
    await prisma.roomMember.updateMany({
      where: { userId, isActive: true },
      data: { isActive: false }
    });

    // Update room player counts
    const userRooms = await prisma.roomMember.findMany({
      where: { userId },
      select: { roomId: true }
    });

    for (const { roomId } of userRooms) {
      const currentPlayers = await prisma.roomMember.count({
        where: { roomId, isActive: true }
      });

      await prisma.room.update({
        where: { id: roomId },
        data: { currentPlayers }
      });
    }

    // Remove active connection
    this.activeConnections.delete(userId);
  }
}

export default RoomManager;