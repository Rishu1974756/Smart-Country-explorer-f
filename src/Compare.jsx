import { useState } from 'react'

function Compare() {
  const [country1, setCountry1] = useState(null)
  const [country2, setCountry2] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fetch both countries
  async function handleCompare(e) {
    e.preventDefault()

    const name1 = e.target.country1.value.trim()
    const name2 = e.target.country2.value.trim()
    if (name1.length > 100 || name2.length > 100) {
      setError('Country name cannot be more than 100 letters')
      return
    }

    if (!name1 || !name2) {
      setError('Enter both country names')
      return
    }

    if (name1.toLowerCase() === name2.toLowerCase()) {
      setError('Please enter two different countries')
      return
    }

    setLoading(true)
    setError('')
    setCountry1(null)
    setCountry2(null)

    try {
      const [res1, res2] = await Promise.all([
        fetch(
          `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(name1)}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
            },
          }
        ),

        fetch(
          `https://api.restcountries.com/countries/v5/names.common/${encodeURIComponent(name2)}`,
          {
            headers: {
              Authorization: `Bearer ${import.meta.env.VITE_API_KEY}`,
            },
          }
        ),
      ])

      const data1 = await res1.json().catch(() => ({}))
      const data2 = await res2.json().catch(() => ({}))

      if (!res1.ok || !res2.ok) {
        throw new Error(
          res1.status === 404 || res2.status === 404
            ? 'Country not found'
            : 'Request failed'
        )
      }

      const countries1 = data1?.data?.objects || []
      const countries2 = data2?.data?.objects || []

      if (!countries1.length || !countries2.length) {
        throw new Error('Country not found')
      }

      setCountry1(countries1[0])
      setCountry2(countries2[0])
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
        Compare Countries
      </h1>
      
      {/* DaisyUI Join component */}
      <form
        onSubmit={handleCompare}
        className="join w-full max-w-2xl mx-auto mt-8 flex flex-col sm:flex-row"
      >
        <label className="input join-item w-full">
          <input
            type="text"
            name="country1"
            placeholder="First country"
           
          />
        </label>

        <label className="input join-item w-full">
          <input
            type="text"
            name="country2"
            placeholder="Second country"
            maxLength={100}
            required
          />
        </label>

              <button
        className="btn btn-primary join-item"
        disabled={loading}
      >
        {loading ? 'Comparing...' : 'Compare'}
      </button>
      </form>

      {error && (
        <p className="text-center text-error mt-5">
          {error}
        </p>
      )}

      {country1 && country2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-4xl mx-auto mt-10">
          <CompareCard country={country1} />
          <CompareCard country={country2} />
        </div>
      )}
    </div>
  )
}

function CompareCard({ country }) {
  return (
    <div className="card bg-base-100 shadow-xl p-5">
      <img
        src={country.flag?.url_png}
        alt="Country flag"
        className="w-full h-32 sm:h-48 object-cover rounded-xl"
      />

      <h2 className="text-2xl font-bold mt-5">
        {country.names?.common}
      </h2>

      <div className="divider"></div>

      <p>
        <b>Capital:</b>{' '}
        {country.capitals?.[0]?.name || 'N/A'}
      </p>

      <p>
        <b>Population:</b>{' '}
        {country.population?.toLocaleString() || 'N/A'}
      </p>

      <p>
        <b>Region:</b>{' '}
        {country.region || 'N/A'}
      </p>

      <p>
        <b>Currency:</b>{' '}
        {Object.values(country.currencies || {})[0]?.name || 'N/A'}
      </p>

      <p>
        <b>Timezone:</b>{' '}
        {country.timezones?.join(', ') || 'N/A'}
      </p>

      <p>
        <b>Driving:</b>{' '}
        {country.cars?.driving_side || 'N/A'}
      </p>
    </div>
  )
}

export default Compare