import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiRequest } from './api'
import { useAuth } from './AuthContext'

function MyTrips() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null)
  const [editText, setEditText] = useState('')
  const [newTask, setNewTask] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      navigate('/Login', { state: { from: '/MyTrips' } })
      return
    }

    loadTrips()
  }, [user])

  async function loadTrips() {
    setLoading(true)
    setError('')

    try {
      const data = await apiRequest('/api/trips')
      setTrips(data.trips || [])
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function updateTrip(trip, tasks) {
    if (updating) return

    setUpdating(true)
    setError('')

    try {
      const data = await apiRequest(`/api/trips/${trip._id}`, {
        method: 'PUT',
        body: JSON.stringify({ tasks }),
      })

      setTrips((current) =>
        current.map((item) =>
          item._id === trip._id ? data.trip : item
        )
      )
    } catch (error) {
      setError(error.message)
    } finally {
      setUpdating(false)
    }
  }

  function toggleTask(trip, taskId) {
    const tasks = trip.tasks.map((task) =>
      task.id === taskId
        ? { ...task, completed: !task.completed }
        : task
    )

    updateTrip(trip, tasks)
  }

  function startEdit(task) {
    setEditing(task.id)
    setEditText(task.title)
    setError('')
  }

  function saveEdit(trip, taskId) {
    const title = editText.trim()

    if (!title) {
      setError('Task title cannot be empty')
      return
    }

    if (title.length > 200) {
      setError('Task title cannot be more than 200 characters')
      return
    }

    const tasks = trip.tasks.map((task) =>
      task.id === taskId
        ? { ...task, title }
        : task
    )

    setEditing(null)
    setEditText('')
    updateTrip(trip, tasks)
  }

  function addTask(trip) {
    const title = newTask.trim()

    if (!title) {
      setError('Enter an activity')
      return
    }

    if (title.length > 200) {
      setError('Activity cannot be more than 200 characters')
      return
    }

    const maxDay = Math.max(
      ...trip.tasks.map((task) => task.day),
      1
    )

    const tasks = [
      ...trip.tasks,
      {
        id: crypto.randomUUID(),
        day: maxDay,
        title,
        completed: false,
      },
    ]

    setNewTask('')
    setError('')
    updateTrip(trip, tasks)
  }

  function deleteTask(trip, taskId) {
    updateTrip(
      trip,
      trip.tasks.filter((task) => task.id !== taskId)
    )
  }

  async function deleteTrip(id) {
    if (!confirm('Delete this trip?')) return

    setError('')

    try {
      await apiRequest(`/api/trips/${id}`, {
        method: 'DELETE',
      })

      setTrips((current) =>
        current.filter((trip) => trip._id !== id)
      )
    } catch (error) {
      setError(error.message)
    }
  }

  if (!user) return null

  return (
    <div className="py-10 px-5 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
        <div>
          <h1 className="text-3xl font-bold">🧳 My Trips</h1>
          <p className="text-base-content/70 mt-1">
            Manage your saved travel plans and track progress.
          </p>
        </div>

        <Link
          to="/TripPlanner"
          className="btn btn-primary"
        >
          Create New Trip
        </Link>
      </div>

      {error && (
        <p className="text-error mt-5">
          {error}
        </p>
      )}

      {loading && (
        <p className="text-center mt-10">
          Loading trips...
        </p>
      )}

      {!loading && !trips.length && (
        <div className="alert mt-8">
          No saved trips yet. Create a trip from the Trip Planner.
        </div>
      )}

      <div className="space-y-6 mt-8">
        {trips.map((trip) => {
          const tasks = trip.tasks || []

          const completed = tasks.filter(
            (task) => task.completed
          ).length

          const progress = tasks.length
            ? Math.round((completed / tasks.length) * 100)
            : 0

          const days = [
            ...new Set(tasks.map((task) => task.day)),
          ].sort((a, b) => a - b)

          return (
            <div
              key={trip._id}
              className="card bg-base-100 shadow-xl"
            >
              <div className="card-body">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div>
                    <h2 className="card-title text-2xl">
                      ✈️ {trip.destination}
                    </h2>

                    <p>
                      {trip.days} days · {trip.travellers} travellers ·
                      {' '}Budget: {trip.budget}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteTrip(trip._id)}
                    className="btn btn-error btn-outline btn-sm"
                  >
                    Delete Trip
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>
                      {completed}/{tasks.length} completed ({progress}%)
                    </span>
                  </div>

                  <progress
                    className="progress progress-primary w-full"
                    value={progress}
                    max="100"
                  />
                </div>

                {days.map((day) => (
                  <div key={day} className="mt-5">
                    <h3 className="font-bold text-lg">
                      Day {day}
                    </h3>

                    <div className="space-y-2 mt-2">
                      {tasks
                        .filter((task) => task.day === day)
                        .map((task) => (
                          <div
                            key={task.id}
                            className="flex flex-col sm:flex-row gap-2 items-start sm:items-center border rounded-lg p-3"
                          >
                            <label className="flex items-center gap-3 flex-1 min-w-0">
                              <input
                                type="checkbox"
                                checked={task.completed}
                                onChange={() =>
                                  toggleTask(trip, task.id)
                                }
                                disabled={updating}
                                className="checkbox checkbox-primary"
                              />

                              {editing === task.id ? (
                                <input
                                  className="input input-bordered input-sm w-full"
                                  value={editText}
                                  onChange={(e) =>
                                    setEditText(e.target.value)
                                  }
                                  maxLength={200}
                                />
                              ) : (
                                <span
                                  className={
                                    task.completed
                                      ? 'line-through opacity-60'
                                      : ''
                                  }
                                >
                                  {task.title}
                                </span>
                              )}
                            </label>

                            <div className="flex gap-2">
                              {editing === task.id ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    saveEdit(trip, task.id)
                                  }
                                  disabled={updating}
                                  className="btn btn-success btn-sm"
                                >
                                  Save
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => startEdit(task)}
                                  disabled={updating}
                                  className="btn btn-ghost btn-sm"
                                >
                                  Edit
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() =>
                                  deleteTask(trip, task.id)
                                }
                                disabled={updating}
                                className="btn btn-ghost btn-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

                <div className="join mt-5 w-full">
                  <input
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    maxLength={200}
                    className="input input-bordered join-item w-full"
                    placeholder="Add an activity..."
                  />

                  <button
                    type="button"
                    onClick={() => addTask(trip)}
                    disabled={updating}
                    className="btn btn-primary join-item"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MyTrips