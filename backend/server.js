const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// GET - Obtener la tasa más reciente
app.get('/api/rates', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT precio_compra, precio_venta, fecha_creacion 
      FROM tipos_cambio 
      ORDER BY fecha_creacion DESC 
      LIMIT 1
    `);

    if (rows.length > 0) {
      const tasa = rows[0];
      res.json({
        buy: parseFloat(tasa.precio_compra).toFixed(4),
        sell: parseFloat(tasa.precio_venta).toFixed(4),
        lastUpdate: new Date(tasa.fecha_creacion).toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      });
    } else {
      res.json({
        buy: '19.8000',
        sell: '20.2000',
        lastUpdate: 'Sin datos'
      });
    }
  } catch (error) {
    console.error('Error al obtener tasas:', error);
    res.status(500).json({ error: 'Error al obtener datos' });
  }
});

// POST - Guardar nueva tasa
app.post('/api/rates', async (req, res) => {
  try {
    const { buy, sell } = req.body;

    if (!buy || !sell) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    const compra = parseFloat(buy);
    const venta = parseFloat(sell);

    // Validar que la venta sea mayor que la compra
    if (venta <= compra) {
      return res.status(400).json({ error: 'El precio de venta debe ser mayor al de compra' });
    }

    await db.query(
      'INSERT INTO tipos_cambio (precio_compra, precio_venta) VALUES (?, ?)',
      [compra, venta]
    );

    res.json({
      success: true,
      data: {
        buy: compra.toFixed(4),
        sell: venta.toFixed(4),
        lastUpdate: new Date().toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    });
  } catch (error) {
    console.error('Error al guardar tasa:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// GET - Obtener historial (últimas 20 tasas)
app.get('/api/rates/history', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, precio_compra, precio_venta, fecha_creacion 
      FROM tipos_cambio 
      ORDER BY fecha_creacion DESC 
      LIMIT 20
    `);

    const historial = rows.map(tasa => ({
      id: tasa.id,
      buy: parseFloat(tasa.precio_compra).toFixed(4),
      sell: parseFloat(tasa.precio_venta).toFixed(4),
      date: new Date(tasa.fecha_creacion).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }));

    res.json(historial);
  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: MySQL (tipos_cambio)`);
  console.log(`🌐 Endpoints disponibles:`);
  console.log(`   GET  /api/rates         - Obtener tasa actual`);
  console.log(`   POST /api/rates         - Guardar nueva tasa`);
  console.log(`   GET  /api/rates/history - Obtener historial`);
});