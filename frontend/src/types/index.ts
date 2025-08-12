export interface User {
  id: string;
  username: string;
}

export interface Room {
  id: string;
  name: string;
  maxPlayers: number;
  currentPlayers: number;
  createdAt: string;
}

export interface Pet {
  id: string;
  userId: string;
  roomId: string;
  drawingData: any;
  position: Position;
  type: 'dog' | 'cat';
  createdAt: string;
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
  joinedAt: string;
  isActive: boolean;
  user?: User;
}

export interface GameState {
  user: User | null;
  token: string | null;
  currentRoom: string | null;
  players: RoomMember[];
  pets: Pet[];
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

export interface LoginResponse {
  token: string;
  user: User;
}