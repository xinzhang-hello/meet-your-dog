import Phaser from 'phaser';
import { ObjectDefinitions, Building, Wall, FlowerBed, TreePosition, PalmPosition, ChairPosition, CloudData } from './ObjectDefinitions';
import { RoadPlacement } from './RoadPlacement';

export class EnvironmentRenderer {
    private roadPlacement: RoadPlacement;

    constructor(roadPlacement: RoadPlacement) {
        this.roadPlacement = roadPlacement;
    }

    createEnvironment(scene: Phaser.Scene, width: number, height: number): void {
        this.createSkyBackground(scene, width, height);
        this.createTerrain(scene, width, height);
        this.createBuildings(scene, width, height);
        this.createSwimmingPool(scene, width, height);
        this.createVegetation(scene, width, height);
        this.createWalls(scene, width, height);
        this.createFlowers(scene, width, height);
        
        // Generate and render roads
        this.roadPlacement.generateRoadNetwork(width, height);
        this.roadPlacement.renderRoads(scene, width, height);
        this.roadPlacement.createSidewalks(scene, width, height);
        this.roadPlacement.addParkWalkableAreas(width, height);
    }

    private createSkyBackground(scene: Phaser.Scene, width: number, height: number): void {
        const skyGraphics = scene.add.graphics();
        
        for (let i = 0; i < height * 0.4; i++) {
            const alpha = i / (height * 0.4);
            const startColor = new Phaser.Display.Color(135, 206, 235);
            const endColor = new Phaser.Display.Color(70, 130, 180);
            const color = Phaser.Display.Color.Interpolate.ColorWithColor(
                startColor,
                endColor,
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
        
        this.createClouds(scene, width, height);
    }

    private createClouds(scene: Phaser.Scene, width: number, height: number): void {
        const cloudPositions = ObjectDefinitions.getCloudPositions(width, height);
        const cloudParts = ObjectDefinitions.getCloudParts();

        cloudPositions.forEach(pos => {
            const cloudGroup = scene.add.group();
            
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

    private createTerrain(scene: Phaser.Scene, width: number, height: number): void {
        const terrainGraphics = scene.add.graphics();
        
        terrainGraphics.fillStyle(0x228B22, 1);
        terrainGraphics.fillRect(0, height * 0.3, width, height * 0.7);
        
        const grassVariations = ObjectDefinitions.getGrassVariations();
        
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
        this.createParkAreas(scene, width, height);
    }

    private createParkAreas(scene: Phaser.Scene, width: number, height: number): void {
        const parkAreas = ObjectDefinitions.getParkAreas(width, height);

        parkAreas.forEach(park => {
            const parkGraphics = scene.add.graphics();
            parkGraphics.fillStyle(0x90EE90, 1);
            parkGraphics.fillRoundedRect(park.x, park.y, park.w, park.h, 15);
            parkGraphics.setDepth(-3);
        });
    }

    private createBuildings(scene: Phaser.Scene, width: number, height: number): void {
        this.createHighBuildings(scene, width, height);
        this.createLowBuildings(scene, width, height);
    }

    private createHighBuildings(scene: Phaser.Scene, width: number, height: number): void {
        const highBuildings = ObjectDefinitions.getHighBuildings(width, height);

        highBuildings.forEach((building, index) => {
            const buildingGraphics = scene.add.graphics();
            buildingGraphics.fillStyle(0x708090, 1);
            buildingGraphics.fillRect(building.x, building.y, building.w, building.h);
            
            buildingGraphics.lineStyle(2, 0x2F4F4F, 1);
            buildingGraphics.strokeRect(building.x, building.y, building.w, building.h);
            
            buildingGraphics.fillStyle(0x87CEEB, 0.8);
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

    private createLowBuildings(scene: Phaser.Scene, width: number, height: number): void {
        const lowBuildings = ObjectDefinitions.getLowBuildings(width, height);

        lowBuildings.forEach(building => {
            const buildingGraphics = scene.add.graphics();
            
            buildingGraphics.fillStyle(building.color!, 1);
            buildingGraphics.fillRect(building.x, building.y, building.w, building.h);
            
            buildingGraphics.fillStyle(0x8B4513, 1);
            buildingGraphics.beginPath();
            buildingGraphics.moveTo(building.x - 5, building.y);
            buildingGraphics.lineTo(building.x + building.w / 2, building.y - 20);
            buildingGraphics.lineTo(building.x + building.w + 5, building.y);
            buildingGraphics.closePath();
            buildingGraphics.fillPath();
            
            buildingGraphics.fillStyle(0x8B4513, 1);
            buildingGraphics.fillRect(
                building.x + building.w / 2 - 10, 
                building.y + building.h - 25, 
                20, 
                25
            );
            
            buildingGraphics.fillStyle(0x87CEEB, 0.8);
            buildingGraphics.fillRect(building.x + 15, building.y + 15, 15, 15);
            buildingGraphics.fillRect(building.x + building.w - 30, building.y + 15, 15, 15);
            
            buildingGraphics.setDepth(2);
        });
    }

    private createSwimmingPool(scene: Phaser.Scene, width: number, height: number): void {
        const poolConfig = ObjectDefinitions.getSwimmingPoolConfig(width, height);
        const { x: poolX, y: poolY, w: poolW, h: poolH } = poolConfig;
        
        const deckGraphics = scene.add.graphics();
        deckGraphics.fillStyle(0xD3D3D3, 1);
        deckGraphics.fillRoundedRect(poolX - 15, poolY - 15, poolW + 30, poolH + 30, 10);
        deckGraphics.setDepth(1);
        
        const poolGraphics = scene.add.graphics();
        poolGraphics.fillStyle(0x0080FF, 0.8);
        poolGraphics.fillRoundedRect(poolX, poolY, poolW, poolH, 8);
        
        poolGraphics.lineStyle(4, 0x4169E1, 1);
        poolGraphics.strokeRoundedRect(poolX, poolY, poolW, poolH, 8);
        
        poolGraphics.fillStyle(0x87CEEB, 0.3);
        for (let i = 0; i < 10; i++) {
            const shimmerX = poolX + Math.random() * poolW;
            const shimmerY = poolY + Math.random() * poolH;
            poolGraphics.fillCircle(shimmerX, shimmerY, 3 + Math.random() * 5);
        }
        
        poolGraphics.setDepth(3);
        
        this.createPoolLadders(scene, poolX, poolY, poolW, poolH);
        this.createPoolChairs(scene, poolX, poolY, poolW, poolH);
    }

    private createPoolLadders(scene: Phaser.Scene, poolX: number, poolY: number, poolW: number, poolH: number): void {
        const ladderGraphics = scene.add.graphics();
        ladderGraphics.lineStyle(3, 0xC0C0C0, 1);
        ladderGraphics.beginPath();
        ladderGraphics.moveTo(poolX + poolW - 5, poolY);
        ladderGraphics.lineTo(poolX + poolW - 5, poolY + 25);
        ladderGraphics.moveTo(poolX + poolW - 15, poolY);
        ladderGraphics.lineTo(poolX + poolW - 15, poolY + 25);
        
        for (let i = 0; i < 3; i++) {
            const rungY = poolY + 5 + i * 7;
            ladderGraphics.moveTo(poolX + poolW - 15, rungY);
            ladderGraphics.lineTo(poolX + poolW - 5, rungY);
        }
        ladderGraphics.strokePath();
        ladderGraphics.setDepth(4);
    }

    private createPoolChairs(scene: Phaser.Scene, poolX: number, poolY: number, poolW: number, poolH: number): void {
        const chairPositions = ObjectDefinitions.getPoolChairPositions(poolX, poolY, poolW, poolH);
        
        chairPositions.forEach(pos => {
            const chairGraphics = scene.add.graphics();
            
            chairGraphics.fillStyle(0xFFFFFF, 1);
            chairGraphics.fillRect(pos.x, pos.y, 25, 15);
            chairGraphics.fillRect(pos.x, pos.y - 10, 25, 12);
            
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

    private createVegetation(scene: Phaser.Scene, width: number, height: number): void {
        this.createLargeTrees(scene, width, height);
        this.createSmallVegetation(scene, width, height);
        this.createPalmTrees(scene, width, height);
    }

    private createLargeTrees(scene: Phaser.Scene, width: number, height: number): void {
        const treePositions = ObjectDefinitions.getLargeTreePositions(width, height);
        const canopyLayers = ObjectDefinitions.getTreeCanopyLayers();

        treePositions.forEach(pos => {
            const trunkGraphics = scene.add.graphics();
            trunkGraphics.fillStyle(0x8B4513, 1);
            trunkGraphics.fillRect(pos.x - 8, pos.y - 20, 16, 40);
            trunkGraphics.setDepth(8);
            
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

    private createSmallVegetation(scene: Phaser.Scene, width: number, height: number): void {
        const bushParts = ObjectDefinitions.getBushParts();

        for (let i = 0; i < 15; i++) {
            const x = Math.random() * width;
            const y = height * 0.4 + Math.random() * height * 0.5;
            
            const tooCloseToRoad = this.roadPlacement.getRoadNetwork().some(road => {
                const distToRoad = this.roadPlacement.distanceToLine(x, y, road.x1, road.y1, road.x2, road.y2);
                return distToRoad < road.width / 2 + 20;
            });
            
            if (!tooCloseToRoad) {
                const bushGraphics = scene.add.graphics();
                bushGraphics.fillStyle(0x228B22, 0.7);
                
                bushParts.forEach(part => {
                    bushGraphics.fillCircle(x + part.x, y + part.y, part.radius);
                });
                
                bushGraphics.setDepth(6);
            }
        }
    }

    private createPalmTrees(scene: Phaser.Scene, width: number, height: number): void {
        const palmPositions = ObjectDefinitions.getPalmTreePositions(width, height);

        palmPositions.forEach(pos => {
            const trunkGraphics = scene.add.graphics();
            trunkGraphics.lineStyle(15, 0xDEB887, 1);
            trunkGraphics.beginPath();
            trunkGraphics.moveTo(pos.x, pos.y);
            
            const segments = 10;
            for (let i = 1; i <= segments; i++) {
                const t = i / segments;
                const x = (1-t)*(1-t)*pos.x + 2*(1-t)*t*(pos.x + 10) + t*t*(pos.x + 5);
                const y = (1-t)*(1-t)*pos.y + 2*(1-t)*t*(pos.y - 30) + t*t*(pos.y - 60);
                trunkGraphics.lineTo(x, y);
            }
            trunkGraphics.strokePath();
            trunkGraphics.setDepth(8);
            
            this.createPalmFronds(scene, pos.x + 5, pos.y - 60);
        });
    }

    private createPalmFronds(scene: Phaser.Scene, startX: number, startY: number): void {
        const frondAngles = [0, 45, 90, 135, 180, 225, 270, 315];
        
        frondAngles.forEach(angle => {
            const frondGraphics = scene.add.graphics();
            frondGraphics.fillStyle(0x228B22, 0.8);
            
            const angleRad = (angle * Math.PI) / 180;
            const frondLength = 35;
            const frondWidth = 8;
            
            const endX = startX + Math.cos(angleRad) * frondLength;
            const endY = startY + Math.sin(angleRad) * frondLength;
            
            const perpX = Math.cos(angleRad + Math.PI/2) * frondWidth/2;
            const perpY = Math.sin(angleRad + Math.PI/2) * frondWidth/2;
            
            frondGraphics.beginPath();
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
    }

    private createWalls(scene: Phaser.Scene, width: number, height: number): void {
        const walls = ObjectDefinitions.getWalls(width, height);

        walls.forEach(wall => {
            const wallGraphics = scene.add.graphics();
            wallGraphics.fillStyle(0x696969, 1);
            
            const wallLength = Math.sqrt((wall.x2 - wall.x1) ** 2 + (wall.y2 - wall.y1) ** 2);
            const angle = Math.atan2(wall.y2 - wall.y1, wall.x2 - wall.x1);
            
            const perpX = Math.cos(angle + Math.PI/2) * wall.height/2;
            const perpY = Math.sin(angle + Math.PI/2) * wall.height/2;
            
            const cosAngle = Math.cos(angle);
            const sinAngle = Math.sin(angle);
            
            wallGraphics.beginPath();
            wallGraphics.moveTo(wall.x1 + perpX, wall.y1 + perpY);
            wallGraphics.lineTo(wall.x1 + cosAngle * wallLength + perpX, wall.y1 + sinAngle * wallLength + perpY);
            wallGraphics.lineTo(wall.x1 + cosAngle * wallLength - perpX, wall.y1 + sinAngle * wallLength - perpY);
            wallGraphics.lineTo(wall.x1 - perpX, wall.y1 - perpY);
            wallGraphics.closePath();
            wallGraphics.fillPath();
            
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
        
        this.createGardenFence(scene, width, height);
    }

    private createGardenFence(scene: Phaser.Scene, width: number, height: number): void {
        const fenceConfig = ObjectDefinitions.getGardenFenceConfig(width, height);
        const { x: fenceX, y: fenceY, w: fenceW, h: fenceH } = fenceConfig;
        
        const fenceGraphics = scene.add.graphics();
        fenceGraphics.lineStyle(3, 0x8B4513, 1);
        
        const postSpacing = 25;
        const numPosts = Math.floor(fenceW / postSpacing) + 1;
        
        for (let i = 0; i <= numPosts; i++) {
            const postX = fenceX + i * postSpacing;
            fenceGraphics.beginPath();
            fenceGraphics.moveTo(postX, fenceY);
            fenceGraphics.lineTo(postX, fenceY + 30);
            fenceGraphics.strokePath();
        }
        
        fenceGraphics.lineStyle(2, 0x8B4513, 1);
        fenceGraphics.beginPath();
        fenceGraphics.moveTo(fenceX, fenceY + 10);
        fenceGraphics.lineTo(fenceX + fenceW, fenceY + 10);
        fenceGraphics.moveTo(fenceX, fenceY + 20);
        fenceGraphics.lineTo(fenceX + fenceW, fenceY + 20);
        fenceGraphics.strokePath();
        
        fenceGraphics.setDepth(6);
    }

    private createFlowers(scene: Phaser.Scene, width: number, height: number): void {
        this.createFlowerBeds(scene, width, height);
        this.createScatteredFlowers(scene, width, height);
    }

    private createFlowerBeds(scene: Phaser.Scene, width: number, height: number): void {
        const flowerBeds = ObjectDefinitions.getFlowerBeds(width, height);

        flowerBeds.forEach(bed => {
            const bedGraphics = scene.add.graphics();
            bedGraphics.fillStyle(0x8B4513, 0.8);
            bedGraphics.fillRoundedRect(bed.x, bed.y, bed.w, bed.h, 8);
            bedGraphics.setDepth(4);
            
            const numFlowers = Math.floor((bed.w * bed.h) / 100);
            for (let i = 0; i < numFlowers; i++) {
                const flowerX = bed.x + 5 + Math.random() * (bed.w - 10);
                const flowerY = bed.y + 5 + Math.random() * (bed.h - 10);
                
                this.createSingleFlower(scene, flowerX, flowerY, 5);
            }
        });
    }

    private createScatteredFlowers(scene: Phaser.Scene, width: number, height: number): void {
        for (let i = 0; i < 25; i++) {
            const x = Math.random() * width;
            const y = height * 0.4 + Math.random() * height * 0.5;
            
            const tooCloseToRoad = this.roadPlacement.getRoadNetwork().some(road => {
                const distToRoad = this.roadPlacement.distanceToLine(x, y, road.x1, road.y1, road.x2, road.y2);
                return distToRoad < road.width / 2 + 15;
            });
            
            if (!tooCloseToRoad) {
                this.createSingleFlower(scene, x, y, 3 + Math.random() * 4);
            }
        }
    }

    private createSingleFlower(scene: Phaser.Scene, x: number, y: number, size: number): void {
        const flowerGraphics = scene.add.graphics();
        
        const colors = ObjectDefinitions.getFlowerColors();
        const flowerColor = colors[Math.floor(Math.random() * colors.length)];
        
        flowerGraphics.lineStyle(2, 0x228B22, 1);
        flowerGraphics.beginPath();
        flowerGraphics.moveTo(x, y);
        flowerGraphics.lineTo(x, y + size + 5);
        flowerGraphics.strokePath();
        
        const numPetals = 5 + Math.floor(Math.random() * 2);
        flowerGraphics.fillStyle(flowerColor, 0.8);
        
        for (let i = 0; i < numPetals; i++) {
            const angle = (i / numPetals) * Math.PI * 2;
            const petalX = x + Math.cos(angle) * size;
            const petalY = y + Math.sin(angle) * size;
            flowerGraphics.fillCircle(petalX, petalY, size * 0.6);
        }
        
        flowerGraphics.fillStyle(0xFFD700, 1);
        flowerGraphics.fillCircle(x, y, size * 0.4);
        
        flowerGraphics.setDepth(5);
    }
}