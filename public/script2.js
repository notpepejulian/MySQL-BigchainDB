let currentPage = 1;
const rowsPerPage = 20;

// Cargar las transacciones desde el servidor
async function loadTransactions() {
  try {
    const response = await fetch('http://localhost:3000/transactions');
    const transactions = await response.json();

    displayTransactions(transactions, currentPage, rowsPerPage);
    setupPagination(transactions.length, rowsPerPage);
  } catch (error) {
    console.error('Error al cargar las transacciones:', error);
  }
}

// Mostrar las transacciones en la tabla
function displayTransactions(transactions, page, rows) {
  const tableBody = document.getElementById('transaction-table-body');
  tableBody.innerHTML = '';
  const start = (page - 1) * rows;
  const end = start + rows;
  const paginatedItems = transactions.slice(start, end);

  paginatedItems.forEach((transaction) => {
    const shortenedId =
      transaction.idTransaccion && transaction.idTransaccion !== 'Sin ID'
        ? `${transaction.idTransaccion.slice(0, 8)}...${transaction.idTransaccion.slice(-8)}`
        : 'Sin ID';
    const shortenedBlock =
      transaction.bloque && transaction.bloque !== 'Sin Bloque' ? `${transaction.bloque}` : 'Sin Bloque';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.firma || 'Sin Firma'}</td>
      <td>${shortenedBlock}</td>
      <td>${transaction.fecha || 'Fecha desconocida'}</td>
      <td>${transaction.tipoOperacion || 'N/A'}</td>
      <td>${transaction.ownerAnterior || 'Sin Propietario'}</td>
      <td>${transaction.to || 'to'}</td>
      <td>${transaction.nuevoOwner || 'Sin Nuevo Propietario'}</td>
      <td>
        ${
          transaction.idTransaccion && transaction.idTransaccion !== 'Sin ID'
            ? `<a href="http://192.168.1.100:9984/api/v1/transactions/${transaction.idTransaccion}" target="_blank">${shortenedId}</a>`
            : 'Sin ID'
        }
      </td>
    `;
    tableBody.appendChild(row);
  });
}


// Configurar la paginación
function setupPagination(totalItems, rowsPerPage) {
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const currentPageElement = document.getElementById('current-page');
  currentPageElement.textContent = `Page ${currentPage} of ${totalPages}`;

  document.getElementById('prev-page').onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      loadTransactions();
    }
  };

  document.getElementById('next-page').onclick = () => {
    if (currentPage < totalPages) {
      currentPage++;
      loadTransactions();
    }
  };
}

// Cargar las transacciones cuando se cargue la página
window.onload = loadTransactions;
