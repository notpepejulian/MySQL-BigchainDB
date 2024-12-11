require('dotenv').config(); // Cargar variables de entorno desde .env
const fs = require('fs');
const path = require('path');
const BigchainDB = require('bigchaindb-driver');
const bip39 = require('bip39'); // Para generar frases mnemotécnicas
const crypto = require('crypto'); // Para cifrado RSA

// Ruta del archivo .env
const envFilePath = path.resolve(__dirname, '.env');

// Función para guardar claves en el archivo .env
function updateEnvFile(updates) {
  const existingEnv = fs.existsSync(envFilePath) ? fs.readFileSync(envFilePath, 'utf8') : '';
  const updatedEnv = existingEnv + updates.join('\n') + '\n';
  fs.writeFileSync(envFilePath, updatedEnv, 'utf8');
}

// Generar claves BigchainDB y RSA si no existen
let seed = process.env.BDB_SEED;
let privateKey = process.env.BDB_PRIVATE_KEY;
let publicKey = process.env.BDB_PUBLIC_KEY;
let userPublicKey = process.env.USER_PUBLIC_KEY;
let userPrivateKey = process.env.USER_PRIVATE_KEY;

if (!seed || !privateKey || !publicKey) {
  console.log('Generando claves BigchainDB...');
  seed = bip39.generateMnemonic();
  const alice = new BigchainDB.Ed25519Keypair(bip39.mnemonicToSeedSync(seed).slice(0, 32));
  privateKey = alice.privateKey;
  publicKey = alice.publicKey;

  const updates = [
    `BDB_SEED="${seed}"`,
    `BDB_PRIVATE_KEY="${privateKey}"`,
    `BDB_PUBLIC_KEY="${publicKey}"`,
  ];
  updateEnvFile(updates);
}

if (!userPublicKey || !userPrivateKey) {
  console.log('Generando claves RSA para cifrado...');
  const { publicKey: rsaPublicKey, privateKey: rsaPrivateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048, // Longitud de la clave
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  userPublicKey = rsaPublicKey;
  userPrivateKey = rsaPrivateKey;

  const updates = [
    `USER_PUBLIC_KEY="${userPublicKey.replace(/\n/g, '\\n')}"`,
    `USER_PRIVATE_KEY="${userPrivateKey.replace(/\n/g, '\\n')}"`,
  ];
  updateEnvFile(updates);
}

console.log('Claves cargadas o generadas:');
console.log('Frase mnemotécnica:', seed);
console.log('Clave privada BigchainDB:', privateKey);
console.log('Clave pública BigchainDB:', publicKey);
console.log('Clave pública RSA:', userPublicKey);
console.log('Clave privada RSA:', userPrivateKey);

// Exportar claves para usarlas en el middleware
module.exports = { seed, privateKey, publicKey, userPublicKey, userPrivateKey };
