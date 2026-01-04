// lib/mongo.js
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("MONGODB_URI não definida");
}

let client;
let clientPromise;

if (!global._mongoClientPromise) {
  client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
  });

  global._mongoClientPromise = client.connect();
}

clientPromise = global._mongoClientPromise;

export async function getDb() {
  const client = await clientPromise;
  return client.db(); // usa o DB da URI
}
