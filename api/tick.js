import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    const r = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      {
        method: "GET",
        cache: "no-store",
        headers: {
          "User-Agent": "Mozilla/5.0"
        }
      }
    );

    if (!r.ok) {
      throw new Error("Binance HTTP " + r.status);
    }

    const json = await r.json();
    const precoBTC = Number(json.price);

    let doc = await col.findOne({ _id: "btc-usdt-sim" });

    if (!doc) {
      const saldoBTC = 10000 / precoBTC;

      doc = {
        _id: "btc-usdt-sim",
        saldoBTC,
        valorInicial: {
          data: new Date().toLocaleString(),
          usdt: 10000,
          preco: precoBTC
        },
        valorMaximo: null,
        updatedAt: new Date()
      };

      await col.insertOne(doc);
    }

    const saldoUSDT = doc.saldoBTC * precoBTC;

    let novoMaximo = false;

    if (
      saldoUSDT > 10000 &&
      (!doc.valorMaximo || saldoUSDT > doc.valorMaximo.usdt)
    ) {
      novoMaximo = true;

      await col.updateOne(
        { _id: "btc-usdt-sim" },
        {
          $set: {
            valorMaximo: {
              data: new Date().toLocaleString(),
              usdt: saldoUSDT,
              preco: precoBTC
            },
            updatedAt: new Date()
          }
        }
      );
    }

    const atualizado = await col.findOne({ _id: "btc-usdt-sim" });

    res.json({
      ...atualizado,
      precoBTC,
      novoMaximo
    });

  } catch (e) {
    console.error("tick error:", e);
    res.status(500).json({ error: e.message });
  }
}
