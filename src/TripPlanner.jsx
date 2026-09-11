import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from './api'
import { useAuth } from './AuthContext'

function TripPlanner() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    destination: '',
    days: '3',
    budget: '',
    travellers: '2',
    travelType: 'Friends',
    interests: '',
  })
  const [plan, setPlan] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function updateField(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handlePlan(e) {
    e.preventDefault()
    if (!form.destination.trim() || !form.budget || !form.days || !form.travellers) {
      setError('Please fill all required trip details')
      return
    }
    if (form.destination.length > 100 || form.interests.length > 200) {
      setError('Please keep the destination under 100 characters and interests under 200 characters')
      return
    }

    setLoading(true)
    setError('')
    setPlan(null)
    setSaved(false)

    try {
      const data = await apiRequest('/api/plan', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setPlan(data.plan)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!plan) return
    if (!user) return

    const tasks = plan.days.flatMap((day) =>
      day.activities.map((activity) => ({
        day: day.day,
        title: activity,
        completed: false,
      }))
    )

    setSaving(true)
    setError('')

    try {
      await apiRequest('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          destination: plan.destination || form.destination,
          days: Number(form.days),
          budget: form.budget,
          travellers: Number(form.travellers),
          tasks,
        }),
      })
      setSaved(true)
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="py-10 px-5 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-center">✈️ AI Trip Planner</h1>
      <p className="text-center text-base-content/70 mt-2">Create a day-wise travel plan based on your preferences.</p>

      <form onSubmit={handlePlan} className="card bg-base-100 shadow-xl mt-8">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label-text mb-2">Destination *</span>
              <input name="destination" value={form.destination} onChange={updateField} maxLength={100} className="input input-bordered" placeholder="Goa" />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">Number of days *</span>
              <input name="days" value={form.days} onChange={updateField} type="number" min="1" max="14" className="input input-bordered" />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">Budget *</span>
              <input name="budget" value={form.budget} onChange={updateField} type="number" min="1" className="input input-bordered" placeholder="15000" />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">Travellers *</span>
              <input name="travellers" value={form.travellers} onChange={updateField} type="number" min="1" max="20" className="input input-bordered" />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">Travel type</span>
              <select name="travelType" value={form.travelType} onChange={updateField} className="select select-bordered">
                <option>Friends</option>
                <option>Family</option>
                <option>Solo</option>
                <option>Couple</option>
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-2">Interests</span>
              <input name="interests" value={form.interests} onChange={updateField} maxLength={200} className="input input-bordered" placeholder="Beaches, food, history" />
            </label>
          </div>

          {error && <p className="text-error text-sm mt-3">{error}</p>}

          <button className="btn btn-primary mt-5" disabled={loading}>
            {loading ? 'Planning your trip...' : 'Plan My Trip'}
          </button>
        </div>
      </form>

      {plan && (
        <div className="mt-10">
          <div className="flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
            <div>
              <h2 className="text-2xl font-bold">{plan.destination}</h2>
              <p className="text-base-content/70">{plan.summary}</p>
            </div>
            {!user ? (
              <Link to="/Login" state={{ from: '/TripPlanner' }} className="btn btn-primary">Login to Save Plan</Link>
            ) : (
              <button onClick={savePlan} className="btn btn-primary" disabled={saving || saved}>
                {saved ? 'Saved to My Trips' : saving ? 'Saving...' : 'Add to My To-Do List'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {plan.days?.map((day) => (
              <div key={day.day} className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h3 className="card-title">Day {day.day}: {day.title}</h3>
                  <ul className="list-disc list-inside space-y-2">
                    {day.activities?.map((activity, index) => <li key={index}>{activity}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default TripPlanner
