function CountryCard({ country }) {
  const currency = country.currencies
    ? Object.values(country.currencies)[0]
    : null

  const languages = country.languages
    ? country.languages.map((language) => language.name).join(', ')
    : 'N/A'

  return (
    <div className="card bg-base-100 shadow-xl max-w-xl mx-auto mt-10">
      <figure className="p-5">
        <img
          src={country.flag?.url_png}
          alt="Country flag"
          className="w-full h-40 sm:h-60 object-cover rounded-xl" //changed for working in both phone and destop 
        />
      </figure>

      <div className="card-body">
        {/* Country name */}
        <h2 className="card-title text-3xl">
          {country.names?.common}
        </h2>

        <p className="text-base-content/60">
          {country.names?.official}
        </p>

        <div className="divider"></div>

        <div className="grid grid-cols-2 gap-4">
          <p><b>Capital</b><br />{country.capitals?.[0]?.name || 'N/A'}</p>

          <p><b>Population</b><br />{country.population?.toLocaleString() || 'N/A'}</p>

          <p><b>Region</b><br />{country.region || 'N/A'}</p>

          <p><b>Subregion</b><br />{country.subregion || 'N/A'}</p>

          <p>
            <b>Currency</b><br />
            {currency?.name || 'N/A'}
          </p>

          <p><b>Languages</b><br />{languages}</p>

          <p><b>Timezones</b><br />{country.timezones?.join(', ') || 'N/A'}</p>

          <p><b>Driving Side</b><br />{country.cars?.driving_side || 'N/A'}</p>
        </div>

{/* Google Maps */}
<a
  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    country.names?.common || ''
  )}`}
  target="_blank"
  rel="noopener noreferrer"
  className="btn btn-primary mt-5"
>
  📍 View on Google Maps
</a>
      </div>
    </div>
  )
}

export default CountryCard