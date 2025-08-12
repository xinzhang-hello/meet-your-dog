import Phaser from 'phaser';
import { gameStore } from '../stores/gameStore';

export class GameWorld {
    private container: HTMLElement;
    private socketService: any;
    private game: Phaser.Game | null;
    private pets: Map<string, any>;
    private unsubscribe: (() => void) | null;
    private roadNetwork: Array<{x1: number, y1: number, x2: number, y2: number, width: number}>;
    private roadPoints: Array<{x: number, y: number}>;

    constructor(container: HTMLElement, socketService: any) {
        this.container = container;
        this.socketService = socketService;
        this.game = null;
        this.pets = new Map();
        this.unsubscribe = null;
        this.roadNetwork = [];
        this.roadPoints = [];
        
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
                    gravity: { x: 0, y: 0 },
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
        
        // Define road network first - needed for other methods
        this.roadNetwork = [
            // Horizontal roads
            { x1: 0, y1: height * 0.3, x2: width, y2: height * 0.3, width: 60 },
            { x1: 0, y1: height * 0.5, x2: width, y2: height * 0.5, width: 80 },
            { x1: 0, y1: height * 0.7, x2: width, y2: height * 0.7, width: 60 },
            
            // Vertical roads
            { x1: width * 0.2, y1: 0, x2: width * 0.2, y2: height, width: 50 },
            { x1: width * 0.5, y1: 0, x2: width * 0.5, y2: height, width: 70 },
            { x1: width * 0.8, y1: 0, x2: width * 0.8, y2: height, width: 50 }
        ];
        
        // Create layered background with gradient sky
        this.createSkyBackground(scene, width, height);
        
        // Create varied terrain with grass and park areas
        this.createTerrain(scene, width, height);
        
        // Add buildings and structures
        this.createBuildings(scene, width, height);
        
        // Add swimming pool
        this.createSwimmingPool(scene, width, height);
        
        // Add trees and vegetation
        this.createVegetation(scene, width, height);
        
        // Add decorative walls and fences
        this.createWalls(scene, width, height);
        
        // Add flowers and landscaping
        this.createFlowers(scene, width, height);
        
        // Create road visuals and collect walkable points
        this.roadPoints = [];
        this.roadNetwork.forEach((road, index) => {
            // Draw road
            const roadGraphics = scene.add.graphics();
            roadGraphics.lineStyle(road.width, 0x404040, 1);
            roadGraphics.beginPath();
            roadGraphics.moveTo(road.x1, road.y1);
            roadGraphics.lineTo(road.x2, road.y2);
            roadGraphics.strokePath();
            roadGraphics.setDepth(5);
            
            // Add yellow center line (dashed line approximation with multiple small lines)
            const centerGraphics = scene.add.graphics();
            centerGraphics.lineStyle(3, 0xFFD700, 1);
            centerGraphics.setDepth(6);
            
            const roadLength = Math.sqrt(
                Math.pow(road.x2 - road.x1, 2) + Math.pow(road.y2 - road.y1, 2)
            );
            const dashLength = 10;
            const gapLength = 10;
            const totalDashUnit = dashLength + gapLength;
            const numDashes = Math.floor(roadLength / totalDashUnit);
            
            for (let i = 0; i < numDashes; i++) {
                const startT = (i * totalDashUnit) / roadLength;
                const endT = ((i * totalDashUnit) + dashLength) / roadLength;
                
                const startX = road.x1 + (road.x2 - road.x1) * startT;
                const startY = road.y1 + (road.y2 - road.y1) * startT;
                const endX = road.x1 + (road.x2 - road.x1) * endT;
                const endY = road.y1 + (road.y2 - road.y1) * endT;
                
                centerGraphics.beginPath();
                centerGraphics.moveTo(startX, startY);
                centerGraphics.lineTo(endX, endY);
                centerGraphics.strokePath();
            }
            
            // Generate walkable points along the road
            const steps = Math.floor(roadLength / 30); // Point every 30 pixels
            
            for (let i = 0; i <= steps; i++) {
                const t = i / steps;
                const x = road.x1 + (road.x2 - road.x1) * t;
                const y = road.y1 + (road.y2 - road.y1) * t;
                
                // Add some random offset within road width for variety
                const offsetRange = road.width * 0.3;
                const offsetX = (Math.random() - 0.5) * offsetRange;
                const offsetY = (Math.random() - 0.5) * offsetRange;
                
                this.roadPoints.push({ 
                    x: Math.max(0, Math.min(width, x + offsetX)), 
                    y: Math.max(0, Math.min(height, y + offsetY))
                });
            }
        });
        
        // Add intersection points (where roads cross)
        this.addIntersectionPoints(width, height);
        
        // Add sidewalks
        this.createSidewalks(scene, width, height);
        
        // Add park walkable areas
        this.addParkWalkableAreas(width, height);
    }

    createSkyBackground(scene: Phaser.Scene, width: number, height: number) {
        // Create gradient sky background
        const skyGraphics = scene.add.graphics();
        
        // Sky gradient from light blue to deeper blue
        for (let i = 0; i < height * 0.4; i++) {
            const alpha = i / (height * 0.4);
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                { r: 135, g: 206, b: 235 }, // Light sky blue
                { r: 70, g: 130, b: 180 },  // Steel blue
                1,
                alpha
            );
            const hexColor = Phaser.Display.Color.GetColor(color.r, color.g, color.b);
            skyGraphics.lineStyle(1, hexColor, 1);
            skyGraphics.beginPath();
            skyGraphics.moveTo(0, i);
            skyGraphics.lineTo(width, i);
            skyGraphics.strokePath();
        }
        skyGraphics.setDepth(-20);
        
        // Add some simple clouds
        this.createClouds(scene, width, height);
    }

    createClouds(scene: Phaser.Scene, width: number, height: number) {
        const cloudPositions = [
            { x: width * 0.15, y: height * 0.08 },
            { x: width * 0.45, y: height * 0.12 },
            { x: width * 0.75, y: height * 0.06 },
            { x: width * 0.85, y: height * 0.15 }
        ];

        cloudPositions.forEach(pos => {
            const cloudGroup = scene.add.group();
            
            // Create puffy cloud with multiple circles
            const cloudParts = [
                { x: 0, y: 0, radius: 25 },
                { x: 20, y: -5, radius: 30 },
                { x: 40, y: 0, radius: 25 },
                { x: 15, y: -15, radius: 20 },
                { x: 25, y: -20, radius: 18 }
            ];
            
            cloudParts.forEach(part => {
                const cloudPart = scene.add.circle(
                    pos.x + part.x, 
                    pos.y + part.y, 
                    part.radius, 
                    0xF0F8FF, 
                    0.8
                );
                cloudPart.setDepth(-15);
                cloudGroup.add(cloudPart);
            });
        });
    }

    createTerrain(scene: Phaser.Scene, width: number, height: number) {
        // Create varied grass terrain
        const terrainGraphics = scene.add.graphics();
        
        // Base grass layer
        terrainGraphics.fillStyle(0x228B22, 1);
        terrainGraphics.fillRect(0, height * 0.3, width, height * 0.7);
        
        // Add texture variation with different shades of green
        const grassVariations = [
            { color: 0x32CD32, alpha: 0.3 }, // Lime green
            { color: 0x90EE90, alpha: 0.2 }, // Light green
            { color: 0x006400, alpha: 0.4 }  // Dark green
        ];
        
        grassVariations.forEach(variation => {
            terrainGraphics.fillStyle(variation.color, variation.alpha);
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * width;
                const y = height * 0.3 + Math.random() * height * 0.7;
                const size = 20 + Math.random() * 40;
                terrainGraphics.fillEllipse(x, y, size, size * 0.7);
            }
        });
        
        terrainGraphics.setDepth(-5);
        
        // Add park areas with different grass
        this.createParkAreas(scene, width, height);
    }

    createParkAreas(scene: Phaser.Scene, width: number, height: number) {
        const parkAreas = [
            { x: width * 0.1, y: height * 0.15, w: width * 0.25, h: height * 0.2 },
            { x: width * 0.6, y: height * 0.8, w: width * 0.3, h: height * 0.15 }
        ];

        parkAreas.forEach(park => {
            const parkGraphics = scene.add.graphics();
            parkGraphics.fillStyle(0x90EE90, 1); // Lighter green for parks
            parkGraphics.fillRoundedRect(park.x, park.y, park.w, park.h, 15);
            parkGraphics.setDepth(-3);
        });
    }

    createBuildings(scene: Phaser.Scene, width: number, height: number) {
        // High buildings (skyscrapers in background)
        this.createHighBuildings(scene, width, height);
        
        // Low buildings (houses and shops)
        this.createLowBuildings(scene, width, height);
    }

    createHighBuildings(scene: Phaser.Scene, width: number, height: number) {
        const highBuildings = [
            { x: width * 0.05, y: height * 0.1, w: 60, h: height * 0.25 },
            { x: width * 0.12, y: height * 0.05, w: 45, h: height * 0.3 },
            { x: width * 0.9, y: height * 0.08, w: 55, h: height * 0.27 },
            { x: width * 0.85, y: height * 0.12, w: 40, h: height * 0.23 }
        ];

        highBuildings.forEach((building, index) => {
            // Main building structure
            const buildingGraphics = scene.add.graphics();
            buildingGraphics.fillStyle(0x708090, 1); // Slate gray
            buildingGraphics.fillRect(building.x, building.y, building.w, building.h);
            
            // Add building details
            buildingGraphics.lineStyle(2, 0x2F4F4F, 1); // Dark slate gray
            buildingGraphics.strokeRect(building.x, building.y, building.w, building.h);
            
            // Add windows
            buildingGraphics.fillStyle(0x87CEEB, 0.8); // Sky blue windows
            const windowRows = Math.floor(building.h / 25);
            const windowCols = Math.floor(building.w / 15);
            
            for (let row = 1; row < windowRows; row++) {
                for (let col = 1; col < windowCols; col++) {
                    const winX = building.x + col * (building.w / windowCols);
                    const winY = building.y + row * (building.h / windowRows);
                    buildingGraphics.fillRect(winX, winY, 8, 12);
                }
            }
            
            buildingGraphics.setDepth(-8);
        });
    }

    createLowBuildings(scene: Phaser.Scene, width: number, height: number) {
        const lowBuildings = [
            { x: width * 0.25, y: height * 0.2, w: 80, h: 60, color: 0xDEB887 }, // Burlywood house
            { x: width * 0.35, y: height * 0.18, w: 70, h: 70, color: 0xF4A460 }, // Sandy brown house
            { x: width * 0.65, y: height * 0.22, w: 90, h: 55, color: 0xD2691E }, // Chocolate house
            { x: width * 0.82, y: height * 0.25, w: 75, h: 65, color: 0xCD853F }, // Peru house
            { x: width * 0.02, y: height * 0.4, w: 85, h: 50, color: 0xBC8F8F }   // Rosy brown shop
        ];

        lowBuildings.forEach(building => {
            const buildingGraphics = scene.add.graphics();
            
            // Main building
            buildingGraphics.fillStyle(building.color, 1);
            buildingGraphics.fillRect(building.x, building.y, building.w, building.h);
            
            // Roof (triangular)
            buildingGraphics.fillStyle(0x8B4513, 1); // Saddle brown roof
            buildingGraphics.beginPath();
            buildingGraphics.moveTo(building.x - 5, building.y);
            buildingGraphics.lineTo(building.x + building.w / 2, building.y - 20);
            buildingGraphics.lineTo(building.x + building.w + 5, building.y);
            buildingGraphics.closePath();
            buildingGraphics.fillPath();
            
            // Door
            buildingGraphics.fillStyle(0x8B4513, 1);
            buildingGraphics.fillRect(
                building.x + building.w / 2 - 10, 
                building.y + building.h - 25, 
                20, 
                25
            );
            
            // Windows
            buildingGraphics.fillStyle(0x87CEEB, 0.8);
            buildingGraphics.fillRect(building.x + 15, building.y + 15, 15, 15);
            buildingGraphics.fillRect(building.x + building.w - 30, building.y + 15, 15, 15);
            
            buildingGraphics.setDepth(2);
        });
    }

    createSwimmingPool(scene: Phaser.Scene, width: number, height: number) {
        const poolX = width * 0.6;
        const poolY = height * 0.4;
        const poolW = 120;
        const poolH = 80;
        
        // Pool deck (concrete surrounding)
        const deckGraphics = scene.add.graphics();
        deckGraphics.fillStyle(0xD3D3D3, 1); // Light gray concrete
        deckGraphics.fillRoundedRect(poolX - 15, poolY - 15, poolW + 30, poolH + 30, 10);
        deckGraphics.setDepth(1);
        
        // Pool water
        const poolGraphics = scene.add.graphics();
        poolGraphics.fillStyle(0x0080FF, 0.8); // Bright blue water
        poolGraphics.fillRoundedRect(poolX, poolY, poolW, poolH, 8);
        
        // Pool tile border
        poolGraphics.lineStyle(4, 0x4169E1, 1); // Royal blue tiles
        poolGraphics.strokeRoundedRect(poolX, poolY, poolW, poolH, 8);
        
        // Water shimmer effect
        poolGraphics.fillStyle(0x87CEEB, 0.3);
        for (let i = 0; i < 10; i++) {
            const shimmerX = poolX + Math.random() * poolW;
            const shimmerY = poolY + Math.random() * poolH;
            poolGraphics.fillCircle(shimmerX, shimmerY, 3 + Math.random() * 5);
        }
        
        poolGraphics.setDepth(3);
        
        // Pool ladders
        const ladderGraphics = scene.add.graphics();
        ladderGraphics.lineStyle(3, 0xC0C0C0, 1); // Silver ladders
        ladderGraphics.beginPath();
        ladderGraphics.moveTo(poolX + poolW - 5, poolY);
        ladderGraphics.lineTo(poolX + poolW - 5, poolY + 25);
        ladderGraphics.moveTo(poolX + poolW - 15, poolY);
        ladderGraphics.lineTo(poolX + poolW - 15, poolY + 25);
        // Ladder rungs
        for (let i = 0; i < 3; i++) {
            const rungY = poolY + 5 + i * 7;
            ladderGraphics.moveTo(poolX + poolW - 15, rungY);
            ladderGraphics.lineTo(poolX + poolW - 5, rungY);
        }
        ladderGraphics.strokePath();
        ladderGraphics.setDepth(4);
        
        // Pool chairs
        this.createPoolChairs(scene, poolX, poolY, poolW, poolH);
    }

    createPoolChairs(scene: Phaser.Scene, poolX: number, poolY: number, poolW: number, poolH: number) {
        const chairPositions = [
            { x: poolX - 30, y: poolY + 20 },
            { x: poolX - 30, y: poolY + 50 },
            { x: poolX + poolW + 20, y: poolY + 15 }
        ];
        
        chairPositions.forEach(pos => {
            const chairGraphics = scene.add.graphics();
            
            // Chair base
            chairGraphics.fillStyle(0xFFFFFF, 1); // White chair
            chairGraphics.fillRect(pos.x, pos.y, 25, 15);
            
            // Chair back
            chairGraphics.fillRect(pos.x, pos.y - 10, 25, 12);
            
            // Chair legs (simple lines)
            chairGraphics.lineStyle(2, 0xC0C0C0, 1);
            chairGraphics.beginPath();
            chairGraphics.moveTo(pos.x + 2, pos.y + 15);
            chairGraphics.lineTo(pos.x + 2, pos.y + 25);
            chairGraphics.moveTo(pos.x + 23, pos.y + 15);
            chairGraphics.lineTo(pos.x + 23, pos.y + 25);
            chairGraphics.strokePath();
            
            chairGraphics.setDepth(4);
        });
    }

    createVegetation(scene: Phaser.Scene, width: number, height: number) {
        // Large trees
        this.createLargeTrees(scene, width, height);
        
        // Small trees and bushes
        this.createSmallVegetation(scene, width, height);
        
        // Palm trees near pool
        this.createPalmTrees(scene, width, height);
    }

    createLargeTrees(scene: Phaser.Scene, width: number, height: number) {
        const treePositions = [
            { x: width * 0.15, y: height * 0.35 },
            { x: width * 0.4, y: height * 0.6 },
            { x: width * 0.75, y: height * 0.65 },
            { x: width * 0.05, y: height * 0.75 },
            { x: width * 0.9, y: height * 0.45 }
        ];

        treePositions.forEach(pos => {
            // Tree trunk
            const trunkGraphics = scene.add.graphics();
            trunkGraphics.fillStyle(0x8B4513, 1); // Brown trunk
            trunkGraphics.fillRect(pos.x - 8, pos.y - 20, 16, 40);
            trunkGraphics.setDepth(8);
            
            // Tree canopy (layered circles for fullness)
            const canopyLayers = [
                { offset: { x: 0, y: -35 }, radius: 40, color: 0x228B22 },
                { offset: { x: -15, y: -45 }, radius: 30, color: 0x32CD32 },
                { offset: { x: 15, y: -40 }, radius: 35, color: 0x228B22 },
                { offset: { x: 0, y: -55 }, radius: 25, color: 0x90EE90 }
            ];
            
            canopyLayers.forEach((layer, index) => {
                const canopyGraphics = scene.add.graphics();
                canopyGraphics.fillStyle(layer.color, 0.8);
                canopyGraphics.fillCircle(
                    pos.x + layer.offset.x, 
                    pos.y + layer.offset.y, 
                    layer.radius
                );
                canopyGraphics.setDepth(7 - index);
            });
        });
    }

    createSmallVegetation(scene: Phaser.Scene, width: number, height: number) {
        // Bushes
        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = height * 0.4 + Math.random() * height * 0.5;
            
            // Avoid placing on roads
            const tooCloseToRoad = this.roadNetwork.some(road => {
                const distToRoad = this.distanceToLine(x, y, road.x1, road.y1, road.x2, road.y2);
                return distToRoad < road.width / 2 + 20;
            });
            
            if (!tooCloseToRoad) {
                const bushGraphics = scene.add.graphics();
                bushGraphics.fillStyle(0x228B22, 0.7);
                
                // Multi-circle bush
                const bushParts = [
                    { x: 0, y: 0, radius: 15 },
                    { x: 8, y: -5, radius: 12 },
                    { x: -8, y: -3, radius: 13 }
                ];
                
                bushParts.forEach(part => {
                    bushGraphics.fillCircle(x + part.x, y + part.y, part.radius);
                });
                
                bushGraphics.setDepth(6);
            }
        }
    }

    createPalmTrees(scene: Phaser.Scene, width: number, height: number) {
        const palmPositions = [
            { x: width * 0.55, y: height * 0.35 },
            { x: width * 0.75, y: height * 0.52 }
        ];

        palmPositions.forEach(pos => {
            // Palm trunk (slightly curved using multiple line segments)
            const trunkGraphics = scene.add.graphics();
            trunkGraphics.lineStyle(15, 0xDEB887, 1); // Burlywood
            trunkGraphics.beginPath();
            trunkGraphics.moveTo(pos.x, pos.y);
            // Create curve with multiple line segments
            const segments = 10;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                // Quadratic bezier curve calculation
                const x = (1-t)*(1-t)*pos.x + 2*(1-t)*t*(pos.x + 10) + t*t*(pos.x + 5);
                const y = (1-t)*(1-t)*pos.y + 2*(1-t)*t*(pos.y - 30) + t*t*(pos.y - 60);
                trunkGraphics.lineTo(x, y);
            }
            trunkGraphics.strokePath();
            trunkGraphics.setDepth(8);
            
            // Palm fronds
            const frondAngles = [0, 45, 90, 135, 180, 225, 270, 315];
            frondAngles.forEach(angle => {
                const frondGraphics = scene.add.graphics();
                frondGraphics.fillStyle(0x228B22, 0.8);
                
                const angleRad = (angle * Math.PI) / 180;
                const frondLength = 35;
                const frondWidth = 8;
                
                // Create frond shape using path
                frondGraphics.beginPath();
                
                // Start at palm top
                const startX = pos.x + 5;
                const startY = pos.y - 60;
                
                // Calculate frond tip
                const endX = startX + Math.cos(angleRad) * frondLength;
                const endY = startY + Math.sin(angleRad) * frondLength;
                
                // Create frond shape with curves
                const perpX = Math.cos(angleRad + Math.PI/2) * frondWidth/2;
                const perpY = Math.sin(angleRad + Math.PI/2) * frondWidth/2;
                
                frondGraphics.moveTo(startX, startY);
                frondGraphics.lineTo(startX + perpX, startY + perpY);
                frondGraphics.lineTo(endX + perpX/3, endY + perpY/3);
                frondGraphics.lineTo(endX, endY);
                frondGraphics.lineTo(endX - perpX/3, endY - perpY/3);
                frondGraphics.lineTo(startX - perpX, startY - perpY);
                frondGraphics.closePath();
                frondGraphics.fillPath();
                
                frondGraphics.setDepth(9);
            });
        });
    }

    createWalls(scene: Phaser.Scene, width: number, height: number) {
        // Decorative garden walls
        const walls = [
            { x1: width * 0.3, y1: height * 0.15, x2: width * 0.45, y2: height * 0.15, height: 25 },
            { x1: width * 0.7, y1: height * 0.75, x2: width * 0.85, y2: height * 0.75, height: 20 },
            { x1: width * 0.1, y1: height * 0.6, x2: width * 0.1, y2: height * 0.8, height: 30 }
        ];

        walls.forEach(wall => {
            const wallGraphics = scene.add.graphics();
            
            // Wall base
            wallGraphics.fillStyle(0x696969, 1); // Dim gray
            const wallLength = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);
            const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
            
            // Calculate wall corners
            const perpX = Math.cos(angle + Math.PI/2) * wall.height/2;
            const perpY = Math.sin(angle + Math.PI/2) * wall.height/2;
            
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            
            // Create wall rectangle using transformed coordinates
            wallGraphics.beginPath();
            wallGraphics.moveTo(wall.x1 + perpX, wall.y1 + perpY);
            wallGraphics.lineTo(wall.x1 + cosAngle * wallLength + perpX, wall.y1 + sinAngle * wallLength + perpY);
            wallGraphics.lineTo(wall.x1 + cosAngle * wallLength - perpX, wall.y1 + sinAngle * wallLength - perpY);
            wallGraphics.lineTo(wall.x1 - perpX, wall.y1 - perpY);
            wallGraphics.closePath();
            wallGraphics.fillPath();
            
            // Add brick texture lines
            wallGraphics.lineStyle(1, 0x2F4F4F, 0.5);
            for (let i = 0; i < wallLength; i += 20) {
                const x1 = wall.x1 + cosAngle * i + perpX;
                const y1 = wall.y1 + sinAngle * i + perpY;
                const x2 = wall.x1 + cosAngle * i - perpX;
                const y2 = wall.y1 + sinAngle * i - perpY;
                
                wallGraphics.beginPath();
                wallGraphics.moveTo(x1, y1);
                wallGraphics.lineTo(x2, y2);
                wallGraphics.strokePath();
            }
            
            wallGraphics.setDepth(7);
        });
        
        // Garden fence around park area
        this.createGardenFence(scene, width, height);
    }

    createGardenFence(scene: Phaser.Scene, width: number, height: number) {
        const fenceX = width * 0.08;
        const fenceY = height * 0.12;
        const fenceW = width * 0.3;
        const fenceH = height * 0.25;
        
        const fenceGraphics = scene.add.graphics();
        fenceGraphics.lineStyle(3, 0x8B4513, 1); // Brown fence
        
        // Fence posts
        const postSpacing = 25;
        const numPosts = Math.floor(fenceW / postSpacing) + 1;
        
        for (let i = 0; i <= numPosts; i++) {
            const postX = fenceX + i * postSpacing;
            fenceGraphics.beginPath();
            fenceGraphics.moveTo(postX, fenceY);
            fenceGraphics.lineTo(postX, fenceY + 30);
            fenceGraphics.strokePath();
        }
        
        // Fence rails
        fenceGraphics.lineStyle(2, 0x8B4513, 1);
        fenceGraphics.beginPath();
        fenceGraphics.moveTo(fenceX, fenceY + 10);
        fenceGraphics.lineTo(fenceX + fenceW, fenceY + 10);
        fenceGraphics.moveTo(fenceX, fenceY + 20);
        fenceGraphics.lineTo(fenceX + fenceW, fenceY + 20);
        fenceGraphics.strokePath();
        
        fenceGraphics.setDepth(6);
    }

    createFlowers(scene: Phaser.Scene, width: number, height: number) {
        // Flower beds near buildings and along paths
        this.createFlowerBeds(scene, width, height);
        
        // Individual flowers scattered around
        this.createScatteredFlowers(scene, width, height);
    }

    createFlowerBeds(scene: Phaser.Scene, width: number, height: number) {
        const flowerBeds = [
            { x: width * 0.2, y: height * 0.32, w: 60, h: 20 },
            { x: width * 0.8, y: height * 0.6, w: 80, h: 25 },
            { x: width * 0.45, y: height * 0.85, w: 70, h: 15 }
        ];

        flowerBeds.forEach(bed => {
            // Soil bed
            const bedGraphics = scene.add.graphics();
            bedGraphics.fillStyle(0x8B4513, 0.8); // Brown soil
            bedGraphics.fillRoundedRect(bed.x, bed.y, bed.w, bed.h, 8);
            bedGraphics.setDepth(4);
            
            // Flowers in the bed
            const numFlowers = Math.floor((bed.w * bed.h) / 100);
            for (let i = 0; i < numFlowers; i++) {
                const flowerX = bed.x + 5 + Math.random() * (bed.w - 10);
                const flowerY = bed.y + 5 + Math.random() * (bed.h - 10);
                
                this.createSingleFlower(scene, flowerX, flowerY, 5);
            }
        });
    }

    createScatteredFlowers(scene: Phaser.Scene, width: number, height: number) {
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * width;
            const y = height * 0.4 + Math.random() * height * 0.5;
            
            // Avoid placing on roads
            const tooCloseToRoad = this.roadNetwork.some(road => {
                const distToRoad = this.distanceToLine(x, y, road.x1, road.y1, road.x2, road.y2);
                return distToRoad < road.width / 2 + 15;
            });
            
            if (!tooCloseToRoad) {
                this.createSingleFlower(scene, x, y, 3 + Math.random() * 4);
            }
        }
    }

    createSingleFlower(scene: Phaser.Scene, x: number, y: number, size: number) {
        const flowerGraphics = scene.add.graphics();
        
        // Flower colors
        const colors = [0xFF69B4, 0xFF1493, 0xFFB6C1, 0xFF6347, 0xFFA500, 0xFFD700, 0x9370DB];
        const flowerColor = colors[Math.floor(Math.random() * colors.length)];
        
        // Flower stem
        flowerGraphics.lineStyle(2, 0x228B22, 1);
        flowerGraphics.beginPath();
        flowerGraphics.moveTo(x, y);
        flowerGraphics.lineTo(x, y + size + 5);
        flowerGraphics.strokePath();
        
        // Flower petals (5-6 petals around center)
        const numPetals = 5 + Math.floor(Math.random() * 2);
        flowerGraphics.fillStyle(flowerColor, 0.8);
        
        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * size;
            const petalY = y + Math.sin(angle) * size;
            flowerGraphics.fillCircle(petalX, petalY, size * 0.6);
        }
        
        // Flower center
        flowerGraphics.fillStyle(0xFFD700, 1); // Golden center
        flowerGraphics.fillCircle(x, y, size * 0.4);
        
        flowerGraphics.setDepth(5);
    }

    addParkWalkableAreas(width: number, height: number) {
        // Add walkable points in park areas and around buildings
        const parkWalkableAreas = [
            { x: width * 0.1, y: height * 0.15, w: width * 0.25, h: height * 0.2 },
            { x: width * 0.6, y: height * 0.8, w: width * 0.3, h: height * 0.15 }
        ];

        parkWalkableAreas.forEach(area => {
            const pointsPerArea = 15;
            for (let i = 0; i < pointsPerArea; i++) {
                const x = area.x + Math.random() * area.w;
                const y = area.y + Math.random() * area.h;
                this.roadPoints.push({ x, y });
            }
        });
        
        // Add points around swimming pool area
        const poolArea = { x: width * 0.55, y: height * 0.35, w: 150, h: 110 };
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const radius = 80 + Math.random() * 30;
            const x = poolArea.x + poolArea.w / 2 + Math.cos(angle) * radius;
            const y = poolArea.y + poolArea.h / 2 + Math.sin(angle) * radius;
            
            if (x > 0 && x < width && y > height * 0.3 && y < height) {
                this.roadPoints.push({ x, y });
            }
        }
    }

    distanceToLine(px: number, py: number, x1: number, y1: number, x2: number, y2: number): number {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }

        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }

        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    addIntersectionPoints(width: number, height: number) {
        const horizontalRoads = this.roadNetwork.filter(road => 
            Math.abs(road.y1 - road.y2) < Math.abs(road.x1 - road.x2)
        );
        const verticalRoads = this.roadNetwork.filter(road => 
            Math.abs(road.x1 - road.x2) < Math.abs(road.y1 - road.y2)
        );
        
        horizontalRoads.forEach(hRoad => {
            verticalRoads.forEach(vRoad => {
                // Find intersection point
                const intersectionX = vRoad.x1;
                const intersectionY = hRoad.y1;
                
                // Add multiple points around the intersection for pets to choose from
                for (let i = 0; i < 8; i++) {
                    const angle = (i / 8) * Math.PI * 2;
                    const radius = Math.max(hRoad.width, vRoad.width) * 0.3;
                    const x = intersectionX + Math.cos(angle) * radius;
                    const y = intersectionY + Math.sin(angle) * radius;
                    
                    this.roadPoints.push({ 
                        x: Math.max(0, Math.min(width, x)), 
                        y: Math.max(0, Math.min(height, y))
                    });
                }
            });
        });
    }
    
    createSidewalks(scene: Phaser.Scene, width: number, height: number) {
        this.roadNetwork.forEach(road => {
            const sidewalkWidth = 15;
            const sidewalkColor = 0xC0C0C0;
            
            // Calculate perpendicular offset for sidewalks
            const roadLength = Math.sqrt(
                Math.pow(road.x2 - road.x1, 2) + Math.pow(road.y2 - road.y1, 2)
            );
            const perpX = -(road.y2 - road.y1) / roadLength * (road.width / 2 + sidewalkWidth / 2);
            const perpY = (road.x2 - road.x1) / roadLength * (road.width / 2 + sidewalkWidth / 2);
            
            // Draw sidewalks on both sides of the road
            [-1, 1].forEach(side => {
                const sidewalkGraphics = scene.add.graphics();
                sidewalkGraphics.lineStyle(sidewalkWidth, sidewalkColor, 1);
                sidewalkGraphics.beginPath();
                sidewalkGraphics.moveTo(
                    road.x1 + perpX * side, 
                    road.y1 + perpY * side
                );
                sidewalkGraphics.lineTo(
                    road.x2 + perpX * side, 
                    road.y2 + perpY * side
                );
                sidewalkGraphics.strokePath();
            });
        });
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
                    (petSprite as Phaser.GameObjects.Image).setScale(0.1); // Scale down the drawing to fit in game world
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

        // Find nearest road point for initial position
        const nearestRoadPoint = this.findNearestRoadPoint(pet.position.x, pet.position.y);
        if (nearestRoadPoint) {
            (petSprite as any).x = nearestRoadPoint.x;
            (petSprite as any).y = nearestRoadPoint.y;
        }

        // Store pet data
        const petData = {
            sprite: petSprite,
            data: pet,
            targetX: nearestRoadPoint ? nearestRoadPoint.x : pet.position.x,
            targetY: nearestRoadPoint ? nearestRoadPoint.y : pet.position.y,
            speed: 15 + Math.random() * 20, // Variable speed between 15-35
            currentRoadPoint: nearestRoadPoint || { x: pet.position.x, y: pet.position.y }
        };

        this.pets.set(pet.id, petData);

        // Start road-based movement for this pet
        this.startPetMovement(pet.id);
    }

    startPetMovement(petId: string) {
        const scene = (this as any).scene;
        if (!scene) return;
        
        const pet = this.pets.get(petId);
        if (!pet) return;

        // Initialize pet behavior state
        pet.behaviorState = pet.data.type === 'dog' ? 'exploring' : 'resting';
        pet.behaviorTimer = 0;
        pet.restingSpot = null;
        pet.lastDirection = { x: 0, y: 0 };
        pet.curiosityTarget = null;

        const updatePetBehavior = () => {
            this.updateRealisticPetMovement(petId);
            // Continue behavior updates
            scene.time.delayedCall(100, updatePetBehavior); // Update every 100ms for smooth behavior
        };

        // Start behavior system
        scene.time.delayedCall(500, updatePetBehavior);
    }

    updateRealisticPetMovement(petId: string) {
        const pet = this.pets.get(petId);
        if (!pet || this.roadPoints.length === 0) return;

        const scene = (this as any).scene;
        const petType = pet.data.type;
        
        pet.behaviorTimer += 100; // Increment by update interval

        // Realistic behavior patterns based on pet type
        if (petType === 'dog') {
            this.updateDogBehavior(pet, scene);
        } else if (petType === 'cat') {
            this.updateCatBehavior(pet, scene);
        }
    }

    updateDogBehavior(pet: any, scene: Phaser.Scene) {
        switch (pet.behaviorState) {
            case 'exploring':
                // Dogs are more active, explore in semi-random patterns
                if (pet.behaviorTimer > Phaser.Math.Between(2000, 4000)) {
                    // Choose movement: sniffing spot, following path, or chasing interest
                    const behavior = Phaser.Math.RND.weightedPick(['sniffing', 'patrolling', 'chasing']);
                    
                    if (behavior === 'sniffing') {
                        this.setSniffingTarget(pet);
                        pet.behaviorState = 'sniffing';
                    } else if (behavior === 'patrolling') {
                        this.setPatrolTarget(pet);
                        pet.behaviorState = 'patrolling';
                    } else {
                        this.setChasingTarget(pet);
                        pet.behaviorState = 'chasing';
                    }
                    pet.behaviorTimer = 0;
                }
                break;

            case 'sniffing':
                // Dogs pause to sniff, then move to nearby spots
                if (pet.behaviorTimer > Phaser.Math.Between(1000, 3000)) {
                    pet.behaviorState = 'exploring';
                    pet.behaviorTimer = 0;
                }
                break;

            case 'patrolling':
                // Dogs walk in somewhat straight lines, occasionally changing direction
                if (pet.behaviorTimer > Phaser.Math.Between(3000, 6000)) {
                    pet.behaviorState = 'exploring';
                    pet.behaviorTimer = 0;
                }
                break;

            case 'chasing':
                // Dogs might "chase" imaginary things or run in bursts
                if (pet.behaviorTimer > Phaser.Math.Between(1500, 3000)) {
                    pet.behaviorState = 'resting';
                    pet.speed = 10; // Slow down after running
                    pet.behaviorTimer = 0;
                }
                break;

            case 'resting':
                // Brief rest after activity
                if (pet.behaviorTimer > Phaser.Math.Between(2000, 4000)) {
                    pet.behaviorState = 'exploring';
                    pet.speed = 15 + Math.random() * 20; // Reset normal speed
                    pet.behaviorTimer = 0;
                }
                break;
        }
    }

    updateCatBehavior(pet: any, scene: Phaser.Scene) {
        switch (pet.behaviorState) {
            case 'resting':
                // Cats spend more time resting/observing
                if (pet.behaviorTimer > Phaser.Math.Between(4000, 8000)) {
                    const behavior = Phaser.Math.RND.weightedPick(['stalking', 'prowling', 'sunbathing']);
                    
                    if (behavior === 'stalking') {
                        pet.behaviorState = 'stalking';
                        pet.speed = 8; // Slow, deliberate movement
                    } else if (behavior === 'prowling') {
                        pet.behaviorState = 'prowling';
                        pet.speed = 12 + Math.random() * 10;
                    } else {
                        pet.behaviorState = 'sunbathing';
                    }
                    pet.behaviorTimer = 0;
                }
                break;

            case 'stalking':
                // Cats move slowly and deliberately, with pauses
                if (pet.behaviorTimer > Phaser.Math.Between(2000, 5000)) {
                    this.setStalkingTarget(pet);
                    pet.behaviorTimer = 0;
                    if (Math.random() < 0.3) {
                        pet.behaviorState = 'pouncing';
                        pet.speed = 40; // Quick burst
                    }
                }
                break;

            case 'prowling':
                // Cats explore territory methodically
                if (pet.behaviorTimer > Phaser.Math.Between(3000, 6000)) {
                    if (Math.random() < 0.4) {
                        pet.behaviorState = 'resting';
                    } else {
                        this.setProwlingTarget(pet);
                    }
                    pet.behaviorTimer = 0;
                }
                break;

            case 'pouncing':
                // Quick movement burst
                if (pet.behaviorTimer > Phaser.Math.Between(800, 1500)) {
                    pet.behaviorState = 'resting';
                    pet.speed = 10; // Return to slow speed
                    pet.behaviorTimer = 0;
                }
                break;

            case 'sunbathing':
                // Cats love to find sunny spots and stay there
                if (pet.behaviorTimer > Phaser.Math.Between(6000, 12000)) {
                    pet.behaviorState = 'resting';
                    pet.behaviorTimer = 0;
                }
                break;
        }
    }

    setSniffingTarget(pet: any) {
        // Dogs sniff around current area
        const currentPos = { x: pet.sprite.x, y: pet.sprite.y };
        const nearbyPoints = this.roadPoints.filter(point => 
            this.getDistance(currentPos.x, currentPos.y, point.x, point.y) < 100
        );
        
        if (nearbyPoints.length > 0) {
            const target = nearbyPoints[Math.floor(Math.random() * nearbyPoints.length)];
            this.setPetTarget(pet, target);
        }
    }

    setPatrolTarget(pet: any) {
        // Dogs tend to follow paths and explore systematically
        const currentPos = { x: pet.sprite.x, y: pet.sprite.y };
        
        // Prefer points that continue in the same general direction
        let targetPoint;
        if (pet.lastDirection.x !== 0 || pet.lastDirection.y !== 0) {
            const forwardPoints = this.roadPoints.filter(point => {
                const dx = point.x - currentPos.x;
                const dy = point.y - currentPos.y;
                const dot = dx * pet.lastDirection.x + dy * pet.lastDirection.y;
                return dot > 0 && this.getDistance(currentPos.x, currentPos.y, point.x, point.y) > 50;
            });
            
            if (forwardPoints.length > 0) {
                targetPoint = forwardPoints[Math.floor(Math.random() * forwardPoints.length)];
            }
        }
        
        // Fallback to any distant point
        if (!targetPoint) {
            const distantPoints = this.roadPoints.filter(point =>
                this.getDistance(currentPos.x, currentPos.y, point.x, point.y) > 100
            );
            targetPoint = distantPoints[Math.floor(Math.random() * distantPoints.length)] 
                         || this.roadPoints[Math.floor(Math.random() * this.roadPoints.length)];
        }
        
        this.setPetTarget(pet, targetPoint);
    }

    setChasingTarget(pet: any) {
        // Dogs "chase" things - quick movement to distant points
        const distantPoints = this.roadPoints.filter(point =>
            this.getDistance(pet.sprite.x, pet.sprite.y, point.x, point.y) > 150
        );
        
        if (distantPoints.length > 0) {
            const target = distantPoints[Math.floor(Math.random() * distantPoints.length)];
            pet.speed = 30 + Math.random() * 20; // Faster speed for chasing
            this.setPetTarget(pet, target);
        }
    }

    setStalkingTarget(pet: any) {
        // Cats move carefully to strategic positions
        const currentPos = { x: pet.sprite.x, y: pet.sprite.y };
        const nearbyPoints = this.roadPoints.filter(point => {
            const distance = this.getDistance(currentPos.x, currentPos.y, point.x, point.y);
            return distance > 30 && distance < 120;
        });
        
        if (nearbyPoints.length > 0) {
            const target = nearbyPoints[Math.floor(Math.random() * nearbyPoints.length)];
            this.setPetTarget(pet, target);
        }
    }

    setProwlingTarget(pet: any) {
        // Cats explore their territory in a methodical way
        const currentPos = { x: pet.sprite.x, y: pet.sprite.y };
        
        // Prefer unvisited areas (simulate territory marking)
        if (!pet.visitedPoints) {
            pet.visitedPoints = new Set();
        }
        
        const unvisitedPoints = this.roadPoints.filter(point => {
            const key = `${Math.floor(point.x / 50)},${Math.floor(point.y / 50)}`;
            return !pet.visitedPoints.has(key) && 
                   this.getDistance(currentPos.x, currentPos.y, point.x, point.y) > 50;
        });
        
        let target;
        if (unvisitedPoints.length > 0) {
            target = unvisitedPoints[Math.floor(Math.random() * unvisitedPoints.length)];
        } else {
            // Clear visited points and choose any point
            pet.visitedPoints.clear();
            target = this.roadPoints[Math.floor(Math.random() * this.roadPoints.length)];
        }
        
        this.setPetTarget(pet, target);
    }

    setPetTarget(pet: any, targetPoint: any) {
        if (!targetPoint) return;
        
        const currentPos = { x: pet.sprite.x, y: pet.sprite.y };
        
        // Update direction tracking
        pet.lastDirection = {
            x: targetPoint.x - currentPos.x,
            y: targetPoint.y - currentPos.y
        };
        
        // Normalize direction
        const magnitude = Math.sqrt(pet.lastDirection.x ** 2 + pet.lastDirection.y ** 2);
        if (magnitude > 0) {
            pet.lastDirection.x /= magnitude;
            pet.lastDirection.y /= magnitude;
        }
        
        pet.targetX = targetPoint.x;
        pet.targetY = targetPoint.y;
        pet.currentRoadPoint = targetPoint;

        // Mark as visited for cats
        if (pet.data.type === 'cat' && pet.visitedPoints) {
            const key = `${Math.floor(targetPoint.x / 50)},${Math.floor(targetPoint.y / 50)}`;
            pet.visitedPoints.add(key);
        }

        // Notify other players of movement
        this.socketService.movePet(
            pet.data.id,
            gameStore.getState().currentRoom,
            { x: targetPoint.x, y: targetPoint.y }
        );
    }
    
    findNearestRoadPoint(x: number, y: number): {x: number, y: number} | null {
        if (this.roadPoints.length === 0) return null;
        
        let nearestPoint = this.roadPoints[0];
        let minDistance = this.getDistance(x, y, nearestPoint.x, nearestPoint.y);
        
        for (const point of this.roadPoints) {
            const distance = this.getDistance(x, y, point.x, point.y);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPoint = point;
            }
        }
        
        return nearestPoint;
    }
    
    getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    updateGame() {
        // Enhanced realistic pet movement
        this.pets.forEach((pet, id) => {
            const sprite = pet.sprite as any;
            const dx = pet.targetX - sprite.x;
            const dy = pet.targetY - sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 2) {
                let moveX = (dx / distance) * pet.speed * (1/60); // 60 FPS
                let moveY = (dy / distance) * pet.speed * (1/60);
                
                // Add realistic movement variations based on pet type and behavior
                this.addMovementVariations(pet, moveX, moveY, distance);
                
                // Apply the movement with variations
                sprite.x += pet.adjustedMoveX || moveX;
                sprite.y += pet.adjustedMoveY || moveY;
                
                // Add subtle rotation based on movement direction (for visual realism)
                if (pet.sprite.setRotation) {
                    const angle = Math.atan2(moveY, moveX);
                    pet.sprite.setRotation(angle);
                }
            } else {
                // Pet has reached target - handle arrival behaviors
                this.handlePetArrival(pet);
            }
        });
    }

    addMovementVariations(pet: any, baseX: number, baseY: number, distanceToTarget: number) {
        const petType = pet.data.type;
        let variationX = 0;
        let variationY = 0;
        
        // Initialize movement variation tracking
        if (!pet.movementVariation) {
            pet.movementVariation = {
                oscillation: Math.random() * Math.PI * 2,
                wigglePhase: Math.random() * Math.PI * 2,
                lastUpdate: Date.now()
            };
        }
        
        const now = Date.now();
        const dt = (now - pet.movementVariation.lastUpdate) / 1000;
        pet.movementVariation.lastUpdate = now;
        
        if (petType === 'dog') {
            // Dogs have more bouncy, enthusiastic movement
            switch (pet.behaviorState) {
                case 'exploring':
                case 'patrolling':
                    // Slight zigzag pattern - dogs don't walk perfectly straight
                    pet.movementVariation.wigglePhase += dt * 2;
                    variationX = Math.cos(pet.movementVariation.wigglePhase) * 0.3;
                    variationY = Math.sin(pet.movementVariation.wigglePhase) * 0.3;
                    break;
                    
                case 'sniffing':
                    // Slower, more erratic movement with pauses
                    if (Math.random() < 0.1) { // 10% chance to pause briefly
                        pet.adjustedMoveX = baseX * 0.2;
                        pet.adjustedMoveY = baseY * 0.2;
                        return;
                    }
                    variationX = (Math.random() - 0.5) * 0.5;
                    variationY = (Math.random() - 0.5) * 0.5;
                    break;
                    
                case 'chasing':
                    // More direct movement, but with enthusiasm (slight bouncing)
                    pet.movementVariation.oscillation += dt * 8;
                    const bounce = Math.sin(pet.movementVariation.oscillation) * 0.2;
                    variationY += bounce;
                    break;
                    
                case 'resting':
                    // Slow, tired movement
                    variationX = (Math.random() - 0.5) * 0.2;
                    variationY = (Math.random() - 0.5) * 0.2;
                    break;
            }
        } else if (petType === 'cat') {
            // Cats have more fluid, precise movement
            switch (pet.behaviorState) {
                case 'stalking':
                    // Very controlled movement with occasional freezes
                    if (Math.random() < 0.15) { // 15% chance to freeze
                        pet.adjustedMoveX = 0;
                        pet.adjustedMoveY = 0;
                        return;
                    }
                    // Extremely smooth movement
                    variationX = Math.cos(pet.movementVariation.wigglePhase) * 0.1;
                    variationY = Math.sin(pet.movementVariation.wigglePhase) * 0.1;
                    break;
                    
                case 'prowling':
                    // Smooth, flowing movement
                    pet.movementVariation.wigglePhase += dt * 1.5;
                    variationX = Math.cos(pet.movementVariation.wigglePhase) * 0.2;
                    variationY = Math.sin(pet.movementVariation.wigglePhase * 0.7) * 0.15;
                    break;
                    
                case 'pouncing':
                    // Quick, direct movement with slight overshoot tendency
                    if (distanceToTarget < 20) {
                        // Add overshoot for realistic pouncing
                        pet.adjustedMoveX = baseX * 1.2;
                        pet.adjustedMoveY = baseY * 1.2;
                        return;
                    }
                    break;
                    
                case 'resting':
                    // Minimal movement, very smooth
                    variationX = (Math.random() - 0.5) * 0.1;
                    variationY = (Math.random() - 0.5) * 0.1;
                    break;
                    
                case 'sunbathing':
                    // Almost no movement, pet is relaxed
                    pet.adjustedMoveX = baseX * 0.3;
                    pet.adjustedMoveY = baseY * 0.3;
                    return;
            }
        }
        
        // Apply the variations
        pet.adjustedMoveX = baseX + variationX;
        pet.adjustedMoveY = baseY + variationY;
        
        // Add subtle speed variations based on terrain (simulate fatigue/excitement)
        if (!pet.speedVariation) {
            pet.speedVariation = 1.0;
        }
        
        // Gradually vary speed for more natural movement
        pet.speedVariation += (Math.random() - 0.5) * 0.02;
        pet.speedVariation = Math.max(0.7, Math.min(1.3, pet.speedVariation));
        
        pet.adjustedMoveX *= pet.speedVariation;
        pet.adjustedMoveY *= pet.speedVariation;
    }

    handlePetArrival(pet: any) {
        // Handle what happens when a pet reaches its destination
        const petType = pet.data.type;
        
        if (petType === 'dog' && pet.behaviorState === 'sniffing') {
            // Dogs might sniff around the arrival spot
            if (Math.random() < 0.3) {
                // Small circular movement to simulate sniffing
                const angle = Math.random() * Math.PI * 2;
                const radius = 10;
                pet.targetX = pet.sprite.x + Math.cos(angle) * radius;
                pet.targetY = pet.sprite.y + Math.sin(angle) * radius;
            }
        } else if (petType === 'cat' && pet.behaviorState === 'stalking') {
            // Cats might pause at arrival points to observe
            if (Math.random() < 0.4) {
                // Brief pause behavior
                const scene = (this as any).scene;
                if (scene) {
                    scene.time.delayedCall(Phaser.Math.Between(500, 2000), () => {
                        // Resume movement after pause
                        if (pet.behaviorState === 'stalking') {
                            this.setStalkingTarget(pet);
                        }
                    });
                }
            }
        }
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
                // Snap incoming position to nearest road point
                const roadPosition = this.findNearestRoadPoint(pet.position.x, pet.position.y);
                if (roadPosition) {
                    existingPet.targetX = roadPosition.x;
                    existingPet.targetY = roadPosition.y;
                    existingPet.currentRoadPoint = roadPosition;
                }
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