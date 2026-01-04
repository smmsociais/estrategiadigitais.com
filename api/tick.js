// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./lib/mongo.js";

const app = express();
const PORT = process.env.PORT || 8080;

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));

// API Tick
app.get("/api/tick", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    const r = await fetch("https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT");
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

    if (saldoUSDT > 10000 && (!doc.valorMaximo || saldoUSDT > doc.valorMaximo.usdt)) {
      novoMaximo = true;
      await col.updateOne(
        { _id: "btc-usdt-sim" },
        {
          $set: {
            valorMaximo: { data: new Date().toLocaleString(), usdt: saldoUSDT, preco: precoBTC },
            updatedAt: new Date()
          }
        }
      );
    }

    const atualizado = await col.findOne({ _id: "btc-usdt-sim" });
    res.json({ ...atualizado, precoBTC, novoMaximo });
  } catch (err) {
    console.error("tick error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));
