const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json()); // Para entender datos JSON
app.use(express.json({ limit: '25mb' })); 
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// Configuración de la conexión a MariaDB
const pool = mariadb.createPool({
     host: 'localhost', 
     user: 'peer_user',      // <-- CAMBIAMOS EL USUARIO
     password: 'peer123',    // <-- PONEMOS LA CONTRASEÑA
     database: 'peer_review_db',
     connectionLimit: 5
});

// ENDPOINT: Recibir artículos desde el Frontend
app.post('/api/articles', async (req, res) => {
    let conn;
    try {
        const { id, title, authors, status } = req.body;
        conn = await pool.getConnection();
        
        const query = "INSERT INTO articles (id, title, authors, status) VALUES (?, ?, ?, ?)";
        await conn.query(query, [id, title, authors, status]);
        
        res.status(201).json({ message: "✅ Artículo guardado en MariaDB", id });
    } catch (err) {
        console.error("Error en el servidor:", err);
        res.status(500).json({ error: "Error al guardar en la base de datos" });
    } finally {
        if (conn) conn.end();
    }
});

// Tu ruta GET que el Editor intenta leer
app.get('/api/articles', async (req, res) => {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query("SELECT id, title, authors, status FROM articles");
        res.json(rows);
    } catch (err) {
        res.status(500).send(err);
    } finally {
        if (conn) conn.release();
    }
});

app.put('/api/articles/:id/status', async (req, res) => {
    let conn;
    try {
        const { id } = req.params;
        const { status } = req.body;
        conn = await pool.getConnection();
        
        await conn.query("UPDATE articles SET status = ? WHERE id = ?", [status, id]);
        res.json({ message: "Estado actualizado correctamente" });
    } catch (err) {
        console.error("Error al actualizar:", err);
        res.status(500).json({ error: "Error al actualizar la BD" });
    } finally {
        if (conn) conn.release();
    }
});

app.listen(3000, () => {
    console.log("Servidor corriendo en puerto 3000 y CORS habilitado");
});
