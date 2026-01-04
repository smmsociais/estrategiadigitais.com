// lib/mongo.js
import dns from "dns";
import { MongoClient } from "mongodb";

// força IPv4 first (evita problemas TLS serverless)
try {
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (err) {
  console.warn("dns.setDefaultResultOrder não disponível:", err.message);
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI não definida");

let clientPromise;

if (global._mongoClientPromise) {
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, {
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    tls: true,
    tlsAllowInvalidCertificates: false,
  });

  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db("simulador"); // seu DB
}
