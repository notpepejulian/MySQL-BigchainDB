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

    // Crear transacción en BigchainDB para la operación INSERT
    const tx = BigchainDB.Transaction.makeCreateTransaction(
      { dataHash, ...assetData },
      null,
      [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(alice.publicKey))],
      alice.publicKey
    );

    const signedTx = BigchainDB.Transaction.signTransaction(tx, alice.privateKey);
    await bdb.postTransactionCommit(signedTx);  // Registrar la transacción en BigchainDB

    // Insertar la transacción en la tabla 'bigchain_transactions'
    const sqlInsertBigchainTransaction = `
      INSERT INTO bigchain_transactions (transaction_id, operation_type, campo1, campo2)
      VALUES (?, 'CREATE', ?, ?)`;
    await db.promise().query(sqlInsertBigchainTransaction, [signedTx.id, campo1, campo2]);

    // Actualizar `transaction_id` en MySQL
    const updateSql = `
      UPDATE tabla_test SET transaction_id = ? WHERE id = ?`;
    await db.promise().query(updateSql, [signedTx.id, results.insertId]);

    res.status(201).json({
      message: 'Datos insertados.',
      transactionId: signedTx.id,
      id: results.insertId,
    });
  } catch (err) {
    console.error('Error al crear transacción:', err);
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

  const newTransactionId = crypto.randomUUID();  // Crear un nuevo ID para la transacción

  try {
    const [existingRows] = await db.promise().query('SELECT * FROM tabla_test WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const oldRow = existingRows[0];

    // Crear transacción en BigchainDB
    const assetDataBefore = {
      campo1: oldRow.campo1,
      campo2: oldRow.campo2,
      operation: 'UPDATE (Antes)',
      timestamp: new Date().toISOString(),
    };

    const assetDataAfter = {
      campo1,
      campo2,
      operation: 'UPDATE (Después)',
      timestamp: new Date().toISOString(),
    };

    const dataHashBefore = crypto.createHash('sha256').update(JSON.stringify(assetDataBefore)).digest('hex');
    const dataHashAfter = crypto.createHash('sha256').update(JSON.stringify(assetDataAfter)).digest('hex');

    const txBefore = BigchainDB.Transaction.makeCreateTransaction(
      { dataHash: dataHashBefore, ...assetDataBefore },
      null,
      [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(alice.publicKey))],
      alice.publicKey
    );

    const txAfter = BigchainDB.Transaction.makeCreateTransaction(
      { dataHash: dataHashAfter, ...assetDataAfter },
      null,
      [BigchainDB.Transaction.makeOutput(BigchainDB.Transaction.makeEd25519Condition(alice.publicKey))],
      alice.publicKey
    );

    const signedTxBefore = BigchainDB.Transaction.signTransaction(txBefore, alice.privateKey);
    const signedTxAfter = BigchainDB.Transaction.signTransaction(txAfter, alice.privateKey);

    await bdb.postTransactionCommit(signedTxBefore);
    await bdb.postTransactionCommit(signedTxAfter);

    // Guardar las transacciones en la tabla 'bigchain_transactions'
    // const sqlInsertBefore = `
    //   INSERT INTO bigchain_transactions (transaction_id, operation_type, campo1, campo2)
    //   VALUES (?, 'UPDATE (Anterior)', ?, ?)`;
    // await db.promise().query(sqlInsertBefore, [signedTxBefore.id, oldRow.campo1, oldRow.campo2]);

    const sqlInsertAfter = `
      INSERT INTO bigchain_transactions (transaction_id, operation_type, campo1, campo2)
      VALUES (?, 'UPDATE', ?, ?)`;
    await db.promise().query(sqlInsertAfter, [signedTxAfter.id, campo1, campo2]);

    // Actualizar el registro en MySQL
    const updateSql = `
      UPDATE tabla_test
      SET campo1 = ?, campo2 = ?, transaction_id = ?, operation_type = 'UPDATE', created_at = CURRENT_TIMESTAMP
      WHERE id = ?`;
    await db.promise().query(updateSql, [campo1, campo2, signedTxAfter.id, id]);

    res.json({
      message: 'Datos actualizados.',
      transactionIdAfter: signedTxAfter.id,
      id,
    });
  } catch (err) {
    console.error('Error al actualizar transacción:', err);
    res.status(500).json({ error: 'Error al actualizar transacción' });
  }
});


// **DELETE**: Borrar una transacción existente
app.delete('/delete_transaction/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [existingRows] = await db.promise().query('SELECT * FROM tabla_test WHERE id = ?', [id]);
    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    const { campo1, campo2 } = existingRows[0];

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

    // Guardar la transacción en la tabla bigchain_transactions
    const sqlInsertBigchainTransaction = `
      INSERT INTO bigchain_transactions (transaction_id, operation_type, campo1, campo2)
      VALUES (?, 'DELETE', ?, ?)`;
    await db.promise().query(sqlInsertBigchainTransaction, [signedTx.id, campo1, campo2]);

    // Eliminar el registro en MySQL
    const sqlDelete = `DELETE FROM tabla_test WHERE id = ?`;
    await db.promise().query(sqlDelete, [id]);

    res.json({
      message: 'Datos eliminados.',
      transactionId: signedTx.id,
      id, // ID de la fila eliminada en MySQL
      campo1, // Campo 1 de la fila eliminada
      campo2, // Campo 2 de la fila eliminada
    });
  } catch (err) {
    console.error('Error al borrar transacción:', err);
    res.status(500).json({ error: 'Error al borrar transacción' });
  }
});


app.get('/transactions', async (req, res) => {
  try {
    // Obtener todas las transacciones de la tabla 'bigchain_transactions'
    const sql = 'SELECT * FROM bigchain_transactions ORDER BY created_at DESC';
    const [bigchainTransactions] = await db.promise().query(sql);

    if (!bigchainTransactions || bigchainTransactions.length === 0) {
      return res.json([]);  // Si no hay transacciones, devolver una lista vacía
    }

    const transactions = await Promise.all(
      bigchainTransactions.map(async (row) => {
        try {
          const transactionResponse = await fetch(
            `http://192.168.1.100:9984/api/v1/transactions/${row.transaction_id}`
          );
          const transactionDetails = await transactionResponse.json();

          // Obtener el bloque utilizando la API de BigchainDB
          const blockResponse = await fetch(
            `http://192.168.1.100:9984/api/v1/blocks?transaction_id=${row.transaction_id}`
          );
          const blockData = await blockResponse.json();

          // Si no hay bloques asociados, asignar 'Sin Bloque'
          const blockId = blockData.length > 0 ? blockData[0].id : 'Sin Bloque';

          return {
            firma: shortenHash(transactionDetails.inputs[0]?.fulfillment) || 'Sin Firma',  // Acortar la firma
            bloque: blockData.length > 0 ? blockData[0] : 'Sin Bloque',  // Asignar el bloque correctamente
            fecha: formatTimestamp(transactionDetails.asset.data.timestamp || transactionDetails.timestamp),
            tipoOperacion: row.operation_type.toUpperCase(),
            ownerAnterior: shortenHash(transactionDetails.inputs[0]?.owners_before[0]) || 'Sin Propietario',  // Owner anterior
            nuevoOwner: shortenHash(transactionDetails.outputs[0]?.public_keys[0]) || 'Sin Nuevo Propietario',  // Nuevo owner
            to: 'to',
            idTransaccion: row.transaction_id,  // El ID de la transacción en BigchainDB
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
            idTransaccion: row.transaction_id,
          };
        }
      })
    );

    res.json(transactions);  // Devolver la lista de transacciones con todos los detalles
  } catch (error) {
    console.error('Error al obtener las transacciones:', error);
    res.status(500).json({ error: 'Error al obtener las transacciones' });
  }
});


// Servir archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Iniciar servidor
app.listen(3000, () => {
  console.log('Servidor API REST ejecutándose en http://localhost:3000');
});