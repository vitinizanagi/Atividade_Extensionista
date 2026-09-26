import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { db } from "./db.js";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ping de saúde
app.get("/api/ping", (req, res) => {
  res.json({ ok: true, msg: "pong" });
});

// GET: listar pontos
app.get("/api/pontos", async (req, res) => {
  try {
    const [rows] = await db.execute(`
      SELECT id, nome, materiais, lat, lng, endereco, numero, bairro, cep,
             celular, horario, observacoes, created_at
      FROM cadastro
      ORDER BY created_at DESC
    `);
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar pontos" });
  }
});

// POST: cadastrar ponto
app.post("/api/pontos", async (req, res) => {
  try {
    const {
      nome, materiais, lat, lng,
      endereco = "", numero = "", bairro = "", cep = "",
      celular = "", horario = "", observacoes = ""
    } = req.body;

    if (!nome || lat == null || lng == null) {
      return res.status(400).json({ error: "Campos obrigatórios: nome, lat, lng" });
    }

    const materiaisJson = Array.isArray(materiais)
      ? JSON.stringify(materiais)
      : String(materiais || "[]");

    const sql = `
      INSERT INTO cadastro
        (nome, materiais, lat, lng, endereco, numero, bairro, cep, celular, horario, observacoes)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await db.execute(sql, [
      nome, materiaisJson, lat, lng,
      endereco, numero, bairro, cep, celular, horario, observacoes
    ]);

    res.status(201).json({ ok: true, msg: "Ponto cadastrado" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao cadastrar ponto" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API rodando em http://localhost:${PORT}`));

//EXCLUIR O PONTO DE COLETA
app.delete("/api/pontos/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [r] = await db.execute("DELETE FROM cadastro WHERE id = ? LIMIT 1", [id]);
    if (r.affectedRows === 0) return res.status(404).json({ error: "Ponto não encontrado" });
    res.status(204).end(); // sem conteúdo
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao excluir ponto" });
  }
});