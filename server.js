// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { getDb } from "./lib/mongo.js";

const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- middlewares ---------- */
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------- arquivos estáticos ---------- */
app.use(express.static(path.join(__dirname, "public")));

/* ---------- API: TICK ---------- */
app.get("/api/tick", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    const r = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
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

      doc = await col.findOne({ _id: "btc-usdt-sim" });
    }

    res.json({
      ...doc,
      precoBTC
    });

  } catch (err) {
    console.error("tick error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- API: RESET ---------- */
app.post("/api/reset", async (req, res) => {
  try {
    const db = await getDb();
    const col = db.collection("simulacoes");

    const r = await fetch(
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    );
    const json = await r.json();
    const precoBTC = Number(json.price);

    const saldoBTC = 10000 / precoBTC;

    await col.updateOne(
      { _id: "btc-usdt-sim" },
      {
        $set: {
          saldoBTC,
          valorInicial: {
            data: new Date().toLocaleString(),
            usdt: 10000,
            preco: precoBTC
          },
          valorMaximo: null,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("reset error:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ---------- SPA fallback ---------- */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ---------- start ---------- */
app.listen(PORT, () => {
  console.log("Servidor rodando na porta", PORT);
});
