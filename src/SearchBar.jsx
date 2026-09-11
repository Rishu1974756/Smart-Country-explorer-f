import { useState } from 'react'

function SearchBar({ onSearch, loading }) {
  const [input, setInput] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    {/*here we Countries search validation */}
    if (!input.trim()) {
      setError('Please enter a country name')
      return
    }
    if (input.length > 100) {
      setError('Country name cannot be more than 100 letters')
      return
    }
    setError('')
    onSearch(input.trim())
  }

  return (
    //used daisy component for search bar
        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mt-8">

      <div className="join flex">
        <label className="input join-item w-full">
          <input
            type="text"
            placeholder="Enter country name..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </label>

        <button
          className="btn btn-primary join-item"
          disabled={loading}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

            {error && (
        <p className="text-error text-sm mt-2">{error}</p>
      )}

    </form>
  )
}

export default SearchBar