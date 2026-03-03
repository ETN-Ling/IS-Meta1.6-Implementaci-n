const express = require('express');
const mariadb = require('mariadb');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json()); // Para entender datos JSON

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
