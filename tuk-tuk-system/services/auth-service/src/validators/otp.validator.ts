import Joi from 'joi';

export const otpSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  email: Joi.string().email().optional().messages({
    'string.email': 'Please provide a valid email address',
  }),
}).xor('phone', 'email').messages({
  'object.missing': 'Either phone or email is required',
  'object.xor': 'Provide either phone or email, not both',
});

export const verifyOTPSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?[1-9]\d{1,14}$/).optional(),
  email: Joi.string().email().optional(),
  code: Joi.string().length(6).required().messages({
    'string.length': 'OTP must be 6 digits',
    'any.required': 'OTP code is required',
  }),
}).xor('phone', 'email');

export const resendOTPSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Phone or email is required',
  }),
  type: Joi.string().valid('phone', 'email').required().messages({
    'any.only': 'Type must be either phone or email',
    'any.required': 'Type is required',
  }),
});
