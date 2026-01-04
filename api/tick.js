import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    // 1️⃣ Buscar preço BTC da Binance
    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
    if (!r.ok) throw new Error("Binance HTTP " + r.status);
    const json = await r.json();
    const precoBTC = Number(json.price);

    // 2️⃣ Buscar documento do simulador
    let doc = await col.findOne({ _id: "btc-usdt-sim" });

    // 3️⃣ Criar documento se não existir
    if (!doc) {
      const saldoBTC = 10000 / precoBTC;
      doc = {
        _id: "btc-usdt-sim",
        saldoBTC,
        valorInicial: { data: new Date().toISOString(), usdt: 10000, preco: precoBTC },
        valorMaximo: null,
        updatedAt: new Date()
      };
      await col.insertOne(doc);
    }

    // 4️⃣ Atualizar máximo se necessário
    const saldoUSDT = doc.saldoBTC * precoBTC;
    let novoMaximo = false;

    if (saldoUSDT > 10000 && (!doc.valorMaximo || saldoUSDT > doc.valorMaximo.usdt)) {
      novoMaximo = true;
      await col.updateOne(
        { _id: "btc-usdt-sim" },
        {
          $set: {
            valorMaximo: { data: new Date().toISOString(), usdt: saldoUSDT, preco: precoBTC },
            updatedAt: new Date()
          }
        }
      );
    }

    const atualizado = await col.findOne({ _id: "btc-usdt-sim" });

    res.json({ ...atualizado, precoBTC, novoMaximo });
  } catch (e) {
    console.error("tick error:", e);
    res.status(500).json({ error: e.message });
  }
}
