import axios from "axios";
import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {

  const token = req.headers["x-cron-token"];

  if (token !== process.env.CRON_TOKEN) {
    return res.status(401).json({ error: "unauthorized" });
  }

  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    const { data } = await axios.get(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT",
      { timeout: 5000 }
    );

    const precoBTC = parseFloat(data.price);

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
    console.error("tick error:", e.message);
    res.status(500).json({ error: "tick failed" });
  }
}
