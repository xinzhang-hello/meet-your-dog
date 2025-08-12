import Phaser from 'phaser';
import { gameStore } from '../stores/gameStore';
import { RoadPlacement } from './RoadPlacement';
import { EnvironmentRenderer } from './EnvironmentRenderer';
import { PetBehavior } from './PetBehavior';

export class GameWorldCore {
    private container: HTMLElement;
    private socketService: any;
    private game: Phaser.Game | null;
    private unsubscribe: (() => void) | null;
    private roadPlacement: RoadPlacement;
    private environmentRenderer: EnvironmentRenderer;
    private petBehavior: PetBehavior;
    private scene: Phaser.Scene | null = null;

    constructor(container: HTMLElement, socketService: any) {
        this.container = container;
        this.socketService = socketService;
        this.game = null;
        this.unsubscribe = null;
        
        // Initialize components
        this.roadPlacement = new RoadPlacement();
        this.environmentRenderer = new EnvironmentRenderer(this.roadPlacement);
        this.petBehavior = new PetBehavior(this.roadPlacement, this.socketService);
        
        this.init();
    }

    private init(): void {
        const gameWorld = this;
        
        const config = {
            type: Phaser.AUTO,
            width: window.innerWidth,
            height: window.innerHeight - 60,
            parent: this.container,
            backgroundColor: '#87CEEB',
            scene: {
                preload: function() {
                    // No preloading needed for procedural generation
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
                    gravity: { x: 0, y: 0 },
                    debug: false
                }
            }
        };

        this.game = new Phaser.Game(config);
        
        this.unsubscribe = gameStore.subscribe((state) => {
            this.handleStoreUpdate(state);
        });
    }

    private createGameWorld(scene: Phaser.Scene): void {
        this.scene = scene;
        
        const width = scene.game.config.width as number;
        const height = scene.game.config.height as number;
        
        // Create the environment using the renderer
        this.environmentRenderer.createEnvironment(scene, width, height);
        
        // Load existing pets from online users only
        const state = gameStore.getState();
        const onlineUserIds = new Set(
            state.players
                .filter((player: any) => player.isActive)
                .map((player: any) => player.userId)
        );
        
        state.pets.forEach((pet: any) => {
            if (onlineUserIds.has(pet.userId)) {
                this.petBehavior.createPetSprite(pet, scene);
            }
        });
    }

    private updateGame(): void {
        // Update pet movements and behaviors
        this.petBehavior.updateGame();
    }

    private handleStoreUpdate(state: any): void {
        if (!this.scene) return;

        // Handle pet updates through behavior manager
        this.petBehavior.handleStoreUpdate(state);
        
        // Add new pets from store
        this.petBehavior.addNewPetsFromStore(state, this.scene);
    }

    destroy(): void {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        if (this.game) {
            this.game.destroy(true);
            this.game = null;
        }
        
        this.petBehavior.destroy();
    }

    // Public API methods for external access
    getRoadPlacement(): RoadPlacement {
        return this.roadPlacement;
    }

    getEnvironmentRenderer(): EnvironmentRenderer {
        return this.environmentRenderer;
    }

    getPetBehavior(): PetBehavior {
        return this.petBehavior;
    }

    getScene(): Phaser.Scene | null {
        return this.scene;
    }
}