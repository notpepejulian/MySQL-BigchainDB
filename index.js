require('dotenv').config();
const mysql = require('mysql2');
const express = require('express');
const BigchainDB = require('bigchaindb-driver');
const bip39 = require('bip39');
const crypto = require('crypto');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const path = require('path');
const Joi = require('joi'); // Validación de datos

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

// Configuración de BigchainDB
const bdb = new BigchainDB.Connection(process.env.BDB_API_URL);

// Generar claves para BigchainDB
const seed = process.env.BDB_SEED || bip39.generateMnemonic();
const alice = new BigchainDB.Ed25519Keypair(bip39.mnemonicToSeedSync(seed).slice(0, 32));

// Función para acortar hashes (formato xxxx...xxxx)
const shortenHash = (hash) => {
  if (!hash || hash.length < 8) return hash;
  return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
};

// Función para formatear la fecha
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

// Endpoint raíz
app.get('/', (req, res) => {
  res.send('Bienvenido a la API REST de BigchainDB');
});

// **INSERT**: Crear nueva transacción
app.post('/create_transaction', async (req, res) => {
  const dataSchema = Joi.object({
    campo1: Joi.string().required(),
    campo2: Joi.string().required(),
  });

  const { error } = dataSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { campo1, campo2 } = req.body;

  try {
    // Insertar en MySQL
    const sql = `
      INSERT INTO tabla_test (campo1, campo2, transaction_id, operation_type, created_at)
      VALUES (?, ?, ?, 'CREATE', CURRENT_TIMESTAMP)`;
    const [results] = await db.promise().query(sql, [campo1, campo2, crypto.randomUUID()]);

    const assetData = { campo1, campo2, timestamp: new Date().toISOString() };
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(assetData)).digest('hex');

    // Crear transacción en BigchainDB
    const tx = BigchainDB.Transaction.makeCreateTransaction(
      { dataHash, ...assetData },
      null,
      [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(alice.publicKey))],
      alice.publicKey
    );

    const signedTx = BigchainDB.Transaction.signTransaction(tx, alice.privateKey);

    await bdb.postTransactionCommit(signedTx);

    // Actualizar `transaction_id` en MySQL
    const updateSql = `
      UPDATE tabla_test SET transaction_id = ? WHERE id = ?`;
    await db.promise().query(updateSql, [signedTx.id, results.insertId]);

    res.status(201).json({
      message: 'Datos insertados en MySQL y transacción creada en BigchainDB',
      transactionId: signedTx.id,
    });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ error: 'Error al crear transacción' });
  }
});


// Endpoint para el update
app.put('/update_transaction/:id', async (req, res) => {
  const { id } = req.params;
  const { campo1, campo2 } = req.body;

  if (!campo1 || !campo2) {
    return res.status(400).json({ error: 'Los campos campo1 y campo2 son requeridos' });
  }

  const newTransactionId = crypto.randomUUID();

  try {
    // Obtener la fila existente
    const [existingRows] = await db.promise().query('SELECT * FROM tabla_test WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const oldRow = existingRows[0];

    // Crear transacción en BigchainDB
    const assetData = { campo1, campo2, operation: 'UPDATE', timestamp: new Date().toISOString() };
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(assetData)).digest('hex');

    const tx = BigchainDB.Transaction.makeCreateTransaction(
      { dataHash, ...assetData },
      null,
      [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(alice.publicKey))],
      alice.publicKey
    );

    const signedTx = BigchainDB.Transaction.signTransaction(tx, alice.privateKey);
    await bdb.postTransactionCommit(signedTx);

    // Insertar una nueva fila en MySQL con la operación UPDATE
    const sqlInsertUpdate = `
      INSERT INTO tabla_test (campo1, campo2, transaction_id, operation_type, created_at)
      VALUES (?, ?, ?, 'UPDATE', CURRENT_TIMESTAMP)`;
    await db.promise().query(sqlInsertUpdate, [campo1, campo2, signedTx.id]);

    res.json({
      message: 'Datos actualizados y nueva transacción registrada en BigchainDB',
      transactionId: signedTx.id,
    });
  } catch (err) {
    console.error('Error al actualizar transacción:', err);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
});



// **DELETE**: Borrar una transacción existente
app.delete('/delete_transaction/:id', async (req, res) => {
  const { id } = req.params;

  const newTransactionId = crypto.randomUUID();

  try {
    // Obtener la fila existente
    const [existingRows] = await db.promise().query('SELECT * FROM tabla_test WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const { campo1, campo2 } = existingRows[0];

    // Crear transacción en BigchainDB
    const assetData = {
      campo1,
      campo2,
      operation: 'DELETE',
      timestamp: new Date().toISOString(),
    };
    const dataHash = crypto.createHash('sha256').update(JSON.stringify(assetData)).digest('hex');

    const tx = BigchainDB.Transaction.makeCreateTransaction(
      { dataHash, ...assetData },
      null,
      [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(alice.publicKey))],
      alice.publicKey
    );

    const signedTx = BigchainDB.Transaction.signTransaction(tx, alice.privateKey);
    await bdb.postTransactionCommit(signedTx);

    // Insertar una nueva fila en MySQL con la operación DELETE
    const sqlInsertDelete = `
      INSERT INTO tabla_test (campo1, campo2, transaction_id, operation_type, created_at)
      VALUES (?, ?, ?, 'DELETE', CURRENT_TIMESTAMP)`;
    await db.promise().query(sqlInsertDelete, [campo1, campo2, signedTx.id]);

    res.json({
      message: 'Datos marcados como eliminados y nueva transacción registrada en BigchainDB',
      transactionId: signedTx.id,
    });
  } catch (err) {
    console.error('Error al borrar transacción:', err);
    res.status(500).json({ error: 'Error al borrar transacción' });
  }
});

// app.get('/transactions', async (req, res) => {
//   try {
//     // Consultar los transaction_id desde MySQL
//     const sql = 'SELECT transaction_id FROM tabla_test ORDER BY created_at DESC';
//     const [mysqlTransactions] = await db.promise().query(sql);

//     // Si no hay transacciones en MySQL, devolver vacío
//     if (!mysqlTransactions || mysqlTransactions.length === 0) {
//       return res.json([]);
//     }

//     // Obtener detalles de las transacciones desde BigchainDB
//     const transactions = await Promise.all(
//       mysqlTransactions.map(async (row) => {
//         if (!row.transaction_id) {
//           return {
//             firma: 'Sin Firma',
//             bloque: 'Sin Bloque',
//             fecha: 'Sin Fecha',
//             tipoOperacion: 'N/A',
//             ownerAnterior: 'Sin Propietario',
//             nuevoOwner: 'Sin Nuevo Propietario',
//             to: 'to',
//             idTransaccion: 'Sin ID',
//           };
//         }

//         try {
//           // Consultar la transacción en BigchainDB por su ID
//           const transactionResponse = await fetch(
//             `http://192.168.1.100:9984/api/v1/transactions/${row.transaction_id}`
//           );
//           const transactionDetails = await transactionResponse.json();

//           // Consultar bloque asociado a la transacción
//           const blockResponse = await fetch(
//             `http://192.168.1.100:9984/api/v1/blocks?transaction_id=${row.transaction_id}`
//           );
//           const blockData = await blockResponse.json();
//           const blockId = blockData.length > 0 ? blockData[0] : 'Sin Bloque';

//           // Formatear la transacción para el explorador
//           return {
//             firma: shortenHash(transactionDetails.inputs[0]?.fulfillment) || 'Sin Firma',
//             bloque: blockId,
//             fecha: formatTimestamp(transactionDetails.asset.data.timestamp || transactionDetails.timestamp),
//             tipoOperacion: transactionDetails.operation.toUpperCase(),
//             ownerAnterior: shortenHash(transactionDetails.inputs[0]?.owners_before[0]) || 'Sin Propietario',
//             nuevoOwner: shortenHash(transactionDetails.outputs[0]?.public_keys[0]) || 'Sin Nuevo Propietario',
//             to: 'to',
//             idTransaccion: shortenHash(transactionDetails.id),
//           };
//         } catch (error) {
//           console.error(`Error al obtener transacción con ID ${row.transaction_id}:`, error);
//           return {
//             firma: 'Error',
//             bloque: 'Error',
//             fecha: 'Error',
//             tipoOperacion: 'Error',
//             ownerAnterior: 'Error',
//             nuevoOwner: 'Error',
//             to: 'Error',
//             idTransaccion: 'Error',
//           };
//         }
//       })
//     );

//     res.json(transactions);
//   } catch (error) {
//     console.error('Error al obtener las transacciones:', error);
//     res.status(500).json({ error: 'Error al obtener las transacciones' });
//   }
// });

app.get('/transactions', async (req, res) => {
  try {
    // Consultar los transaction_id y operation_type desde MySQL
    const sql = 'SELECT transaction_id, operation_type FROM tabla_test ORDER BY created_at DESC';
    const [mysqlTransactions] = await db.promise().query(sql);

    // Si no hay transacciones en MySQL, devolver vacío
    if (!mysqlTransactions || mysqlTransactions.length === 0) {
      return res.json([]);
    }

    // Obtener detalles de las transacciones desde BigchainDB
    const transactions = await Promise.all(
      mysqlTransactions.map(async (row) => {
        if (!row.transaction_id) {
          return {
            firma: 'Sin Firma',
            bloque: 'Sin Bloque',
            fecha: 'Sin Fecha',
            tipoOperacion: row.operation_type || 'N/A', // Tomar el operation_type desde MySQL
            ownerAnterior: 'Sin Propietario',
            nuevoOwner: 'Sin Nuevo Propietario',
            to: 'to',
            idTransaccion: 'Sin ID',
          };
        }

        try {
          // Consultar la transacción en BigchainDB por su ID
          const transactionResponse = await fetch(
            `http://192.168.1.100:9984/api/v1/transactions/${row.transaction_id}`
          );
          const transactionDetails = await transactionResponse.json();

          // Consultar bloque asociado a la transacción
          const blockResponse = await fetch(
            `http://192.168.1.100:9984/api/v1/blocks?transaction_id=${row.transaction_id}`
          );
          const blockData = await blockResponse.json();
          const blockId = blockData.length > 0 ? blockData[0] : 'Sin Bloque';

          // Formatear la transacción para el explorador
          return {
            firma: shortenHash(transactionDetails.inputs[0]?.fulfillment) || 'Sin Firma',
            bloque: blockId,
            fecha: formatTimestamp(transactionDetails.asset.data.timestamp || transactionDetails.timestamp),
            tipoOperacion: row.operation_type.toUpperCase(), // Usar el operation_type desde MySQL
            ownerAnterior: shortenHash(transactionDetails.inputs[0]?.owners_before[0]) || 'Sin Propietario',
            nuevoOwner: shortenHash(transactionDetails.outputs[0]?.public_keys[0]) || 'Sin Nuevo Propietario',
            to: 'to',
            idTransaccion: shortenHash(transactionDetails.id),
          };
        } catch (error) {
          console.error(`Error al obtener transacción con ID ${row.transaction_id}:`, error);
          return {
            firma: 'Error',
            bloque: 'Error',
            fecha: 'Error',
            tipoOperacion: row.operation_type || 'Error',
            ownerAnterior: 'Error',
            nuevoOwner: 'Error',
            to: 'Error',
            idTransaccion: 'Error',
          };
        }
      })
    );

    res.json(transactions);
  } catch (error) {
    console.error('Error al obtener las transacciones:', error);
    res.status(500).json({ error: 'Error al obtener las transacciones' });
  }
});


// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor API REST ejecutándose en http://localhost:3000');
});