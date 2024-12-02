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

// Mostrar las transacciones en la tabla con desplegables
function displayTransactions(transactions, page, rows) {
  const tableBody = document.getElementById('transaction-table-body');
  tableBody.innerHTML = '';
  const start = (page - 1) * rows;
  const end = start + rows;
  const paginatedItems = transactions.slice(start, end);

  paginatedItems.forEach((transaction) => {
    const shortenedId = `${transaction.idTransaccion.slice(0, 8)}...${transaction.idTransaccion.slice(-8)}`;
    const shortenedBlock = transaction.bloque !== 'Sin Bloque' ? `${transaction.bloque}` : 'Sin Bloque';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.firma}</td>
      <td>${transaction.bloque}</td>
      <td>${transaction.fecha}</td>
      <td>${transaction.tipoOperacion}</td>
      <td>${transaction.ownerAnterior}</td>
      <td>${transaction.to}</td>
      <td>${transaction.nuevoOwner}</td>
      <td>
        <span class="transaction-id" data-id="${transaction.idTransaccion}">
          ${shortenedId}
        </span>
      </td>
    `;
    tableBody.appendChild(row);
  });
}



// Cambiar entre temas de color
const themeToggle = document.getElementById('theme-toggle'); // seleccionar el boton del tema
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  themeToggle.classList.toggle('dark'); 
});

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
