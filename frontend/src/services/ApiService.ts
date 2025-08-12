import { LoginResponse, Room, CreateRoomData, CreatePetData, Position } from '../types';

export class ApiService {
    private baseURL: string;
    private token: string | null;

    constructor() {
        this.baseURL = 'http://localhost:5001/api';
        this.token = null;
    }

    setToken(token: string) {
        this.token = token;
    }

    async request(endpoint: string, options: RequestInit = {}): Promise<any> {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...(this.token && { Authorization: `Bearer ${this.token}` })
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Request failed');
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(username: string): Promise<LoginResponse> {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username })
        });
        
        this.setToken(response.token);
        return response;
    }

    // Room endpoints
    async getRooms(): Promise<Room[]> {
        return await this.request('/rooms');
    }

    async createRoom(name: string, maxPlayers = 10): Promise<Room> {
        return await this.request('/rooms', {
            method: 'POST',
            body: JSON.stringify({ name, maxPlayers })
        });
    }

    async getRoomDetails(roomId: string): Promise<any> {
        return await this.request(`/rooms/${roomId}`);
    }

    // Pet endpoints
    async createPet(petData: CreatePetData): Promise<any> {
        return await this.request('/pets', {
            method: 'POST',
            body: JSON.stringify(petData)
        });
    }

    async updatePetPosition(petId: string, position: Position): Promise<any> {
        return await this.request(`/pets/${petId}/position`, {
            method: 'PATCH',
            body: JSON.stringify(position)
        });
    }

    async getRoomPets(roomId: string): Promise<any> {
        return await this.request(`/pets/room/${roomId}`);
    }
}