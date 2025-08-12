import Phaser from 'phaser';
import { gameStore } from '../stores/gameStore';

export class GameWorld {
    private container: HTMLElement;
    private socketService: any;
    private game: Phaser.Game | null;
    private pets: Map<string, any>;
    private unsubscribe: (() => void) | null;

    constructor(container: HTMLElement, socketService: any) {
        this.container = container;
        this.socketService = socketService;
        this.game = null;
        this.pets = new Map();
        this.unsubscribe = null;
        
        this.init();
    }

    init() {
        const gameWorld = this;
        
        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight - 60, // Account for UI
            parent: this.container,
            backgroundColor: '#87CEEB',
            scene: {
                preload: function() {
                    // No need to load images, we'll create shapes programmatically
                },
                create: function() {
                    gameWorld.createGameWorld(this);
                },
                update: function() {
                    gameWorld.updateGame();
                }
            },
            physics: {
                default: 'arcade',
                arcade: {
                    gravity: { y: 0 },
                    debug: false
                }
            }
        };

        this.game = new Phaser.Game(config);
        
        // Subscribe to game store updates
        this.unsubscribe = gameStore.subscribe((state) => {
            this.handleStoreUpdate(state);
        });
    }

    createGameWorld(scene: Phaser.Scene) {
        // Store scene reference for later use
        (this as any).scene = scene;
        
        // Create ground/roads
        this.createEnvironment(scene);
        
        // Load existing pets from online users only
        const state = gameStore.getState();
        const onlineUserIds = new Set(
            state.players
                .filter((player: any) => player.isActive)
                .map((player: any) => player.userId)
        );
        
        state.pets.forEach((pet: any) => {
            if (onlineUserIds.has(pet.userId)) {
                this.createPetSprite(pet, scene);
            }
        });
    }

    createEnvironment(scene: Phaser.Scene) {
        const width = scene.game.config.width as number;
        const height = scene.game.config.height as number;
        
        // Create simple ground
        const ground = scene.add.rectangle(width / 2, height - 50, width, 100, 0x90EE90);
        
        // Create some roads/paths
        const road1 = scene.add.rectangle(width / 2, height - 100, width, 20, 0x696969);
        const road2 = scene.add.rectangle(200, height / 2, 20, height, 0x696969);
        const road3 = scene.add.rectangle(width - 200, height / 2, 20, height, 0x696969);
    }

    createPetSprite(pet: any, scene: Phaser.Scene) {
        if (this.pets.has(pet.id)) {
            return; // Pet already exists
        }

        let petSprite: Phaser.GameObjects.GameObject;

        // If pet has imageData (the actual drawing), use it
        if (pet.imageData || (pet.drawingData && pet.drawingData.objects && pet.drawingData.objects.length > 0)) {
            // Create texture from the drawing image data
            const textureKey = `pet-${pet.id}`;
            
            if (pet.imageData) {
                // Load from base64 image data
                scene.load.once('complete', () => {
                    // Create the sprite after texture is loaded
                    petSprite = scene.add.image(pet.position.x, pet.position.y, textureKey);
                    petSprite.setScale(0.1); // Scale down the drawing to fit in game world
                    this.finalizePetCreation(pet, petSprite, scene);
                });
                
                scene.load.image(textureKey, pet.imageData);
                scene.load.start();
                return; // Exit early, sprite creation happens in callback
            }
        }

        // Fallback: create a colored rectangle if no image data
        const color = pet.type === 'dog' ? 0xffa500 : 0x9370db; // Orange for dog, purple for cat
        petSprite = scene.add.rectangle(
            pet.position.x, 
            pet.position.y, 
            40, 
            30, 
            color
        );

        this.finalizePetCreation(pet, petSprite, scene);
    }

    finalizePetCreation(pet: any, petSprite: Phaser.GameObjects.GameObject, scene: Phaser.Scene) {
        // No label - removed username display

        // Store pet data
        const petData = {
            sprite: petSprite,
            data: pet,
            targetX: pet.position.x,
            targetY: pet.position.y,
            speed: 50
        };

        this.pets.set(pet.id, petData);

        // Start random movement for this pet
        this.startPetMovement(pet.id);
    }

    startPetMovement(petId: string) {
        const scene = (this as any).scene;
        if (!scene) return;
        
        const movePet = () => {
            const pet = this.pets.get(petId);
            if (!pet) return;

            const width = scene.game.config.width as number;
            const height = scene.game.config.height as number;
            
            // Random movement within bounds
            const newX = Phaser.Math.Between(50, width - 50);
            const newY = Phaser.Math.Between(100, height - 150);
            
            pet.targetX = newX;
            pet.targetY = newY;

            // Schedule next movement
            scene.time.delayedCall(
                Phaser.Math.Between(2000, 5000), 
                movePet
            );

            // Notify other players of movement
            this.socketService.movePet(
                petId,
                gameStore.getState().currentRoom,
                { x: newX, y: newY }
            );
        };

        // Start movement
        scene.time.delayedCall(1000, movePet);
    }

    updateGame() {
        // Smooth pet movement
        this.pets.forEach((pet, id) => {
            const dx = pet.targetX - pet.sprite.x;
            const dy = pet.targetY - pet.sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 2) {
                const moveX = (dx / distance) * pet.speed * (1/60); // 60 FPS
                const moveY = (dy / distance) * pet.speed * (1/60);
                
                pet.sprite.x += moveX;
                pet.sprite.y += moveY;
            }
        });
    }

    handleStoreUpdate(state: any) {
        const scene = (this as any).scene;
        if (!scene) return;

        // Get list of online user IDs from active room members
        const onlineUserIds = new Set(
            state.players
                .filter((player: any) => player.isActive)
                .map((player: any) => player.userId)
        );

        // Add new pets from online users only
        state.pets.forEach((pet: any) => {
            if (!this.pets.has(pet.id) && onlineUserIds.has(pet.userId)) {
                this.createPetSprite(pet, scene);
            }
        });

        // Remove pets from users who went offline
        this.pets.forEach((petData, petId) => {
            if (!onlineUserIds.has(petData.data.userId)) {
                // Remove pet sprite from scene
                petData.sprite.destroy();
                // Remove from our pets map
                this.pets.delete(petId);
            }
        });

        // Update pet positions from other online players
        state.pets.forEach((pet: any) => {
            const existingPet = this.pets.get(pet.id);
            if (existingPet && 
                existingPet.data.userId !== gameStore.getState().user?.id &&
                onlineUserIds.has(pet.userId)) {
                existingPet.targetX = pet.position.x;
                existingPet.targetY = pet.position.y;
            }
        });
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
        
        this.pets.clear();
    }
}