import { useState } from 'react'
import SearchBar from './SearchBar'
import CountryCard from './CountryCard'

function Countries() {
  const [country, setCountry] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch country data
  async function handleSearch(name) {
    setLoading(true)
    setError('')
    setCountry(null)

    try {
      const response = await fetch(
        `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(name)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
          },
        }
      )

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(response.status === 404 ? 'Country not found' : 'Request failed')
      }

      const countries = data?.data?.objects || []

      if (!countries.length) {
        throw new Error('Country not found')
      }

      setCountry(countries[0])
    } catch (error) {
      setError(
        error.message === 'Country not found'
          ? 'Country not found'
          : 'Unable to connect. Please check your internet connection.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="py-10 px-5">
      <h1 className="text-3xl font-bold text-center">
        Explore Countries
      </h1>

      <SearchBar
        onSearch={handleSearch}
        loading={loading}
      />

      {loading && (
        <p className="text-center mt-8">
          Loading...
        </p>
      )}

      {error && (
        <p className="text-center mt-8 text-error">
          {error}
        </p>
      )}

      {country && <CountryCard country={country} />}
    </div>
  )
}

export default Countries