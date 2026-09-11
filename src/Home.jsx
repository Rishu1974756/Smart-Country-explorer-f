function Home() {
  return (
    <div className="text-center py-16 px-5">
      {/* Main heading */}
      <h1 className="text-4xl font-bold">
        Explore the World 🌍
      </h1>

      <p className="mt-4 text-base-content/70">
        Discover information about countries around the world.
      </p>

      {/* Quick information */}
      <div className="flex flex-wrap justify-center gap-5 mt-10">

        <div className="card bg-base-100 shadow-md p-6 w-48">
          <h2 className="text-3xl font-bold">195+</h2>
          <p>Countries</p>
        </div>

        <div className="card bg-base-100 shadow-md p-6 w-48">
          <h2 className="text-3xl font-bold">7</h2>
          <p>Continents</p>
        </div>

        <div className="card bg-base-100 shadow-md p-6 w-48">
          <h2 className="text-3xl font-bold">🌎</h2>
          <p>Explore</p>
        </div>

      </div>
    </div>
  )
}

export default Home