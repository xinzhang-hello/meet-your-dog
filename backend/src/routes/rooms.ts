import express, { Request, Response } from 'express';
import Joi from 'joi';
import prisma from '../utils/database';
import { authenticate } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { logError } from '../utils/logger';

const router = express.Router();

const createRoomSchema = Joi.object({
  name: Joi.string().min(1).max(50).required(),
  maxPlayers: Joi.number().min(2).max(20).default(10)
});

// Get all active rooms
router.get('/', async (req: Request, res: Response) => {
  try {
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: { roomMembers: { where: { isActive: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const roomsWithPlayerCount = rooms.map(room => ({
      id: room.id,
      name: room.name,
      maxPlayers: room.maxPlayers,
      currentPlayers: room._count.roomMembers,
      createdAt: room.createdAt
    }));

    res.json(roomsWithPlayerCount);
  } catch (error) {
    logError('Get rooms error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create room
router.post('/', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { error } = createRoomSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const room = await prisma.room.create({
      data: {
        name: req.body.name,
        maxPlayers: req.body.maxPlayers || 10
      }
    });

    res.json(room);
  } catch (error) {
    logError('Create room error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get room details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const room = await prisma.room.findUnique({
      where: { id: req.params.id },
      include: {
        roomMembers: {
          where: { isActive: true },
          include: { user: { select: { id: true, username: true } } }
        },
        pets: {
          include: { user: { select: { id: true, username: true } } }
        }
      }
    });

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error) {
    logError('Get room error', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;