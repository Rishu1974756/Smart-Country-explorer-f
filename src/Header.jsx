import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'

function Header() {
  const { user, logout } = useAuth()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  function changeTheme() {
    setDark(!dark)
  }

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="flex-1">
        <Link to="/" className="text-xl font-bold">🌍 Smart Country Explorer</Link>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden lg:flex items-center gap-4">
          <Link to="/">Home</Link>
          <Link to="/Countries">Countries</Link>
          <Link to="/Compare">Compare</Link>
          <Link to="/TripPlanner">Trip Planner</Link>
          <Link to="/MyTrips">My Trips</Link>
        </div>

        <div className="dropdown dropdown-end lg:hidden">
          <button className="btn btn-ghost" aria-label="Open menu">☰</button>
          <ul className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-48 p-2 shadow">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/Countries">Countries</Link></li>
            <li><Link to="/Compare">Compare</Link></li>
            <li><Link to="/TripPlanner">Trip Planner</Link></li>
            <li><Link to="/MyTrips">My Trips</Link></li>
          </ul>
        </div>

        {user ? (
          <button onClick={logout} className="btn btn-sm btn-outline hidden sm:inline-flex">Logout</button>
        ) : (
          <Link to="/Login" className="btn btn-sm btn-outline hidden sm:inline-flex">Login</Link>
        )}

        <label className="swap swap-rotate">
          <input type="checkbox" checked={dark} onChange={changeTheme} aria-label="Toggle theme" />
          <span className="swap-off text-xl">☀️</span>
          <span className="swap-on text-xl">🌙</span>
        </label>
      </div>
    </div>
  )
}

export default Header
