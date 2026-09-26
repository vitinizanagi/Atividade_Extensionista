import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

export const db = await mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10
});

// teste rápido ao iniciar
try {
  const [r] = await db.query("SELECT 1 AS ok");
  console.log("MySQL conectado:", r[0].ok === 1 ? "OK" : "ERRO");
} catch (e) {
  console.error("Falha ao conectar no MySQL:", e.message);
}