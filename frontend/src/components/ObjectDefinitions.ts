export interface RoadSegment {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
}

export interface RoadPoint {
    x: number;
    y: number;
}

export interface Building {
    x: number;
    y: number;
    w: number;
    h: number;
    color?: number;
}

export interface Wall {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    height: number;
}

export interface FlowerBed {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface CloudData {
    x: number;
    y: number;
}

export interface ParkArea {
    x: number;
    y: number;
    w: number;
    h: number;
}

export interface TreePosition {
    x: number;
    y: number;
}

export interface PalmPosition {
    x: number;
    y: number;
}

export interface ChairPosition {
    x: number;
    y: number;
}

export class ObjectDefinitions {
    static getHighBuildings(width: number, height: number): Building[] {
        return [
            { x: width * 0.05, y: height * 0.1, w: 60, h: height * 0.25 },
            { x: width * 0.12, y: height * 0.05, w: 45, h: height * 0.3 },
            { x: width * 0.9, y: height * 0.08, w: 55, h: height * 0.27 },
            { x: width * 0.85, y: height * 0.12, w: 40, h: height * 0.23 }
        ];
    }

    static getLowBuildings(width: number, height: number): Building[] {
        return [
            { x: width * 0.25, y: height * 0.2, w: 80, h: 60, color: 0xDEB887 },
            { x: width * 0.35, y: height * 0.18, w: 70, h: 70, color: 0xF4A460 },
            { x: width * 0.65, y: height * 0.22, w: 90, h: 55, color: 0xD2691E },
            { x: width * 0.82, y: height * 0.25, w: 75, h: 65, color: 0xCD853F },
            { x: width * 0.02, y: height * 0.4, w: 85, h: 50, color: 0xBC8F8F }
        ];
    }

    static getSwimmingPoolConfig(width: number, height: number) {
        return {
            x: width * 0.6,
            y: height * 0.4,
            w: 120,
            h: 80
        };
    }

    static getPoolChairPositions(poolX: number, poolY: number, poolW: number, poolH: number): ChairPosition[] {
        return [
            { x: poolX - 30, y: poolY + 20 },
            { x: poolX - 30, y: poolY + 50 },
            { x: poolX + poolW + 20, y: poolY + 15 }
        ];
    }

    static getLargeTreePositions(width: number, height: number): TreePosition[] {
        return [
            { x: width * 0.15, y: height * 0.35 },
            { x: width * 0.4, y: height * 0.6 },
            { x: width * 0.75, y: height * 0.65 },
            { x: width * 0.05, y: height * 0.75 },
            { x: width * 0.9, y: height * 0.45 }
        ];
    }

    static getPalmTreePositions(width: number, height: number): PalmPosition[] {
        return [
            { x: width * 0.55, y: height * 0.35 },
            { x: width * 0.75, y: height * 0.52 }
        ];
    }

    static getWalls(width: number, height: number): Wall[] {
        return [
            { x1: width * 0.3, y1: height * 0.15, x2: width * 0.45, y2: height * 0.15, height: 25 },
            { x1: width * 0.7, y1: height * 0.75, x2: width * 0.85, y2: height * 0.75, height: 20 },
            { x1: width * 0.1, y1: height * 0.6, x2: width * 0.1, y2: height * 0.8, height: 30 }
        ];
    }

    static getGardenFenceConfig(width: number, height: number) {
        return {
            x: width * 0.08,
            y: width * 0.12,
            w: width * 0.3,
            h: height * 0.25
        };
    }

    static getFlowerBeds(width: number, height: number): FlowerBed[] {
        return [
            { x: width * 0.2, y: height * 0.32, w: 60, h: 20 },
            { x: width * 0.8, y: height * 0.6, w: 80, h: 25 },
            { x: width * 0.45, y: height * 0.85, w: 70, h: 15 }
        ];
    }

    static getParkAreas(width: number, height: number): ParkArea[] {
        return [
            { x: width * 0.1, y: height * 0.15, w: width * 0.25, h: height * 0.2 },
            { x: width * 0.6, y: height * 0.8, w: width * 0.3, h: height * 0.15 }
        ];
    }

    static getCloudPositions(width: number, height: number): CloudData[] {
        return [
            { x: width * 0.15, y: height * 0.08 },
            { x: width * 0.45, y: height * 0.12 },
            { x: width * 0.75, y: height * 0.06 },
            { x: width * 0.85, y: height * 0.15 }
        ];
    }

    static getGrassVariations() {
        return [
            { color: 0x32CD32, alpha: 0.3 },
            { color: 0x90EE90, alpha: 0.2 },
            { color: 0x006400, alpha: 0.4 }
        ];
    }

    static getFlowerColors(): number[] {
        return [0xFF69B4, 0xFF1493, 0xFFB6C1, 0xFF6347, 0xFFA500, 0xFFD700, 0x9370DB];
    }

    static getTreeCanopyLayers() {
        return [
            { offset: { x: 0, y: -35 }, radius: 40, color: 0x228B22 },
            { offset: { x: -15, y: -45 }, radius: 30, color: 0x32CD32 },
            { offset: { x: 15, y: -40 }, radius: 35, color: 0x228B22 },
            { offset: { x: 0, y: -55 }, radius: 25, color: 0x90EE90 }
        ];
    }

    static getBushParts() {
        return [
            { x: 0, y: 0, radius: 15 },
            { x: 8, y: -5, radius: 12 },
            { x: -8, y: -3, radius: 13 }
        ];
    }

    static getCloudParts() {
        return [
            { x: 0, y: 0, radius: 25 },
            { x: 20, y: -5, radius: 30 },
            { x: 40, y: 0, radius: 25 },
            { x: 15, y: -15, radius: 20 },
            { x: 25, y: -20, radius: 18 }
        ];
    }
}