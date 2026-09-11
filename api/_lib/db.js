import { MongoClient, ObjectId } from 'mongodb'

let client
let db

export async function getDb() {
  if (db) return db

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is missing')
  }

  client = client || new MongoClient(process.env.MONGODB_URI)

  await client.connect()

  db = client.db('smart_country')

  return db
}

export { ObjectId }
