import jwt from 'jsonwebtoken'

export function createToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

export function getUser(req) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''

  if (!token) return null

  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

export function requireUser(req, res) {
  const user = getUser(req)

  if (!user) {
    res.status(401).json({ message: 'Please login first' })
    return null
  }

  return user
}
