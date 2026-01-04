import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    const doc = await col.findOne({ _id: "btc-usdt-sim" });
    if (!doc) return res.json({ message: "Simulador não iniciado" });

    res.json(doc);
  } catch (e) {
    console.error("state error:", e);
    res.status(500).json({ error: e.message });
  }
}
