import { GameManager } from './src/GameManager';

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const gameManager = new GameManager();
    gameManager.init();
});