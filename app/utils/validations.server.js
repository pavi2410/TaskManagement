import Joi from 'joi'

const validationSchema = {
  email: Joi.string().required().email({ tlds: { allow: false } }),
  password: Joi.string().required().min(8).alphanum(),
}

export function validateEmail(email) {
  const { error } = validationSchema.email.validate(email);
  if (error) {
    return error
  }
}

export function validatePassword(password) {
  const { error } = validationSchema.password.validate(password);
  if (error) {
    return error
  }
}