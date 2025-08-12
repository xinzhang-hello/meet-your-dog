import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../utils/database';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { authLimiter } from '../middleware/rateLimiting';
import { loginSchema } from '../schemas/auth.schemas';
import { logger } from '../utils/logger';

const router = express.Router();

router.post('/login', 
  authLimiter,
  validateRequest(loginSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { username } = req.body;

    logger.info(`Login attempt for username: ${username}`);

    // Find or create user
    let user = await prisma.user.findUnique({ where: { username } });
    
    if (!user) {
      user = await prisma.user.create({
        data: { username }
      });
      logger.info(`New user created: ${username}`);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '7d' }
    );

    logger.info(`User logged in successfully: ${username}`);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  })
);

export default router;