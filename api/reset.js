import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    // Busca preço atual para reiniciar saldo
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    if (!r.ok) throw new Error("Binance HTTP " + r.status);
    const json = await r.json();
    const precoBTC = Number(json.price);

    const saldoBTC = 10000 / precoBTC;
    const novoDoc = {
      saldoBTC,
      valorInicial: { data: new Date().toISOString(), usdt: 10000, preco: precoBTC },
      valorMaximo: null,
      updatedAt: new Date()
    };

    await col.updateOne(
      { _id: "btc-usdt-sim" },
      { $set: novoDoc },
      { upsert: true }
    );

    res.json({ message: "Simulador reiniciado", novoDoc });
  } catch (e) {
    console.error("reset error:", e);
    res.status(500).json({ error: e.message });
  }
}
