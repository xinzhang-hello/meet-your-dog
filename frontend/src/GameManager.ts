import { ApiService } from './services/ApiService';
import { SocketService } from './services/SocketService';
import { DrawingCanvas } from './components/DrawingCanvas';
import { GameWorld } from './components/GameWorld';
import { gameStore } from './stores/gameStore';
import { Room } from './types';

export class GameManager {
    private apiService: ApiService;
    private socketService: SocketService;
    private drawingCanvas: DrawingCanvas | null;
    private gameWorld: GameWorld | null;
    private currentScreen: string;
    private selectedPetType: 'dog' | 'cat';

    constructor() {
        this.apiService = new ApiService();
        this.socketService = new SocketService();
        this.drawingCanvas = null;
        this.gameWorld = null;
        this.currentScreen = 'login';
        this.selectedPetType = 'dog';
        
        // Bind methods
        this.showScreen = this.showScreen.bind(this);
        this.handleLogin = this.handleLogin.bind(this);
    }

    init() {
        this.setupEventListeners();
        this.showScreen('login');
        
        // Subscribe to game store updates
        gameStore.subscribe((state) => {
            if (state.user) {
                this.updateUserInfo();
            }
        });
    }

    setupEventListeners() {
        // Login screen
        document.getElementById('loginBtn').addEventListener('click', this.handleLogin);
        document.getElementById('usernameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        // Room screen
        document.getElementById('createRoomBtn').addEventListener('click', this.createRoom.bind(this));
        document.getElementById('roomNameInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.createRoom();
        });

        // Drawing screen
        document.getElementById('dogBtn').addEventListener('click', () => this.selectPetType('dog'));
        document.getElementById('catBtn').addEventListener('click', () => this.selectPetType('cat'));
        document.getElementById('clearBtn').addEventListener('click', () => this.drawingCanvas?.clear());
        document.getElementById('finishDrawingBtn').addEventListener('click', this.finishDrawing.bind(this));

        // Game screen
        document.getElementById('exitGameBtn').addEventListener('click', this.exitGame.bind(this));
    }

    showScreen(screenName: string) {
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.add('hidden');
        });

        // Show target screen
        document.getElementById(`${screenName}Screen`).classList.remove('hidden');
        this.currentScreen = screenName;

        // Initialize screen-specific functionality
        switch (screenName) {
            case 'room':
                this.loadRooms();
                break;
            case 'drawing':
                this.initDrawingCanvas();
                break;
            case 'game':
                this.initGameWorld();
                break;
        }
    }

    async handleLogin() {
        const usernameInput = document.getElementById('usernameInput') as HTMLInputElement;
        const username = usernameInput.value.trim();
        
        if (!username) {
            alert('Please enter a username');
            return;
        }

        try {
            const response = await this.apiService.login(username);
            gameStore.getState().setUser(response.user);
            gameStore.getState().setToken(response.token);
            
            this.socketService.connect(response.token);
            this.showScreen('room');
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        }
    }

    async loadRooms() {
        try {
            const rooms = await this.apiService.getRooms();
            this.displayRooms(rooms);
        } catch (error) {
            console.error('Failed to load rooms:', error);
        }
    }

    displayRooms(rooms: Room[]) {
        const roomList = document.getElementById('roomList')!;
        roomList.innerHTML = '';

        if (rooms.length === 0) {
            roomList.innerHTML = '<div class="room-item">No rooms available. Create one!</div>';
            return;
        }

        rooms.forEach(room => {
            const roomElement = document.createElement('div');
            roomElement.className = 'room-item';
            roomElement.innerHTML = `
                <div class="room-name">${room.name}</div>
                <div class="room-players">${room.currentPlayers}/${room.maxPlayers} players</div>
            `;
            
            if (room.currentPlayers < room.maxPlayers) {
                roomElement.addEventListener('click', () => this.joinRoom(room.id));
            } else {
                roomElement.style.opacity = '0.5';
                roomElement.style.cursor = 'not-allowed';
            }
            
            roomList.appendChild(roomElement);
        });
    }

    async createRoom() {
        const roomNameInput = document.getElementById('roomNameInput') as HTMLInputElement;
        const roomName = roomNameInput.value.trim();
        
        if (!roomName) {
            alert('Please enter a room name');
            return;
        }

        try {
            const room = await this.apiService.createRoom(roomName);
            this.joinRoom(room.id);
        } catch (error) {
            console.error('Failed to create room:', error);
            alert('Failed to create room. Please try again.');
        }
    }

    async joinRoom(roomId: string) {
        try {
            gameStore.getState().setCurrentRoom(roomId);
            this.socketService.joinRoom(roomId);
            this.showScreen('drawing');
        } catch (error) {
            console.error('Failed to join room:', error);
            alert('Failed to join room. Please try again.');
        }
    }

    initDrawingCanvas() {
        if (this.drawingCanvas) {
            this.drawingCanvas.destroy();
        }
        
        const canvas = document.getElementById('drawingCanvas') as HTMLCanvasElement;
        this.drawingCanvas = new DrawingCanvas(canvas);
        this.selectPetType('dog'); // Default selection
    }

    selectPetType(type: 'dog' | 'cat') {
        this.selectedPetType = type;
        
        // Update button styles
        (document.getElementById('dogBtn') as HTMLElement).style.background = type === 'dog' ? '#ff6b6b' : '#f7f7f7';
        (document.getElementById('catBtn') as HTMLElement).style.background = type === 'cat' ? '#4ecdc4' : '#f7f7f7';
    }

    async finishDrawing() {
        if (!this.drawingCanvas || this.drawingCanvas.isEmpty()) {
            alert('Please draw your pet first!');
            return;
        }

        try {
            const drawingData = this.drawingCanvas.getDrawingData();
            const imageData = this.drawingCanvas.getDrawingAsImage();
            const petData = {
                roomId: gameStore.getState().currentRoom,
                drawingData: drawingData,
                imageData: imageData, // Add the image data
                type: this.selectedPetType,
                position: { x: 100, y: 300 }
            };

            this.socketService.createPet(petData);
            this.showScreen('game');
        } catch (error) {
            console.error('Failed to create pet:', error);
            alert('Failed to create pet. Please try again.');
        }
    }

    initGameWorld() {
        if (this.gameWorld) {
            this.gameWorld.destroy();
        }
        
        const container = document.getElementById('gameContainer')!;
        this.gameWorld = new GameWorld(container, this.socketService);
    }

    updateUserInfo() {
        const user = gameStore.getState().user;
        if (user) {
            document.getElementById('userInfo')!.textContent = `Player: ${user.username}`;
        }
    }

    exitGame() {
        const currentRoom = gameStore.getState().currentRoom;
        if (currentRoom) {
            this.socketService.leaveRoom(currentRoom);
        }
        
        gameStore.getState().setCurrentRoom(null);
        this.showScreen('room');
        this.loadRooms();
    }
}