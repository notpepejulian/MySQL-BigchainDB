---

# **Proyecto API REST con MySQL y BigchainDB**

### **Requisito Previo: Instalación de Drivers de BigchainDB**
Este proyecto requiere la instalación de los drivers de BigchainDB para interactuar con la base de datos distribuida. Elegir entre los drivers para **JavaScript** o **Python**, según necesidades.

#### **Drivers BigchainDB:**
- **JavaScript**: [Repositorio oficial de BigchainDB para JavaScript](https://github.com/bigchaindb/js-bigchaindb-driver)
- **Python**: [Repositorio oficial de BigchainDB para Python](https://github.com/bigchaindb/bigchaindb-driver)

#### **Instalación de Drivers:**

- **Para JavaScript (usado en este proyecto):**
  ```bash
  npm install bigchaindb-driver
  ```

- **Para Python:**
  ```bash
  pip install bigchaindb-driver
  ```

![image](https://github.com/user-attachments/assets/7041a336-7c8b-4e64-be46-58bcd4098513)


---

### **Descripción**
Este proyecto es una API REST diseñada para integrar una base de datos relacional **MySQL** con **BigchainDB**, proporcionando almacenamiento rápido y seguro combinado con inmutabilidad y trazabilidad. Es ideal para aplicaciones donde la integridad y la autenticidad de los datos son fundamentales, como:
- Trazabilidad de la cadena de suministro.
- Auditorías.
- Registros académicos.
- Y más.

---

## **Arquitectura del Proyecto**

### **Componentes Principales**
#### **API REST (Node.js + Express)**
- Proporciona endpoints para crear y validar registros.
- Gestiona la conexión con MySQL y BigchainDB.
- Cifra y descifra datos sensibles.

#### **Base de Datos Relacional (MySQL)**
- Almacena datos estructurados.
- Permite consultas rápidas y soporte para relaciones entre tablas.

#### **BigchainDB**
- Garantiza la inmutabilidad de los datos al registrar transacciones y hashes.
- Integra un sistema basado en **Tendermint** para tolerancia a fallos.

#### **Docker**
- Gestiona la infraestructura mediante contenedores para:
  - **MySQL**
  - **BigchainDB**
  - **MongoDB** (backend de BigchainDB)
  - **Tendermint**

---

## **Flujo de Datos**

### **Inserción de Datos**
1. Un cliente realiza una solicitud `POST` a la API REST.
2. Los datos se validan y se almacenan en **MySQL**.
3. Se genera un **hash** del registro y se guarda como una transacción en **BigchainDB**.
4. El ID de la transacción se actualiza en MySQL para referencia futura.

### **Validación de Datos**
- Los datos almacenados en **MySQL** se comparan con el hash registrado en **BigchainDB** para garantizar su integridad.

### **Cifrado y Descifrado**
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

| Método | Endpoint                         | Descripción                                                                 |
|--------|----------------------------------|-----------------------------------------------------------------------------|
| POST   | `/create_transaction`           | Crea un registro en MySQL y una transacción en BigchainDB. Devuelve el ID. |
| GET    | `/validate/:id`                 | Valida la integridad de un registro de MySQL comparándolo con BigchainDB.  |
| GET    | `/get_transaction/:transactionId` | Obtiene y descifra datos asociados a una transacción específica.            |

---

## **Requisitos**

- **Node.js v14** o superior.
- **Docker** (con MySQL, BigchainDB, MongoDB y Tendermint configurados).
- Archivo `.env` con las siguientes configuraciones:

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

3. **Probar los endpoints**:
   - Usa herramientas como **Postman** o **cURL**.

---

## **Licencia**

Este proyecto se distribuye bajo la licencia **MIT**. Consulta el archivo [LICENSE](./LICENSE) para más información.

---

## **Contribuciones**
¡Las contribuciones son bienvenidas! Si tienes ideas, mejoras o detectas algún problema, abre un **issue** o envía un **pull request**.

---

NotPepeJulian
