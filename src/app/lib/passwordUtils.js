import bcrypt from 'bcryptjs'

// Hash a password
export const hashPassword = async (password) => {
  const saltRounds = 12
  return await bcrypt.hash(password, saltRounds)
}

// Verify a password against a hash
export const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword)
}

// Check if a password is already hashed (starts with $2a$ or $2b$)
export const isPasswordHashed = (password) => {
  return password.startsWith('$2a$') || password.startsWith('$2b$')
}


