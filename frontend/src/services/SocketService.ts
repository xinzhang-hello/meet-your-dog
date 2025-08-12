import { io, Socket } from 'socket.io-client';
import { gameStore } from '../stores/gameStore';
import { CreatePetData, Position } from '../types';

export class SocketService {
    private socket: Socket | null;
    private connected: boolean;

    constructor() {
        this.socket = null;
        this.connected = false;
    }

    connect(token: string) {
        if (this.socket) {
            this.socket.disconnect();
        }

        this.socket = io('http://localhost:5001', {
            auth: { token }
        });

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.socket!.on('connect', () => {
            console.log('Connected to server');
            this.connected = true;
        });

        this.socket!.on('disconnect', () => {
            console.log('Disconnected from server');
            this.connected = false;
        });

        this.socket!.on('error', (error: any) => {
            console.error('Socket error:', error);
            alert(`Connection error: ${error.message}`);
        });

        // Room events
        this.socket!.on('room-state', (roomState: any) => {
            gameStore.getState().setPets(roomState.pets || []);
            gameStore.getState().setPlayers(roomState.roomMembers || []);
        });

        this.socket!.on('player-joined', (data: any) => {
            console.log(`Player ${data.username} joined the room`);
        });

        this.socket!.on('player-left', (data: any) => {
            console.log(`Player ${data.username} left the room`);
        });

        // Pet events
        this.socket!.on('pet-created', (pet: any) => {
            gameStore.getState().addPet(pet);
        });

        this.socket!.on('pet-moved', (data: any) => {
            gameStore.getState().updatePetPosition(data.petId, data.position);
        });
    }

    // Room methods
    joinRoom(roomId: string) {
        if (this.socket && this.connected) {
            this.socket.emit('join-room', roomId);
        }
    }

    leaveRoom(roomId: string) {
        if (this.socket && this.connected) {
            this.socket.emit('leave-room', roomId);
        }
    }

    // Pet methods
    createPet(petData: CreatePetData) {
        if (this.socket && this.connected) {
            this.socket.emit('pet-created', petData);
        }
    }

    movePet(petId: string, roomId: string, position: Position) {
        if (this.socket && this.connected) {
            this.socket.emit('pet-moved', { petId, roomId, position });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }
}