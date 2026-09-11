import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiRequest } from './api'
import { useAuth } from './AuthContext'

const INTEREST_OPTIONS = [
  'Beaches',
  'Food',
  'History',
  'Culture',
  'Nature',
  'Adventure',
  'Shopping',
  'Nightlife',
  'Museums',
  'Temples',
  'Wildlife',
  'Photography',
  'Architecture',
  'Spiritual',
  'Hiking',
  'Water sports',
  'Local experiences',
  'Markets',
  'Art',
  'Relaxation',
]

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
  const [verifiedLocation, setVerifiedLocation] = useState('')
  const [provider, setProvider] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)

  function updateField(e) {
    const { name, value } = e.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))

    if (error) {
      setError('')
    }
  }

  function validateForm() {
    const destination = form.destination.trim()
    const days = Number(form.days)
    const budget = Number(form.budget)
    const travellers = Number(form.travellers)
    const interests = form.interests.trim()

    if (!destination || !form.days || !form.budget || !form.travellers) {
      return 'Please fill all required trip details'
    }

    if (destination.length > 100) {
      return 'Destination must be 100 characters or less'
    }

    if (interests.length > 200) {
      return 'Interests must be 200 characters or less'
    }

    if (!Number.isInteger(days) || days < 1 || days > 14) {
      return 'Number of days must be between 1 and 14'
    }

    if (!Number.isFinite(budget) || budget <= 0) {
      return 'Please enter a valid budget greater than ₹0'
    }

    if (budget > 10000000) {
      return 'Budget cannot be more than ₹1 crore'
    }

    if (
      !Number.isInteger(travellers) ||
      travellers < 1 ||
      travellers > 20
    ) {
      return 'Number of travellers must be between 1 and 20'
    }

    return ''
  }

  async function handlePlan(e) {
    e.preventDefault()

    if (loading) {
      return
    }

    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError('')
    setPlan(null)
    setVerifiedLocation('')
    setProvider('')
    setSaved(false)

    try {
      const data = await apiRequest('/api/plan', {
        method: 'POST',
        body: JSON.stringify({
          destination: form.destination.trim(),
          days: Number(form.days),
          budget: Number(form.budget),
          travellers: Number(form.travellers),
          travelType: form.travelType,
          interests: form.interests.trim(),
        }),
      })

      setPlan(data.plan || null)
      setVerifiedLocation(data.verifiedLocation || '')
      setProvider(data.provider || '')
    } catch (error) {
      setError(
        error.message ||
          'Unable to generate your trip plan. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function savePlan() {
    if (!plan || !user || saving || saved) {
      return
    }

    const tasks = (plan.days || []).flatMap((day) =>
      (day.activities || []).map((activity) => ({
        day: day.day,
        title: activity,
        completed: false,
      }))
    )

    if (!tasks.length) {
      setError('This trip plan has no activities to save')
      return
    }

    setSaving(true)
    setError('')

    try {
      await apiRequest('/api/trips', {
        method: 'POST',
        body: JSON.stringify({
          destination:
            plan.destination || form.destination.trim(),
          days: Number(form.days),
          budget: Number(form.budget),
          travellers: Number(form.travellers),
          tasks,
        }),
      })

      setSaved(true)
    } catch (error) {
      setError(
        error.message ||
          'Unable to save the trip. Please try again.'
      )
    } finally {
      setSaving(false)
    }
  }

  function getBudgetStatusClass(status) {
    if (status === 'within_budget') {
      return 'badge badge-success'
    }

    if (status === 'tight_budget') {
      return 'badge badge-warning'
    }

    return 'badge badge-error'
  }

  function getBudgetStatusText(status) {
    if (status === 'within_budget') {
      return 'Within Budget'
    }

    if (status === 'tight_budget') {
      return 'Tight Budget'
    }

    return 'Insufficient Budget'
  }

  return (
    <div className="py-10 px-5 max-w-5xl mx-auto">
      <h1 className="text-3xl md:text-4xl font-bold text-center">
        ✈️ AI Trip Planner
      </h1>

      <p className="text-center text-base-content/70 mt-2 max-w-2xl mx-auto">
        Create a realistic day-wise travel plan based on your
        destination, budget, travellers and interests.
      </p>

      <form
        onSubmit={handlePlan}
        className="card bg-base-100 shadow-xl mt-8"
      >
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="form-control">
              <span className="label-text mb-2">
                Destination *
              </span>

              <input
                name="destination"
                value={form.destination}
                onChange={updateField}
                maxLength={100}
                required
                className="input input-bordered w-full"
                placeholder="Goa"
              />

              <span className="text-xs text-base-content/50 mt-1">
                Enter a country, state, city or place.
              </span>
            </label>

            <label className="form-control">
              <span className="label-text mb-2">
                Number of days *
              </span>

              <input
                name="days"
                value={form.days}
                onChange={updateField}
                type="number"
                min="1"
                max="14"
                required
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">
                Total Budget (₹) *
              </span>

              <input
                name="budget"
                value={form.budget}
                onChange={updateField}
                type="number"
                min="1"
                max="10000000"
                required
                className="input input-bordered w-full"
                placeholder="15000"
              />

              <span className="text-xs text-base-content/50 mt-1">
                Total budget for all travellers and all days.
              </span>
            </label>

            <label className="form-control">
              <span className="label-text mb-2">
                Travellers *
              </span>

              <input
                name="travellers"
                value={form.travellers}
                onChange={updateField}
                type="number"
                min="1"
                max="20"
                required
                className="input input-bordered w-full"
              />
            </label>

            <label className="form-control">
              <span className="label-text mb-2">
                Travel type
              </span>

              <select
                name="travelType"
                value={form.travelType}
                onChange={updateField}
                className="select select-bordered w-full"
              >
                <option>Friends</option>
                <option>Family</option>
                <option>Solo</option>
                <option>Couple</option>
              </select>
            </label>

            <label className="form-control">
              <span className="label-text mb-2">
                Interests
              </span>

              <input
                name="interests"
                value={form.interests}
                onChange={updateField}
                maxLength={200}
                className="input input-bordered w-full"
                placeholder="Beaches, food, history"
              />

              <span className="text-xs text-base-content/50 mt-1">
                Separate multiple interests with commas.
              </span>
            </label>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium mb-2">
              Popular interests
            </p>

            <div className="flex flex-wrap gap-2">
              {INTEREST_OPTIONS.slice(0, 12).map((interest) => {
                const selected = form.interests
                  .toLowerCase()
                  .split(',')
                  .map((item) => item.trim())
                  .includes(interest.toLowerCase())

                return (
                  <button
                    key={interest}
                    type="button"
                    className={`btn btn-sm ${
                      selected
                        ? 'btn-primary'
                        : 'btn-outline'
                    }`}
                    onClick={() => {
                      const current = form.interests
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean)

                      const exists = current.some(
                        (item) =>
                          item.toLowerCase() ===
                          interest.toLowerCase()
                      )

                      const updated = exists
                        ? current.filter(
                            (item) =>
                              item.toLowerCase() !==
                              interest.toLowerCase()
                          )
                        : [...current, interest]

                      setForm((previous) => ({
                        ...previous,
                        interests: updated.join(', '),
                      }))

                      setError('')
                    }}
                  >
                    {interest}
                  </button>
                )
              })}
            </div>
          </div>

          {error && (
            <div className="alert alert-error mt-4">
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary mt-5 w-full"
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="loading loading-spinner loading-sm" />
                Planning your trip...
              </>
            ) : (
              'Plan My Trip'
            )}
          </button>
        </div>
      </form>

      {plan && (
        <div className="mt-10">
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="flex flex-col lg:flex-row justify-between gap-5">
                <div className="min-w-0">
                  <h2 className="text-2xl md:text-3xl font-bold break-words">
                    {plan.destination}
                  </h2>

                  {verifiedLocation && (
                    <p className="text-sm text-base-content/60 mt-1">
                      Verified location: {verifiedLocation}
                    </p>
                  )}

                  <p className="text-base-content/70 mt-3">
                    {plan.summary}
                  </p>
                </div>

                <div className="shrink-0">
                  {!user ? (
                    <Link
                      to="/Login"
                      state={{ from: '/TripPlanner' }}
                      className="btn btn-primary"
                    >
                      Login to Save Plan
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={savePlan}
                      className="btn btn-primary"
                      disabled={saving || saved}
                    >
                      {saved
                        ? '✓ Saved to My Trips'
                        : saving
                          ? 'Saving...'
                          : 'Add to My To-Do List'}
                    </button>
                  )}
                </div>
              </div>

              {plan.budget && (
                <div className="bg-base-200 rounded-xl p-4 mt-5">
                  <h3 className="font-bold text-lg mb-3">
                    💰 Budget Summary
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <p className="text-sm text-base-content/60">
                        Total Budget
                      </p>
                      <p className="font-bold">
                        ₹
                        {Number(
                          plan.budget.total || 0
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-base-content/60">
                        Estimated Spending
                      </p>
                      <p className="font-bold">
                        ₹
                        {Number(
                          plan.budget.estimated_spending || 0
                        ).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-base-content/60 mb-1">
                        Status
                      </p>

                      <span
                        className={getBudgetStatusClass(
                          plan.budget.budget_status
                        )}
                      >
                        {getBudgetStatusText(
                          plan.budget.budget_status
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-3 text-xs text-base-content/50">
                AI provider: {provider || 'AI'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {plan.days?.map((day) => (
              <div
                key={day.day}
                className="card bg-base-100 shadow-md"
              >
                <div className="card-body">
                  <h3 className="card-title">
                    Day {day.day}: {day.title}
                  </h3>

                  <ul className="list-disc list-inside space-y-2 mt-2">
                    {day.activities?.map(
                      (activity, index) => (
                        <li key={index}>
                          {activity}
                        </li>
                      )
                    )}
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