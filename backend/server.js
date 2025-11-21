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
      SELECT buy_rate, sell_rate, created_at 
      FROM exchange_rates 
      ORDER BY created_at DESC 
      LIMIT 1
    `);

    if (rows.length > 0) {
      const rate = rows[0];
      res.json({
        buy: parseFloat(rate.buy_rate).toFixed(4),
        sell: parseFloat(rate.sell_rate).toFixed(4),
        lastUpdate: new Date(rate.created_at).toLocaleString('es-MX')
      });
    } else {
      res.json({
        buy: '19.8000',
        sell: '20.2000',
        lastUpdate: 'Sin datos'
      });
    }
  } catch (error) {
    console.error('Error:', error);
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

    await db.query(
      'INSERT INTO exchange_rates (buy_rate, sell_rate) VALUES (?, ?)',
      [parseFloat(buy), parseFloat(sell)]
    );

    res.json({
      success: true,
      data: {
        buy: parseFloat(buy).toFixed(4),
        sell: parseFloat(sell).toFixed(4),
        lastUpdate: new Date().toLocaleString('es-MX')
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al guardar datos' });
  }
});

// GET - Obtener historial (últimas 20 tasas)
app.get('/api/rates/history', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, buy_rate, sell_rate, created_at 
      FROM exchange_rates 
      ORDER BY created_at DESC 
      LIMIT 20
    `);

    const history = rows.map(row => ({
      id: row.id,
      buy: parseFloat(row.buy_rate).toFixed(4),
      sell: parseFloat(row.sell_rate).toFixed(4),
      date: new Date(row.created_at).toLocaleString('es-MX')
    }));

    res.json(history);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});