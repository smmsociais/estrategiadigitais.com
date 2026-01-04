import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {
  const db = await getDb();
  const col = db.collection("simulacoes");

  const doc = await col.findOne({ _id: "btc-usdt-sim" });

  res.json(doc);
}
