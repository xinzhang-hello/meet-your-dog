import { fabric } from 'fabric';

export class DrawingCanvas {
    constructor(canvasElement) {
        this.canvas = new fabric.Canvas(canvasElement, {
            isDrawingMode: true,
            width: 600,
            height: 400
        });

        this.setupBrush();
        this.setupEvents();
    }

    setupBrush() {
        this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        this.canvas.freeDrawingBrush.width = 5;
        this.canvas.freeDrawingBrush.color = '#333333';
    }

    setupEvents() {
        this.canvas.on('path:created', () => {
            // Optional: Add any drawing completion logic
        });
    }

    clear() {
        this.canvas.clear();
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

    destroy() {
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
    }
}