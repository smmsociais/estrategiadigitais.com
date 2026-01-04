// lib/mongo.js
import dns from "dns";
import { MongoClient } from "mongodb";

// força preferência por IPv4 (pode corrigir handshake TLS em serverless)
try {
  // node 17+ suportam setDefaultResultOrder
  if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder("ipv4first");
  }
} catch (err) {
  // se não suportar, ignora
  console.warn("dns.setDefaultResultOrder not available:", err && err.message);
}

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI not defined");

let clientPromise;

if (global._mongoClientPromise) {
  clientPromise = global._mongoClientPromise;
} else {
  const client = new MongoClient(uri, {
    // pool e timeouts
    maxPoolSize: 20,
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    // SSL/TLS
    tls: true,
    tlsAllowInvalidCertificates: false,
    // monitorCommands pode ajudar em debug (opcional)
    monitorCommands: false,
  });

  clientPromise = client.connect();
  global._mongoClientPromise = clientPromise;
}

export async function getDb() {
  const client = await clientPromise;
  return client.db("simulador");
}
