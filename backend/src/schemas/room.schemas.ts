import Joi from 'joi';

export const createRoomSchema = {
  body: Joi.object({
    name: Joi.string()
      .min(1)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Room name is required',
        'string.max': 'Room name cannot exceed 50 characters',
      }),
    maxPlayers: Joi.number()
      .integer()
      .min(2)
      .max(20)
      .default(10)
      .messages({
        'number.min': 'Room must allow at least 2 players',
        'number.max': 'Room cannot exceed 20 players',
      }),
  }),
};

export const getRoomSchema = {
  params: Joi.object({
    id: Joi.string().uuid().required(),
  }),
};