import express, { Request, Response } from 'express';
import Joi from 'joi';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';

const router = express.Router();

const createPetSchema = Joi.object({
  roomId: Joi.string().required(),
  drawingData: Joi.object().required(),
  type: Joi.string().valid('dog', 'cat').required(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required()
  }).default({ x: 100, y: 100 })
});

// Create pet
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = createPetSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check if user is in the room
    const roomMember = await prisma.roomMember.findFirst({
      where: {
        roomId: req.body.roomId,
        userId: req.user!.id,
        isActive: true
      }
    });

    if (!roomMember) {
      return res.status(403).json({ error: 'You are not in this room' });
    }

    const pet = await prisma.pet.create({
      data: {
        userId: req.user!.id,
        roomId: req.body.roomId,
        drawingData: req.body.drawingData,
        type: req.body.type,
        position: req.body.position
      },
      include: {
        user: { select: { id: true, username: true } }
      }
    });

    res.json(pet);
  } catch (error) {
    console.error('Create pet error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update pet position
router.patch('/:id/position', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const positionSchema = Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required()
    });

    const { error } = positionSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const pet = await prisma.pet.findUnique({
      where: { id: req.params.id }
    });

    if (!pet) {
      return res.status(404).json({ error: 'Pet not found' });
    }

    if (pet.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Not your pet' });
    }

    const updatedPet = await prisma.pet.update({
      where: { id: req.params.id },
      data: { position: req.body }
    });

    res.json(updatedPet);
  } catch (error) {
    console.error('Update pet position error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get pets in room
router.get('/room/:roomId', async (req: Request, res: Response) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { roomId: req.params.roomId },
      include: {
        user: { select: { id: true, username: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(pets);
  } catch (error) {
    console.error('Get pets error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;