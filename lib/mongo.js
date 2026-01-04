// lib/mongo.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("MONGODB_URI não definida");
}

const client = new MongoClient(uri, {
  maxPoolSize: 5
});

let cachedDb = null;

export async function getDb() {
  if (cachedDb) return cachedDb;

  await client.connect();
  cachedDb = client.db(process.env.MONGODB_DB);
  return cachedDb;
}
