import { fabric } from 'fabric';

export class DrawingCanvas {
    private bondLevel: number = 0;
    private strokeCount: number = 0;
    private onBondUpdate?: (bondLevel: number) => void;

    constructor(canvasElement, onBondUpdate?: (bondLevel: number) => void) {
        // Get optimal canvas dimensions - leave space for UI elements
        const containerWidth = Math.min(window.innerWidth * 0.85, 1000); // 85% of screen width, max 1000px
        const containerHeight = Math.min(window.innerHeight * 0.4, 500); // 40% of screen height, max 500px

        this.canvas = new fabric.Canvas(canvasElement, {
            isDrawingMode: true,
            width: containerWidth,
            height: containerHeight
        });

        this.onBondUpdate = onBondUpdate;
        this.setupBrush();
        this.setupEvents();
        this.fixCanvasPositioning();
    }

    fixCanvasPositioning() {
        // Ensure canvas dimensions match the element dimensions
        const canvasElement = this.canvas.getElement();
        
        // Calculate optimal dimensions based on current window size - leave space for UI elements
        const containerWidth = Math.min(window.innerWidth * 0.85, 1000); // 85% of screen width, max 1000px
        const containerHeight = Math.min(window.innerHeight * 0.4, 500); // 40% of screen height, max 500px
        
        // Update canvas dimensions
        this.canvas.setDimensions({
            width: containerWidth,
            height: containerHeight
        });
        
        // Update the HTML canvas element dimensions too
        canvasElement.width = containerWidth;
        canvasElement.height = containerHeight;
        
        // Recalculate offset for proper mouse/touch handling
        this.canvas.calcOffset();
        this.canvas.renderAll();
    }

    setupBrush() {
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.freeDrawingBrush.width = 5;
        this.canvas.freeDrawingBrush.color = '#333333';
    }

    setupEvents() {
        this.canvas.on('path:created', () => {
            this.updateBond();
        });
    }

    updateBond() {
        this.strokeCount++;
        const bonusPerStroke = Math.max(0.5, 2 / Math.sqrt(this.strokeCount));
        this.bondLevel = Math.min(100, this.bondLevel + bonusPerStroke);
        
        if (this.onBondUpdate) {
            this.onBondUpdate(this.bondLevel);
        }
    }

    getBondLevel(): number {
        return Math.round(this.bondLevel);
    }

    resetBond() {
        this.bondLevel = 0;
        this.strokeCount = 0;
        if (this.onBondUpdate) {
            this.onBondUpdate(this.bondLevel);
        }
    }

    clear() {
        this.canvas.clear();
        this.resetBond();
        // Recalculate offset after clearing
        this.canvas.calcOffset();
    }

    isEmpty() {
        return this.canvas.getObjects().length === 0;
    }

    getDrawingData() {
        return this.canvas.toJSON();
    }

    getDrawingAsImage() {
        return this.canvas.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 1
        });
    }

    loadDrawingData(data) {
        this.canvas.loadFromJSON(data, () => {
            this.canvas.renderAll();
        });
    }

    setBrushColor(color) {
        this.canvas.freeDrawingBrush.color = color;
    }

    setBrushWidth(width) {
        this.canvas.freeDrawingBrush.width = width;
    }

    getColorPalette() {
        return [
            '#333333', // Black
            '#8B4513', // Brown  
            '#D2691E', // Chocolate
            '#FFD700', // Gold
            '#FFA500', // Orange
            '#FF6347', // Tomato
            '#DC143C', // Crimson
            '#FF1493', // Deep Pink
            '#9932CC', // Dark Orchid
            '#4169E1', // Royal Blue
            '#0000FF', // Blue
            '#00CED1', // Dark Turquoise
            '#00FF7F', // Spring Green
            '#32CD32', // Lime Green
            '#228B22', // Forest Green
            '#FFFFFF', // White
        ];
    }

    getBrushSizes() {
        return [2, 5, 8, 12, 20];
    }

    // Public method to recalculate canvas positioning
    recalculatePosition() {
        this.fixCanvasPositioning();
    }

    destroy() {
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
    }
}