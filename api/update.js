import axios from "axios";
import { getDb } from "../lib/mongo.js";

export default async function handler(req, res) {
  const db = await getDb();
  const col = db.collection("simulacoes");

  const btc = await axios.get(
    "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
  );

  const precoBTC = parseFloat(btc.data.price);

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

  if (
    saldoUSDT > 10000 &&
    (!doc.valorMaximo || saldoUSDT > doc.valorMaximo.usdt)
  ) {
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

  res.json({ ok: true });
}
