document.addEventListener('DOMContentLoaded', () => {
  const apiUrl = 'http://localhost:3000';
  const forms = {
      insert: document.getElementById('create-form'),
      update: document.getElementById('update-form'),
      delete: document.getElementById('delete-form'),
  };

  const buttons = {
      insert: document.getElementById('insert-button'),
      update: document.getElementById('update-button'),
      delete: document.getElementById('delete-button'),
  };

  const operationSummary = document.getElementById('operation-summary');

  // Mostrar el formulario correspondiente
  Object.keys(buttons).forEach((key) => {
      buttons[key].addEventListener('click', () => {
          Object.values(forms).forEach((form) => form.classList.remove('active'));
          forms[key].classList.add('active');
      });
  });

  function showSummary({ id, transactionId, operationType, campo1, campo2 }) {
      document.getElementById('summary-id').textContent = id || 'N/A';
      const transactionLink = `<a href="http://localhost:3000/txs/transactions.html" target="_blank" style="color: #00b78f; text-decoration: none;">${transactionId}</a>`;
      document.getElementById('summary-transaction-id').innerHTML = transactionLink || 'N/A';
      document.getElementById('summary-operation-type').textContent = operationType || 'N/A';
      document.getElementById('summary-campo1').textContent = campo1 || 'N/A';
      document.getElementById('summary-campo2').textContent = campo2 || 'N/A';
      document.getElementById('summary-table').textContent = 'tabla_test';
      operationSummary.style.display = 'block';
  }

  // Función para cargar transacciones
  async function loadTransactions() {
      try {
          const tableBody = document.querySelector('#transactions-table tbody');
          
          // Verificar si el elemento existe
          if (!tableBody) {
              console.error("El elemento 'tableBody' no se encuentra en el DOM.");
              return;
          }

          const response = await fetch(`${apiUrl}/transactions`);
          if (!response.ok) {
              throw new Error('No se pudieron cargar las transacciones.');
          }

          const transactions = await response.json();
          tableBody.innerHTML = transactions.map(tx => `
              <tr>
                  <td>${tx.idTransaccion}</td>
                  <td>${tx.campo1 || 'N/A'}</td>
                  <td>${tx.campo2 || 'N/A'}</td>
                  <td>${tx.tipoOperacion}</td>
                  <td>${tx.fecha}</td>
              </tr>
          `).join('');
      } catch (error) {
          console.error('Error al cargar transacciones:', error);
      }
  }

  // Crear transacción
  forms.insert.addEventListener('submit', async (e) => {
      e.preventDefault();
      const campo1 = document.getElementById('campo1').value;
      const campo2 = document.getElementById('campo2').value;

      try {
          const response = await fetch(`${apiUrl}/create_transaction`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campo1, campo2 }),
          });
          const result = await response.json();
          alert(result.message || 'Transacción creada');
          showSummary({
              id: result.id, // ID devuelto por MySQL
              transactionId: result.transactionId,
              operationType: 'INSERT',
              campo1,
              campo2,
          });
          loadTransactions();
      } catch (error) {
          console.error('Error al crear transacción:', error);
      }
  });

  // Actualizar transacción
  forms.update.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('update-id').value;
      const campo1 = document.getElementById('update-campo1').value;
      const campo2 = document.getElementById('update-campo2').value;

      try {
          const response = await fetch(`${apiUrl}/update_transaction/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ campo1, campo2 }),
          });
          const result = await response.json();
          alert(result.message || 'Transacción actualizada');
          showSummary({
              id, // ID de MySQL
              transactionId: result.transactionIdAfter,
              operationType: 'UPDATE',
              campo1,
              campo2,
          });
          loadTransactions();
      } catch (error) {
          console.error('Error al actualizar transacción:', error);
      }
  });

  // Eliminar transacción
  forms.delete.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('delete-id').value;

      try {
          const response = await fetch(`${apiUrl}/delete_transaction/${id}`, {
              method: 'DELETE',
          });
          const result = await response.json();
          alert(result.message || 'Transacción eliminada');
          showSummary({
              id, // ID de MySQL
              transactionId: result.transactionId,
              operationType: 'DELETE',
              campo1: result.campo1,
              campo2: result.campo2,
          });
          loadTransactions();
      } catch (error) {
          console.error('Error al eliminar transacción:', error);
      }
  });

  // Cargar transacciones al cargar la página
  loadTransactions();
});
