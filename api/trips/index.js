import { getDb } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'

export default async function handler(req, res) {
  const user = requireUser(req, res)
  if (!user) return

  try {
    const db = await getDb()
    const collection = db.collection('trips')

    if (req.method === 'GET') {
      const trips = await collection
        .find({ userId: user.id })
        .sort({ createdAt: -1 })
        .toArray()

      return res.status(200).json({ trips })
    }

    if (req.method === 'POST') {
      const {
        destination,
        days,
        budget,
        travellers,
        tasks,
      } = req.body || {}

      const cleanDestination = String(destination || '').trim()
      const numberOfDays = Number(days)
      const numberOfTravellers = Number(travellers)

      if (
        !cleanDestination ||
        cleanDestination.length > 100 ||
        !Array.isArray(tasks) ||
        !tasks.length
      ) {
        return res.status(400).json({
          message: 'A trip with at least one activity is required',
        })
      }

      if (numberOfDays < 1 || numberOfDays > 14) {
        return res.status(400).json({
          message: 'Days must be between 1 and 14',
        })
      }

      if (numberOfTravellers < 1 || numberOfTravellers > 20) {
        return res.status(400).json({
          message: 'Travellers must be between 1 and 20',
        })
      }

      const cleanTasks = tasks
        .slice(0, 200)
        .map((task) => ({
          id: String(task?.id || crypto.randomUUID()),
          day: Math.max(1, Number(task?.day) || 1),
          title: String(task?.title || '').trim().slice(0, 200),
          completed: Boolean(task?.completed),
        }))
        .filter((task) => task.title)

      if (!cleanTasks.length) {
        return res.status(400).json({
          message: 'A trip with at least one valid activity is required',
        })
      }

      const trip = {
        userId: user.id,
        destination: cleanDestination,
        days: numberOfDays,
        budget: String(budget || '').trim(),
        travellers: numberOfTravellers,
        tasks: cleanTasks,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const result = await collection.insertOne(trip)

      return res.status(201).json({
        trip: {
          ...trip,
          _id: result.insertedId,
        },
      })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Trips API error:', error)
    return res.status(500).json({
      message: req.method === 'GET'
        ? 'Unable to load trips'
        : 'Unable to save trip',
    })
  }
}
