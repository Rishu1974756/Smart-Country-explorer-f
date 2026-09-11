import bcrypt from 'bcryptjs'
import { getDb } from '../_lib/db.js'
import { createToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    const db = await getDb()

    const user = await db.collection('users').findOne({
      email: email?.trim().toLowerCase(),
    })

    if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) {
      return res.status(401).json({
        message: 'Invalid email or password',
      })
    }

    return res.json({
      token: createToken(user),
      user: {
        email: user.email,
      },
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: 'Unable to login',
    })
  }
}