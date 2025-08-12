import Phaser from 'phaser';
import { RoadPoint } from './ObjectDefinitions';
import { RoadPlacement } from './RoadPlacement';
import { gameStore } from '../stores/gameStore';

export interface PetData {
    sprite: Phaser.GameObjects.GameObject;
    data: any;
    targetX: number;
    targetY: number;
    speed: number;
    currentRoadPoint: RoadPoint;
    behaviorState?: string;
    behaviorTimer?: number;
    restingSpot?: RoadPoint | null;
    lastDirection?: { x: number; y: number };
    curiosityTarget?: RoadPoint | null;
    visitedPoints?: Set<string>;
    movementVariation?: {
        oscillation: number;
        wigglePhase: number;
        lastUpdate: number;
    };
    adjustedMoveX?: number;
    adjustedMoveY?: number;
    speedVariation?: number;
}

export class PetBehavior {
    private pets: Map<string, PetData> = new Map();
    private roadPlacement: RoadPlacement;
    private socketService: any;

    constructor(roadPlacement: RoadPlacement, socketService: any) {
        this.roadPlacement = roadPlacement;
        this.socketService = socketService;
    }

    createPetSprite(pet: any, scene: Phaser.Scene): void {
        if (this.pets.has(pet.id)) {
            return;
        }

        let petSprite: Phaser.GameObjects.GameObject;

        if (pet.imageData || (pet.drawingData && pet.drawingData.objects && pet.drawingData.objects.length > 0)) {
            const textureKey = `pet-${pet.id}`;
            
            if (pet.imageData) {
                scene.load.once('complete', () => {
                    petSprite = scene.add.image(pet.position.x, pet.position.y, textureKey);
                    (petSprite as Phaser.GameObjects.Image).setScale(0.1);
                    this.finalizePetCreation(pet, petSprite, scene);
                });
                
                scene.load.image(textureKey, pet.imageData);
                scene.load.start();
                return;
            }
        }

        const color = pet.type === 'dog' ? 0xffa500 : 0x9370db;
        petSprite = scene.add.rectangle(
            pet.position.x, 
            pet.position.y, 
            40, 
            30, 
            color
        );

        this.finalizePetCreation(pet, petSprite, scene);
    }

    private finalizePetCreation(pet: any, petSprite: Phaser.GameObjects.GameObject, scene: Phaser.Scene): void {
        const nearestRoadPoint = this.roadPlacement.findNearestRoadPoint(pet.position.x, pet.position.y);
        if (nearestRoadPoint) {
            (petSprite as any).x = nearestRoadPoint.x;
            (petSprite as any).y = nearestRoadPoint.y;
        }

        const petData: PetData = {
            sprite: petSprite,
            data: pet,
            targetX: nearestRoadPoint ? nearestRoadPoint.x : pet.position.x,
            targetY: nearestRoadPoint ? nearestRoadPoint.y : pet.position.y,
            speed: 15 + Math.random() * 20,
            currentRoadPoint: nearestRoadPoint || { x: pet.position.x, y: pet.position.y }
        };

        this.pets.set(pet.id, petData);
        this.startPetMovement(pet.id, scene);
    }

    private startPetMovement(petId: string, scene: Phaser.Scene): void {
        const pet = this.pets.get(petId);
        if (!pet) return;

        pet.behaviorState = pet.data.type === 'dog' ? 'exploring' : 'resting';
        pet.behaviorTimer = 0;
        pet.restingSpot = null;
        pet.lastDirection = { x: 0, y: 0 };
        pet.curiosityTarget = null;

        const updatePetBehavior = () => {
            this.updateRealisticPetMovement(petId);
            scene.time.delayedCall(100, updatePetBehavior);
        };

        scene.time.delayedCall(500, updatePetBehavior);
    }

    private updateRealisticPetMovement(petId: string): void {
        const pet = this.pets.get(petId);
        if (!pet || this.roadPlacement.getRoadPoints().length === 0) return;

        const petType = pet.data.type;
        
        pet.behaviorTimer! += 100;

        if (petType === 'dog') {
            this.updateDogBehavior(pet);
        } else if (petType === 'cat') {
            this.updateCatBehavior(pet);
        }
    }

    private updateDogBehavior(pet: PetData): void {
        switch (pet.behaviorState) {
            case 'exploring':
                if (pet.behaviorTimer! > Phaser.Math.Between(2000, 4000)) {
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
                if (pet.behaviorTimer! > Phaser.Math.Between(1000, 3000)) {
                    pet.behaviorState = 'exploring';
                    pet.behaviorTimer = 0;
                }
                break;

            case 'patrolling':
                if (pet.behaviorTimer! > Phaser.Math.Between(3000, 6000)) {
                    pet.behaviorState = 'exploring';
                    pet.behaviorTimer = 0;
                }
                break;

            case 'chasing':
                if (pet.behaviorTimer! > Phaser.Math.Between(1500, 3000)) {
                    pet.behaviorState = 'resting';
                    pet.speed = 10;
                    pet.behaviorTimer = 0;
                }
                break;

            case 'resting':
                if (pet.behaviorTimer! > Phaser.Math.Between(2000, 4000)) {
                    pet.behaviorState = 'exploring';
                    pet.speed = 15 + Math.random() * 20;
                    pet.behaviorTimer = 0;
                }
                break;
        }
    }

    private updateCatBehavior(pet: PetData): void {
        switch (pet.behaviorState) {
            case 'resting':
                if (pet.behaviorTimer! > Phaser.Math.Between(4000, 8000)) {
                    const behavior = Phaser.Math.RND.weightedPick(['stalking', 'prowling', 'sunbathing']);
                    
                    if (behavior === 'stalking') {
                        pet.behaviorState = 'stalking';
                        pet.speed = 8;
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
                if (pet.behaviorTimer! > Phaser.Math.Between(2000, 5000)) {
                    this.setStalkingTarget(pet);
                    pet.behaviorTimer = 0;
                    if (Math.random() < 0.3) {
                        pet.behaviorState = 'pouncing';
                        pet.speed = 40;
                    }
                }
                break;

            case 'prowling':
                if (pet.behaviorTimer! > Phaser.Math.Between(3000, 6000)) {
                    if (Math.random() < 0.4) {
                        pet.behaviorState = 'resting';
                    } else {
                        this.setProwlingTarget(pet);
                    }
                    pet.behaviorTimer = 0;
                }
                break;

            case 'pouncing':
                if (pet.behaviorTimer! > Phaser.Math.Between(800, 1500)) {
                    pet.behaviorState = 'resting';
                    pet.speed = 10;
                    pet.behaviorTimer = 0;
                }
                break;

            case 'sunbathing':
                if (pet.behaviorTimer! > Phaser.Math.Between(6000, 12000)) {
                    pet.behaviorState = 'resting';
                    pet.behaviorTimer = 0;
                }
                break;
        }
    }

    private setSniffingTarget(pet: PetData): void {
        const currentPos = { x: (pet.sprite as any).x, y: (pet.sprite as any).y };
        const nearbyPoints = this.roadPlacement.getRoadPoints().filter(point => 
            this.getDistance(currentPos.x, currentPos.y, point.x, point.y) < 100
        );
        
        if (nearbyPoints.length > 0) {
            const target = nearbyPoints[Math.floor(Math.random() * nearbyPoints.length)];
            this.setPetTarget(pet, target);
        }
    }

    private setPatrolTarget(pet: PetData): void {
        const currentPos = { x: (pet.sprite as any).x, y: (pet.sprite as any).y };
        
        let targetPoint;
        if (pet.lastDirection!.x !== 0 || pet.lastDirection!.y !== 0) {
            const forwardPoints = this.roadPlacement.getRoadPoints().filter(point => {
                const dx = point.x - currentPos.x;
                const dy = point.y - currentPos.y;
                const dot = dx * pet.lastDirection!.x + dy * pet.lastDirection!.y;
                return dot > 0 && this.getDistance(currentPos.x, currentPos.y, point.x, point.y) > 50;
            });
            
            if (forwardPoints.length > 0) {
                targetPoint = forwardPoints[Math.floor(Math.random() * forwardPoints.length)];
            }
        }
        
        if (!targetPoint) {
            const distantPoints = this.roadPlacement.getRoadPoints().filter(point =>
                this.getDistance(currentPos.x, currentPos.y, point.x, point.y) > 100
            );
            targetPoint = distantPoints[Math.floor(Math.random() * distantPoints.length)] 
                         || this.roadPlacement.getRoadPoints()[Math.floor(Math.random() * this.roadPlacement.getRoadPoints().length)];
        }
        
        this.setPetTarget(pet, targetPoint);
    }

    private setChasingTarget(pet: PetData): void {
        const distantPoints = this.roadPlacement.getRoadPoints().filter(point =>
            this.getDistance((pet.sprite as any).x, (pet.sprite as any).y, point.x, point.y) > 150
        );
        
        if (distantPoints.length > 0) {
            const target = distantPoints[Math.floor(Math.random() * distantPoints.length)];
            pet.speed = 30 + Math.random() * 20;
            this.setPetTarget(pet, target);
        }
    }

    private setStalkingTarget(pet: PetData): void {
        const currentPos = { x: (pet.sprite as any).x, y: (pet.sprite as any).y };
        const nearbyPoints = this.roadPlacement.getRoadPoints().filter(point => {
            const distance = this.getDistance(currentPos.x, currentPos.y, point.x, point.y);
            return distance > 30 && distance < 120;
        });
        
        if (nearbyPoints.length > 0) {
            const target = nearbyPoints[Math.floor(Math.random() * nearbyPoints.length)];
            this.setPetTarget(pet, target);
        }
    }

    private setProwlingTarget(pet: PetData): void {
        const currentPos = { x: (pet.sprite as any).x, y: (pet.sprite as any).y };
        
        if (!pet.visitedPoints) {
            pet.visitedPoints = new Set();
        }
        
        const unvisitedPoints = this.roadPlacement.getRoadPoints().filter(point => {
            const key = `${Math.floor(point.x / 50)},${Math.floor(point.y / 50)}`;
            return !pet.visitedPoints!.has(key) && 
                   this.getDistance(currentPos.x, currentPos.y, point.x, point.y) > 50;
        });
        
        let target;
        if (unvisitedPoints.length > 0) {
            target = unvisitedPoints[Math.floor(Math.random() * unvisitedPoints.length)];
        } else {
            pet.visitedPoints.clear();
            target = this.roadPlacement.getRoadPoints()[Math.floor(Math.random() * this.roadPlacement.getRoadPoints().length)];
        }
        
        this.setPetTarget(pet, target);
    }

    private setPetTarget(pet: PetData, targetPoint: RoadPoint): void {
        if (!targetPoint) return;
        
        const currentPos = { x: (pet.sprite as any).x, y: (pet.sprite as any).y };
        
        pet.lastDirection = {
            x: targetPoint.x - currentPos.x,
            y: targetPoint.y - currentPos.y
        };
        
        const magnitude = Math.sqrt(pet.lastDirection.x ** 2 + pet.lastDirection.y ** 2);
        if (magnitude > 0) {
            pet.lastDirection.x /= magnitude;
            pet.lastDirection.y /= magnitude;
        }
        
        pet.targetX = targetPoint.x;
        pet.targetY = targetPoint.y;
        pet.currentRoadPoint = targetPoint;

        if (pet.data.type === 'cat' && pet.visitedPoints) {
            const key = `${Math.floor(targetPoint.x / 50)},${Math.floor(targetPoint.y / 50)}`;
            pet.visitedPoints.add(key);
        }

        this.socketService.movePet(
            pet.data.id,
            gameStore.getState().currentRoom,
            { x: targetPoint.x, y: targetPoint.y }
        );
    }

    updateGame(): void {
        this.pets.forEach((pet, id) => {
            const sprite = pet.sprite as any;
            const dx = pet.targetX - sprite.x;
            const dy = pet.targetY - sprite.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 2) {
                let moveX = (dx / distance) * pet.speed * (1/60);
                let moveY = (dy / distance) * pet.speed * (1/60);
                
                this.addMovementVariations(pet, moveX, moveY, distance);
                
                sprite.x += pet.adjustedMoveX || moveX;
                sprite.y += pet.adjustedMoveY || moveY;
                
                if (sprite.setRotation) {
                    const angle = Math.atan2(moveY, moveX);
                    sprite.setRotation(angle);
                }
            } else {
                this.handlePetArrival(pet);
            }
        });
    }

    private addMovementVariations(pet: PetData, baseX: number, baseY: number, distanceToTarget: number): void {
        const petType = pet.data.type;
        let variationX = 0;
        let variationY = 0;
        
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
            switch (pet.behaviorState) {
                case 'exploring':
                case 'patrolling':
                    pet.movementVariation.wigglePhase += dt * 2;
                    variationX = Math.cos(pet.movementVariation.wigglePhase) * 0.3;
                    variationY = Math.sin(pet.movementVariation.wigglePhase) * 0.3;
                    break;
                    
                case 'sniffing':
                    if (Math.random() < 0.1) {
                        pet.adjustedMoveX = baseX * 0.2;
                        pet.adjustedMoveY = baseY * 0.2;
                        return;
                    }
                    variationX = (Math.random() - 0.5) * 0.5;
                    variationY = (Math.random() - 0.5) * 0.5;
                    break;
                    
                case 'chasing':
                    pet.movementVariation.oscillation += dt * 8;
                    const bounce = Math.sin(pet.movementVariation.oscillation) * 0.2;
                    variationY += bounce;
                    break;
                    
                case 'resting':
                    variationX = (Math.random() - 0.5) * 0.2;
                    variationY = (Math.random() - 0.5) * 0.2;
                    break;
            }
        } else if (petType === 'cat') {
            switch (pet.behaviorState) {
                case 'stalking':
                    if (Math.random() < 0.15) {
                        pet.adjustedMoveX = 0;
                        pet.adjustedMoveY = 0;
                        return;
                    }
                    variationX = Math.cos(pet.movementVariation.wigglePhase) * 0.1;
                    variationY = Math.sin(pet.movementVariation.wigglePhase) * 0.1;
                    break;
                    
                case 'prowling':
                    pet.movementVariation.wigglePhase += dt * 1.5;
                    variationX = Math.cos(pet.movementVariation.wigglePhase) * 0.2;
                    variationY = Math.sin(pet.movementVariation.wigglePhase * 0.7) * 0.15;
                    break;
                    
                case 'pouncing':
                    if (distanceToTarget < 20) {
                        pet.adjustedMoveX = baseX * 1.2;
                        pet.adjustedMoveY = baseY * 1.2;
                        return;
                    }
                    break;
                    
                case 'resting':
                    variationX = (Math.random() - 0.5) * 0.1;
                    variationY = (Math.random() - 0.5) * 0.1;
                    break;
                    
                case 'sunbathing':
                    pet.adjustedMoveX = baseX * 0.3;
                    pet.adjustedMoveY = baseY * 0.3;
                    return;
            }
        }
        
        pet.adjustedMoveX = baseX + variationX;
        pet.adjustedMoveY = baseY + variationY;
        
        if (!pet.speedVariation) {
            pet.speedVariation = 1.0;
        }
        
        pet.speedVariation += (Math.random() - 0.5) * 0.02;
        pet.speedVariation = Math.max(0.7, Math.min(1.3, pet.speedVariation));
        
        pet.adjustedMoveX *= pet.speedVariation;
        pet.adjustedMoveY *= pet.speedVariation;
    }

    private handlePetArrival(pet: PetData): void {
        const petType = pet.data.type;
        
        if (petType === 'dog' && pet.behaviorState === 'sniffing') {
            if (Math.random() < 0.3) {
                const angle = Math.random() * Math.PI * 2;
                const radius = 10;
                pet.targetX = (pet.sprite as any).x + Math.cos(angle) * radius;
                pet.targetY = (pet.sprite as any).y + Math.sin(angle) * radius;
            }
        } else if (petType === 'cat' && pet.behaviorState === 'stalking') {
            if (Math.random() < 0.4) {
                // Brief pause behavior would require scene reference
                // This is simplified for the refactored version
            }
        }
    }

    handleStoreUpdate(state: any): void {
        const onlineUserIds = new Set(
            state.players
                .filter((player: any) => player.isActive)
                .map((player: any) => player.userId)
        );

        state.pets.forEach((pet: any) => {
            const existingPet = this.pets.get(pet.id);
            if (existingPet && 
                existingPet.data.userId !== gameStore.getState().user?.id &&
                onlineUserIds.has(pet.userId)) {
                const roadPosition = this.roadPlacement.findNearestRoadPoint(pet.position.x, pet.position.y);
                if (roadPosition) {
                    existingPet.targetX = roadPosition.x;
                    existingPet.targetY = roadPosition.y;
                    existingPet.currentRoadPoint = roadPosition;
                }
            }
        });

        this.pets.forEach((petData, petId) => {
            if (!onlineUserIds.has(petData.data.userId)) {
                petData.sprite.destroy();
                this.pets.delete(petId);
            }
        });
    }

    addNewPetsFromStore(state: any, scene: Phaser.Scene): void {
        const onlineUserIds = new Set(
            state.players
                .filter((player: any) => player.isActive)
                .map((player: any) => player.userId)
        );

        state.pets.forEach((pet: any) => {
            if (!this.pets.has(pet.id) && onlineUserIds.has(pet.userId)) {
                this.createPetSprite(pet, scene);
            }
        });
    }

    private getDistance(x1: number, y1: number, x2: number, y2: number): number {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    destroy(): void {
        this.pets.forEach((petData) => {
            petData.sprite.destroy();
        });
        this.pets.clear();
    }

    getPets(): Map<string, PetData> {
        return this.pets;
    }
}