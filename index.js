require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const BigchainDB = require('bigchaindb-driver');
const bip39 = require('bip39');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');

const app = express();
app.use(express.json());

// Configuración de MySQL
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// Verificar conexión a MySQL
db.connect((err) => {
  if (err) {
    console.error('Error al conectar a MySQL:', err);
    process.exit(1);
  }
  console.log('Conexión exitosa a MySQL');
});

// Función para acortar hashes (formato xxxx...xxxx)
const shortenHash = (hash) => {
  if (!hash || hash.length < 8) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

// Endpoint para listar transacciones en el formato requerido
app.get('/transactions', async (req, res) => {
  const sql = 'SELECT * FROM tabla_test ORDER BY created_at DESC'; // Ordenar por las más recientes
  db.query(sql, async (err, results) => {
    if (err) {
      console.error('Error al obtener transacciones desde MySQL:', err);
      return res.status(500).json({ error: 'Error al obtener transacciones' });
    }

    const transactions = await Promise.all(
      results.map(async (row) => {
        if (!row.transaction_id) {
          return {
            firma: 'Sin Firma',
            bloque: 'Sin Bloque',
            fecha: row.created_at || new Date().toISOString(),
            tipoOperacion: 'N/A',
            ownerAnterior: 'Sin Propietario',
            nuevoOwner: 'Sin Nuevo Propietario',
            to: 'to',
            idTransaccion: 'Sin ID',
          };
        }

        try {
          // Consultar detalles de la transacción en BigchainDB
          const transactionResponse = await fetch(
            `http://192.168.1.100:9984/api/v1/transactions/${row.transaction_id}`
          );
          const transactionDetails = await transactionResponse.json();

          // Consultar bloque asociado
          const blockResponse = await fetch(
            `http://192.168.1.100:9984/api/v1/blocks?transaction_id=${row.transaction_id}`
          );
          const blockData = await blockResponse.json();
          const blockId = blockData.length > 0 ? blockData[0] : 'Sin Bloque';

          // Formatear fecha
          const formatTimestamp = (timestamp) => {
            const date = new Date(timestamp);
            const options = {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            };
            return date.toLocaleString('es-ES', options);
          };

          return {
            firma: shortenHash(transactionDetails.inputs[0]?.fulfillment) || 'Sin Firma',
            bloque: blockId,
            fecha: formatTimestamp(transactionDetails.asset.data.timestamp || transactionDetails.timestamp),
            tipoOperacion: transactionDetails.operation || 'N/A',
            ownerAnterior: shortenHash(transactionDetails.inputs[0]?.owners_before[0]) || 'Sin Propietario',
            nuevoOwner: shortenHash(transactionDetails.outputs[0]?.public_keys[0]) || 'Sin Nuevo Propietario',
            to: 'to',
            idTransaccion: shortenHash(transactionDetails.id),
          };
        } catch (error) {
          console.error(`Error al procesar transacción con ID ${row.transaction_id}:`, error);
          return {
            firma: shortenHash(row.transaction_id) || 'Error al obtener firma',
            bloque: 'Error al obtener bloque',
            fecha: row.created_at || new Date().toISOString(),
            tipoOperacion: 'Error',
            ownerAnterior: 'Error',
            nuevoOwner: 'Error',
            to: 'to',
            idTransaccion: shortenHash(row.transaction_id) || 'Sin ID',
          };
        }
      })
    );

    res.json(transactions);
  });
});

// Servir archivos estáticos desde el directorio "public"
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor API REST ejecutándose en http://localhost:3000');
});