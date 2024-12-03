let currentPage = 1;
const rowsPerPage = 20;

// Cargar las transacciones desde el servidor
async function loadTransactions() {
  try {
    const response = await fetch('http://localhost:3000/transactions');
    const transactions = await response.json();

    displayTransactions(transactions, currentPage, rowsPerPage);
    addTransactionClickListeners(); // Agregar listeners para los detalles
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
    const shortenedId = `${transaction.idTransaccion.slice(0, 8)}...${transaction.idTransaccion.slice(-8)}`;
    const shortenedBlock = transaction.bloque !== 'Sin Bloque' ? `${transaction.bloque}` : 'Sin Bloque';

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${transaction.firma}</td>
      <td>${shortenedBlock}</td>
      <td>${transaction.fecha}</td>
      <td>${transaction.tipoOperacion}</td>
      <td>${transaction.ownerAnterior}</td>
      <td>${transaction.to}</td>
      <td>${transaction.nuevoOwner}</td>
      <td><a href="#" data-id="${transaction.idTransaccion}">${shortenedId}</a></td>
    `;
    tableBody.appendChild(row);
  });
}

// Añadir evento click para expandir detalles de la transacción
function addTransactionClickListeners() {
  const links = document.querySelectorAll('#transaction-table-body a[data-id]');

  links.forEach(link => {
    link.addEventListener('click', async (event) => {
      event.preventDefault();

      const transactionId = link.dataset.id;
      const row = link.closest('tr');
      const existingDetailsRow = row.nextElementSibling;

      // Si ya existe un detalle abierto, lo cerramos
      if (existingDetailsRow && existingDetailsRow.classList.contains('details-row')) {
        existingDetailsRow.remove();
        return;
      }

      // Crear fila para mostrar detalles
      const detailsRow = document.createElement('tr');
      detailsRow.classList.add('details-row');

      try {
        const transactionData = await fetch(`http://192.168.1.100:9984/api/v1/transactions/${transactionId}`).then(res => res.json());
        const blockData = await fetch(`http://192.168.1.100:9984/api/v1/blocks?transaction_id=${transactionId}`).then(res => res.json());
        const validatorData = await fetch(`http://192.168.1.100:9984/api/v1/validators?transaction_id=${transactionId}`).then(res => res.json());
        console.log(validatorData);

        const metadata = transactionData.asset?.data || {};
        const fulfillment = transactionData.inputs[0]?.fulfillment || 'Sin Firma';
        const blockId = blockData.length > 0 ? blockData[0] : 'Sin Bloque';
        const timestamp = transactionData.asset?.data?.timestamp || 'Sin Fecha';
        const validator = validatorData[0]?.public_key?.value || 'Sin Validador';
        const estado = 'Transacción Correcta, Validada <i class="fa-solid fa-file-signature"></i>';

        detailsRow.innerHTML = `
          <td colspan="8">
            <div>
              <h3>Información de la Transacción</h3>
              <h5>${fulfillment}</h5>
              <hr>
              <h4>Bloque y TimeStamp: ${blockId} | ${timestamp}</h4>
              <h4>Validador: ${validator}</h4>
              <h4>Estado de transacción: ${estado}</h4>
              <hr>
              <h3>Datos:</h3>
              <pre>${JSON.stringify(metadata, null, 2)}</pre>
            </div>
          </td>
        `;

        row.insertAdjacentElement('afterend', detailsRow);
      } catch (error) {
        console.error('Error al cargar detalles de la transacción:', error);
      }
    });
  });
}

// Cambiar entre temas de color
const themeToggle = document.getElementById('theme-toggle'); // seleccionar el botón del tema
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

