import { Link, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './AuthContext'

function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Please enter email and password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      await register(email.trim(), password)
      navigate('/MyTrips')
    } catch (error) {
      setError(error.message || 'Unable to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-10">
      <form
        onSubmit={handleSubmit}
        className="card bg-base-100 shadow-xl w-full max-w-md"
      >
        <div className="card-body">
          <h1 className="card-title text-3xl">Create Account</h1>

          <p className="text-base-content/70">
            Create an account to save your trip plans.
          </p>

          <label className="form-control mt-4">
            <span className="label-text mb-2">Email</span>

            <input
              className="input input-bordered w-full"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              maxLength={100}
              required
            />
          </label>

          <label className="form-control mt-3">
            <span className="label-text mb-2">Password</span>

            <input
              className="input input-bordered w-full"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              maxLength={100}
              required
            />
          </label>

          {error && (
            <p className="text-error text-sm mt-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="btn btn-primary mt-5"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Account'}
          </button>

          <p className="text-sm mt-3">
            Already have an account?{' '}
            <Link className="link link-primary" to="/Login">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Register