import Joi from 'joi';

export const loginSchema = {
  body: Joi.object({
    username: Joi.string()
      .min(3)
      .max(20)
      .alphanum()
      .required()
      .messages({
        'string.alphanum': 'Username must only contain alphanumeric characters',
        'string.min': 'Username must be at least 3 characters long',
        'string.max': 'Username cannot exceed 20 characters',
      }),
  }),
};

export const socketAuthSchema = Joi.object({
  token: Joi.string().required(),
});