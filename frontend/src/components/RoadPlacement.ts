import Phaser from 'phaser';
import { RoadSegment, RoadPoint } from './ObjectDefinitions';

export class RoadPlacement {
    private roadNetwork: RoadSegment[] = [];
    private roadPoints: RoadPoint[] = [];

    generateRoadNetwork(width: number, height: number): RoadSegment[] {
        this.roadNetwork = [
            // Main horizontal arterial roads (avoiding major objects)
            { x1: 0, y1: height * 0.38, x2: width, y2: height * 0.38, width: 35 },
            { x1: 0, y1: height * 0.55, x2: width, y2: height * 0.55, width: 32 },
            { x1: 0, y1: height * 0.78, x2: width, y2: height * 0.78, width: 28 },
            
            // Main vertical roads
            { x1: width * 0.18, y1: 0, x2: width * 0.18, y2: height, width: 30 },
            { x1: width * 0.48, y1: 0, x2: width * 0.48, y2: height, width: 32 },
            { x1: width * 0.78, y1: 0, x2: width * 0.78, y2: height, width: 28 },
            
            // Curved road around northern park area
            { x1: width * 0.38, y1: height * 0.12, x2: width * 0.45, y2: height * 0.18, width: 24 },
            { x1: width * 0.45, y1: height * 0.18, x2: width * 0.52, y2: height * 0.15, width: 24 },
            { x1: width * 0.52, y1: height * 0.15, x2: width * 0.6, y2: height * 0.12, width: 24 },
            
            // Winding residential road around western buildings
            { x1: width * 0.08, y1: height * 0.3, x2: width * 0.12, y2: height * 0.35, width: 22 },
            { x1: width * 0.12, y1: height * 0.35, x2: width * 0.2, y2: height * 0.4, width: 22 },
            { x1: width * 0.2, y1: height * 0.4, x2: width * 0.28, y2: height * 0.45, width: 22 },
            
            // Road curving around swimming pool
            { x1: width * 0.52, y1: height * 0.32, x2: width * 0.58, y2: height * 0.35, width: 20 },
            { x1: width * 0.72, y1: height * 0.35, x2: width * 0.78, y2: height * 0.32, width: 20 },
            { x1: width * 0.58, y1: height * 0.48, x2: width * 0.65, y2: height * 0.52, width: 20 },
            { x1: width * 0.65, y1: height * 0.52, x2: width * 0.72, y2: height * 0.48, width: 20 },
            
            // Eastern residential streets
            { x1: width * 0.68, y1: height * 0.15, x2: width * 0.75, y2: height * 0.2, width: 20 },
            { x1: width * 0.75, y1: height * 0.2, x2: width * 0.8, y2: height * 0.3, width: 20 },
            { x1: width * 0.8, y1: height * 0.3, x2: width * 0.85, y2: height * 0.35, width: 20 },
            
            // Southern winding roads
            { x1: width * 0.1, y1: height * 0.7, x2: width * 0.2, y2: height * 0.72, width: 22 },
            { x1: width * 0.25, y1: height * 0.68, x2: width * 0.35, y2: height * 0.7, width: 22 },
            { x1: width * 0.45, y1: height * 0.68, x2: width * 0.55, y2: height * 0.72, width: 22 },
            
            // Curved access roads to buildings
            { x1: width * 0.22, y1: height * 0.28, x2: width * 0.28, y2: height * 0.32, width: 18 },
            { x1: width * 0.32, y1: height * 0.25, x2: width * 0.38, y2: height * 0.28, width: 18 },
            
            // Small connecting streets
            { x1: width * 0.42, y1: height * 0.3, x2: width * 0.48, y2: height * 0.35, width: 16 },
            { x1: width * 0.6, y1: height * 0.6, x2: width * 0.68, y2: height * 0.65, width: 16 },
            { x1: width * 0.15, y1: height * 0.5, x2: width * 0.22, y2: height * 0.55, width: 16 }
        ];

        return this.roadNetwork;
    }

    renderRoads(scene: Phaser.Scene, width: number, height: number): void {
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
            
            // Add yellow center line
            this.addCenterLine(scene, road);
            
            // Generate walkable points along the road
            this.generateWalkablePoints(road, width, height);
        });
        
        // Add intersection points
        this.addIntersectionPoints(width, height);
    }

    private addCenterLine(scene: Phaser.Scene, road: RoadSegment): void {
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
    }

    private generateWalkablePoints(road: RoadSegment, width: number, height: number): void {
        const roadLength = Math.sqrt(
            Math.pow(road.x2 - road.x1, 2) + Math.pow(road.y2 - road.y1, 2)
        );
        const steps = Math.floor(roadLength / 30);
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = road.x1 + (road.x2 - road.x1) * t;
            const y = road.y1 + (road.y2 - road.y1) * t;
            
            const offsetRange = road.width * 0.3;
            const offsetX = (Math.random() - 0.5) * offsetRange;
            const offsetY = (Math.random() - 0.5) * offsetRange;
            
            this.roadPoints.push({ 
                x: Math.max(0, Math.min(width, x + offsetX)), 
                y: Math.max(0, Math.min(height, y + offsetY))
            });
        }
    }

    private addIntersectionPoints(width: number, height: number): void {
        const horizontalRoads = this.roadNetwork.filter(road => 
            Math.abs(road.y1 - road.y2) < Math.abs(road.x1 - road.x2)
        );
        const verticalRoads = this.roadNetwork.filter(road => 
            Math.abs(road.x1 - road.x2) < Math.abs(road.y1 - road.y2)
        );
        
        horizontalRoads.forEach(hRoad => {
            verticalRoads.forEach(vRoad => {
                const intersectionX = vRoad.x1;
                const intersectionY = hRoad.y1;
                
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

    createSidewalks(scene: Phaser.Scene, width: number, height: number): void {
        this.roadNetwork.forEach(road => {
            const sidewalkWidth = 15;
            const sidewalkColor = 0xC0C0C0;
            
            const roadLength = Math.sqrt(
                Math.pow(road.x2 - road.x1, 2) + Math.pow(road.y2 - road.y1, 2)
            );
            const perpX = -(road.y2 - road.y1) / roadLength * (road.width / 2 + sidewalkWidth / 2);
            const perpY = (road.x2 - road.x1) / roadLength * (road.width / 2 + sidewalkWidth / 2);
            
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

    addParkWalkableAreas(width: number, height: number): void {
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

    findNearestRoadPoint(x: number, y: number): RoadPoint | null {
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

    private getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    getRoadNetwork(): RoadSegment[] {
        return this.roadNetwork;
    }

    getRoadPoints(): RoadPoint[] {
        return this.roadPoints;
    }
}