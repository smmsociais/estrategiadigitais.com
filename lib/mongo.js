import dns from "dns";
import { MongoClient } from "mongodb";

// força IPv4 (evita TLS/handshake problems)
if (dns.setDefaultResultOrder) dns.setDefaultResultOrder("ipv4first");

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI não definida");

let clientPromise;

if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    tls: true,
  });
  global._mongoClientPromise = client.connect();
}

export async function getDb() {
  const client = await global._mongoClientPromise;
  return client.db("simulador"); // DB do seu app
}
