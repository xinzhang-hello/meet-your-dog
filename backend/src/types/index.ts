import { Request } from 'express';
import { Socket } from 'socket.io';

export interface User {
  id: string;
  username: string;
  createdAt: Date;
}

export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  currentPlayers: number;
  isActive: boolean;
  createdAt: Date;
}

export interface Pet {
  id: string;
  userId: string;
  roomId: string;
  drawingData: any;
  position: Position;
  type: 'dog' | 'cat';
  createdAt: Date;
  user?: User;
}

export interface Position {
  x: number;
  y: number;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  joinedAt: Date;
  isActive: boolean;
  user?: User;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface AuthenticatedSocket extends Socket {
  user: User;
}

export interface CreateRoomData {
  name: string;
  maxPlayers?: number;
}

export interface CreatePetData {
  roomId: string;
  drawingData: any;
  imageData?: string;
  type: 'dog' | 'cat';
  position?: Position;
}

export interface RoomState {
  id: string;
  name: string;
  maxPlayers: number;
  currentPlayers: number;
  roomMembers: (RoomMember & { user: User })[];
  pets: (Pet & { user: User })[];
}