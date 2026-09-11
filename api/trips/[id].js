import { ObjectId, getDb } from '../_lib/db.js'
import { requireUser } from '../_lib/auth.js'

export default async function handler(req, res) {
  const user = requireUser(req, res)
  if (!user) return

  try {
    const id = req.query?.id

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        message: 'Invalid trip id',
      })
    }

    const tripId = new ObjectId(id)
    const db = await getDb()
    const collection = db.collection('trips')

    if (req.method === 'PUT') {
      const { tasks } = req.body || {}

      if (!Array.isArray(tasks)) {
        return res.status(400).json({
          message: 'Tasks are required',
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

      const result = await collection.findOneAndUpdate(
        {
          _id: tripId,
          userId: user.id,
        },
        {
          $set: {
            tasks: cleanTasks,
            updatedAt: new Date(),
          },
        },
        {
          returnDocument: 'after',
        }
      )

      if (!result) {
        return res.status(404).json({
          message: 'Trip not found',
        })
      }

      return res.status(200).json({ trip: result })
    }

    if (req.method === 'DELETE') {
      const result = await collection.deleteOne({
        _id: tripId,
        userId: user.id,
      })

      if (!result.deletedCount) {
        return res.status(404).json({
          message: 'Trip not found',
        })
      }

      return res.status(200).json({
        message: 'Trip deleted',
      })
    }

    return res.status(405).json({ message: 'Method not allowed' })
  } catch (error) {
    console.error('Trip item API error:', error)
    return res.status(500).json({
      message: req.method === 'PUT'
        ? 'Unable to update trip'
        : 'Unable to delete trip',
    })
  }
}
