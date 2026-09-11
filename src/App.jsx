import { Routes, Route } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import Home from './Home'
import Countries from './Countries'
import Compare from './Compare'
import TripPlanner from './TripPlanner'
import MyTrips from './MyTrips'
import Login from './Login'
import Register from './Register'
import { AuthProvider } from './AuthContext'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Header />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/Countries" element={<Countries />} />
            <Route path="/Compare" element={<Compare />} />
            <Route path="/TripPlanner" element={<TripPlanner />} />
            <Route path="/MyTrips" element={<MyTrips />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </AuthProvider>
  )
}

export default App
