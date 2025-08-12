import Joi from 'joi';

export const createPetSchema = {
  body: Joi.object({
    roomId: Joi.string().uuid().required(),
    drawingData: Joi.object().required(),
    imageData: Joi.string().optional(),
    type: Joi.string().valid('dog', 'cat').required(),
    position: Joi.object({
      x: Joi.number().min(0).max(2000).default(100),
      y: Joi.number().min(0).max(1200).default(100),
    }).default({ x: 100, y: 100 }),
  }),
};

export const updatePetPositionSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
  body: Joi.object({
    x: Joi.number().min(0).max(2000).required(),
    y: Joi.number().min(0).max(1200).required(),
  }),
};

export const getRoomPetsSchema = {
  params: Joi.object({
    roomId: Joi.string().uuid().required(),
  }),
};