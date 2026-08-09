import Joi from 'joi';

export const guestBookingSchema = Joi.object({
  serviceType: Joi.string()
    .valid('taxi', 'cargo', 'delivery', 'airport')
    .required()
    .messages({
      'any.only': 'Service type must be one of: taxi, cargo, delivery, airport',
      'any.required': 'Service type is required'
    }),
  pickupLocation: Joi.string().required().min(3).max(500),
  dropoffLocation: Joi.string().required().min(3).max(500),
  passengerName: Joi.string().min(2).max(100).allow('', null),
  phone: Joi.string().required().pattern(/^\+?[1-9]\d{1,14}$/),
  scheduledDate: Joi.date().required(),
  scheduledTime: Joi.string().required().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/),
  notes: Joi.string().max(1000).allow('', null),
  isGuest: Joi.boolean().default(true),
  userId: Joi.number().optional().allow(null)
});

export const validateBooking = (data: any) => {
  return guestBookingSchema.validate(data, { abortEarly: false });
};
