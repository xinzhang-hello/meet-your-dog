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
        this.setupRouting();
        this.handleRoute();
        
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

    setupRouting() {
        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRoute();
        });
    }

    handleRoute() {
        const path = window.location.pathname;
        const urlParams = new URLSearchParams(window.location.search);
        const pathParts = path.split('/').filter(part => part);
        
        if (path === '/room') {
            // Show room list
            this.showScreen('room');
        } else if (pathParts[0] === 'room' && pathParts[1]) {
            const roomId = pathParts[1];
            const subPath = pathParts[2];
            
            if (subPath === 'draw') {
                // Direct link to drawing screen
                this.handleRoomRoute(roomId, 'drawing');
            } else if (subPath === 'game') {
                // Direct link to game screen
                this.handleRoomRoute(roomId, 'game');
            } else {
                // Just room ID, join the room
                this.handleRoomRoute(roomId);
            }
        } else if (path === '/') {
            this.showScreen('login');
        } else {
            // Default to login
            this.showScreen('login');
        }
    }

    async handleRoomRoute(roomId: string, targetScreen?: string) {
        const user = gameStore.getState().user;
        const token = gameStore.getState().token;
        
        if (!user || !token) {
            // User not logged in, redirect to login but preserve room ID
            this.updateURL('/', { roomId });
            this.showScreen('login');
            return;
        }
        
        try {
            // Check if room exists
            const rooms = await this.apiService.getRooms();
            const room = rooms.find(r => r.id === roomId);
            
            if (!room) {
                alert('Room not found');
                this.updateURL('/room');
                this.showScreen('room');
                return;
            }
            
            if (room.currentPlayers >= room.maxPlayers) {
                alert('Room is full');
                this.updateURL('/room');
                this.showScreen('room');
                return;
            }
            
            // Set room in store and connect socket
            gameStore.getState().setCurrentRoom(roomId);
            this.socketService.joinRoom(roomId);
            
            // Navigate to appropriate screen
            if (targetScreen === 'drawing') {
                this.showScreen('drawing');
            } else if (targetScreen === 'game') {
                this.showScreen('game');
            } else {
                // Default to drawing screen when joining a room
                this.updateURL(`/room/${roomId}/draw`);
                this.showScreen('drawing');
            }
        } catch (error) {
            console.error('Failed to handle room route:', error);
            this.updateURL('/room');
            this.showScreen('room');
        }
    }

    updateURL(path: string, params?: Record<string, string>) {
        const url = new URL(window.location.href);
        url.pathname = path;
        
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) {
                    url.searchParams.set(key, value);
                } else {
                    url.searchParams.delete(key);
                }
            });
        } else {
            url.search = '';
        }
        
        window.history.pushState({}, '', url.toString());
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
            
            // Check if there's a room ID in URL params
            const urlParams = new URLSearchParams(window.location.search);
            const roomId = urlParams.get('roomId');
            
            if (roomId) {
                // Remove roomId from URL params and redirect to room
                this.updateURL(`/room/${roomId}`);
                this.handleRoomRoute(roomId);
            } else {
                this.updateURL('/room');
                this.showScreen('room');
            }
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
                roomElement.addEventListener('click', () => {
                    this.updateURL(`/room/${room.id}`);
                    this.joinRoom(room.id);
                });
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
            this.updateURL(`/room/${room.id}`);
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
            this.updateURL(`/room/${roomId}/draw`);
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
        this.drawingCanvas = new DrawingCanvas(canvas, (bondLevel: number) => {
            this.updateBondDisplay(bondLevel);
        });
        
        this.setupDrawingUI();
        this.selectPetType('dog'); // Default selection
        
        // Add a slight delay to ensure proper positioning after DOM updates
        setTimeout(() => {
            if (this.drawingCanvas) {
                this.drawingCanvas.recalculatePosition();
            }
        }, 100);
        
        // Add window resize listener to recalculate canvas offset
        window.addEventListener('resize', () => {
            if (this.drawingCanvas) {
                this.drawingCanvas.recalculatePosition();
            }
        });
    }

    updateBondDisplay(bondLevel: number) {
        const bondBar = document.getElementById('bondBar');
        const bondText = document.getElementById('bondText');
        
        if (bondBar && bondText) {
            const displayLevel = Math.round(bondLevel * 10) / 10; // Round to 1 decimal place
            bondBar.style.width = `${bondLevel}%`;
            bondText.textContent = `Bond: ${displayLevel}%`;
            
            // Change color based on bond level
            if (bondLevel < 30) {
                bondBar.style.background = '#ff6b6b';
            } else if (bondLevel < 70) {
                bondBar.style.background = '#ffa726';
            } else {
                bondBar.style.background = '#66bb6a';
            }
        }
    }

    setupDrawingUI() {
        if (!this.drawingCanvas) return;

        const colorsContainer = document.getElementById('colorPalette');
        const sizesContainer = document.getElementById('brushSizes');

        // Clear existing UI
        if (colorsContainer) colorsContainer.innerHTML = '';
        if (sizesContainer) sizesContainer.innerHTML = '';

        // Add color palette
        if (colorsContainer) {
            this.drawingCanvas.getColorPalette().forEach(color => {
                const colorBtn = document.createElement('button');
                colorBtn.className = 'color-btn';
                colorBtn.style.backgroundColor = color;
                colorBtn.style.border = color === '#FFFFFF' ? '2px solid #ccc' : '2px solid transparent';
                colorBtn.addEventListener('click', () => {
                    this.drawingCanvas?.setBrushColor(color);
                    // Update active state
                    colorsContainer.querySelectorAll('.color-btn').forEach(btn => {
                        btn.style.border = btn === colorBtn 
                            ? '2px solid #333' 
                            : (btn.style.backgroundColor === 'rgb(255, 255, 255)' ? '2px solid #ccc' : '2px solid transparent');
                    });
                });
                colorsContainer.appendChild(colorBtn);
            });
        }

        // Add brush sizes
        if (sizesContainer) {
            this.drawingCanvas.getBrushSizes().forEach(size => {
                const sizeBtn = document.createElement('button');
                sizeBtn.className = 'size-btn';
                sizeBtn.textContent = `${size}px`;
                sizeBtn.addEventListener('click', () => {
                    this.drawingCanvas?.setBrushWidth(size);
                    // Update active state
                    sizesContainer.querySelectorAll('.size-btn').forEach(btn => {
                        btn.classList.remove('active');
                    });
                    sizeBtn.classList.add('active');
                });
                sizesContainer.appendChild(sizeBtn);
            });
            
            // Set default size active
            if (sizesContainer.children[1]) {
                sizesContainer.children[1].classList.add('active');
            }
        }
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
            const currentRoom = gameStore.getState().currentRoom;
            const petData = {
                roomId: currentRoom,
                drawingData: drawingData,
                imageData: imageData, // Add the image data
                type: this.selectedPetType,
                position: { x: 100, y: 300 }
            };

            this.socketService.createPet(petData);
            this.updateURL(`/room/${currentRoom}/game`);
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
        this.updateURL('/room');
        this.showScreen('room');
        this.loadRooms();
    }
}