import bcrypt from 'bcryptjs'
import { getDb } from '../_lib/db.js'
import { createToken } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body

    if (!email?.trim() || !password) {
      return res.status(400).json({
        message: 'Email and password are required',
      })
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: 'Password must be at least 6 characters',
      })
    }

    const db = await getDb()
    const users = db.collection('users')

    const cleanEmail = email.trim().toLowerCase()

    const existing = await users.findOne({
      email: cleanEmail,
    })

    if (existing) {
      return res.status(409).json({
        message: 'Email already registered',
      })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const result = await users.insertOne({
      email: cleanEmail,
      passwordHash,
      createdAt: new Date(),
    })

    const user = {
      _id: result.insertedId,
      email: cleanEmail,
    }

    return res.status(201).json({
      token: createToken(user),
      user: {
        email: cleanEmail,
      },
    })
  } catch (error) {
    console.error(error)

    return res.status(500).json({
      message: 'Unable to create account',
    })
  }
}