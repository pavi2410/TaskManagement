import Joi from 'joi'

const validationSchema = {
  username: Joi.string().required().email({ tlds: { allow: false } }),
  password: Joi.string().required().min(6),
}

export function validateUsername(username) {
  const { error } = validationSchema.username.validate(username);
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