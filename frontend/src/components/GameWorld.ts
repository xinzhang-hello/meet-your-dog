import Phaser from 'phaser';
import { GameWorldCore } from './GameWorldCore';

export class GameWorld {
    private gameWorldCore: GameWorldCore;

    constructor(container: HTMLElement, socketService: any) {
        this.gameWorldCore = new GameWorldCore(container, socketService);
    }

    destroy(): void {
        this.gameWorldCore.destroy();
    }

    // Public API methods for backward compatibility
    getRoadPlacement() {
        return this.gameWorldCore.getRoadPlacement();
    }

    getEnvironmentRenderer() {
        return this.gameWorldCore.getEnvironmentRenderer();
    }

    getPetBehavior() {
        return this.gameWorldCore.getPetBehavior();
    }

    getScene(): Phaser.Scene | null {
        return this.gameWorldCore.getScene();
    }
}