
# **Proyecto API REST con MySQL y BigchainDB**

## **Descripción**

Este proyecto es una API REST diseñada para integrar una base de datos relacional **MySQL** con **BigchainDB**, proporcionando almacenamiento rápido y seguro combinado con **inmutabilidad** y **trazabilidad**. Es ideal para aplicaciones donde la integridad y la autenticidad de los datos son fundamentales, como trazabilidad de la cadena de suministro, auditorías, registros académicos, y más.  

---

## **Arquitectura del Proyecto**

### **Componentes Principales**

1. **API REST (Node.js + Express):**

   - Proporciona endpoints para crear y validar registros.

   - Gestiona la conexión con MySQL y BigchainDB.

   - Cifra y descifra datos sensibles.

  

2. **Base de Datos Relacional (MySQL):**

   - Almacena datos estructurados.

   - Permite consultas rápidas y soporte para relaciones entre tablas.

  

3. **BigchainDB:**

   - Garantiza la **inmutabilidad** de los datos al registrar transacciones y hashes.

   - Integra un sistema basado en Tendermint para tolerancia a fallos.

  

4. **Docker:**

   - Gestiona la infraestructura mediante contenedores para:

     - MySQL.

     - BigchainDB.

     - MongoDB (backend de BigchainDB).

     - Tendermint.

  
---

  

## **Flujo de Datos**

1. **Inserción de Datos:**

   - Un cliente realiza una solicitud `POST` a la API REST.

   - Los datos se validan y se almacenan en MySQL.

   - Se genera un hash del registro y se guarda como una transacción en BigchainDB.

   - El ID de la transacción se actualiza en MySQL para referencia futura.

  

2. **Validación de Datos:**

   - Los datos almacenados en MySQL se comparan con el hash registrado en BigchainDB para garantizar su integridad.

  

3. **Cifrado y Descifrado:**

   - Los datos pueden cifrarse antes de almacenarse y solo usuarios autorizados pueden descifrarlos.
  

---
  

## **Tecnologías Empleadas**

- **Node.js**: Para implementar la API REST.

- **Express**: Framework para manejar rutas y middleware.

- **MySQL**: Base de datos relacional para almacenamiento de datos estructurados.

- **BigchainDB**: Base de datos distribuida para garantizar la inmutabilidad y trazabilidad.

- **Docker**: Contenedores para gestionar la infraestructura.

- **Joi**: Validación de datos del lado del servidor.

- **Crypto (Node.js)**: Para cifrar, descifrar y generar hashes.

- **Tendermint**: Consenso tolerante a fallos para BigchainDB.


---


## **Endpoints Principales**

1. **`POST /create_transaction`**:

   - Crea un registro en MySQL y una transacción en BigchainDB.

   - Devuelve el ID de la transacción generada.

  

2. **`GET /validate/:id`**:

   - Valida la integridad de un registro de MySQL comparándolo con su transacción en BigchainDB.

  

3. **`GET /get_transaction/:transactionId`**:

   - Obtiene y descifra datos asociados a una transacción específica en BigchainDB.

  

---

  

## **Requisitos**

1. **Node.js** v14 o superior.

2. **Docker** (con MySQL, BigchainDB, MongoDB y Tendermint configurados).

3. Archivo `.env` con las siguientes configuraciones:

   ```env

   DB_HOST=tu_servidor_mysql

   DB_USER=tu_usuario_mysql

   DB_PASSWORD=tu_contraseña_mysql

   DB_NAME=tu_basededatos

   BDB_API_URL=http://tu_servidor_bigchaindb:9984/api/v1/

   ```

  

---

  

## **Cómo Ejecutar**

1. **Instalar dependencias**:

   ```bash

   npm install

   ```

  

2. **Iniciar el servidor**:

   ```bash

   node index.js

   ```

  

3. **Probar los endpoints** con herramientas como Postman o cURL.

  

---

  

## **Licencia**

Este proyecto se distribuye bajo la licencia [MIT](LICENSE).
