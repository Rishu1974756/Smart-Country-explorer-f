import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from './AuthContext'

function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
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

    setLoading(true)
    setError('')

    try {
      await login(email.trim(), password)
      navigate(location.state?.from || '/MyTrips')
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-10">
      <form onSubmit={handleSubmit} className="card bg-base-100 shadow-xl w-full max-w-md">
        <div className="card-body">
          <h1 className="card-title text-3xl">Login</h1>
          <p className="text-base-content/70">Login to save and manage your trip plans.</p>

          <label className="form-control mt-4">
            <span className="label-text mb-2">Email</span>
            <input className="input input-bordered w-full" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>

          <label className="form-control mt-3">
            <span className="label-text mb-2">Password</span>
            <input className="input input-bordered w-full" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </label>

          {error && <p className="text-error text-sm mt-3">{error}</p>}

          <button className="btn btn-primary mt-5" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-sm mt-3">
            New user? <Link className="link link-primary" to="/Register">Create an account</Link>
          </p>
        </div>
      </form>
    </div>
  )
}

export default Login
