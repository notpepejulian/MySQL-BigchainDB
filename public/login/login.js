// Login Form Logic
document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('error-message');

    try {
        const response = await fetch('http://localhost:3000/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const result = await response.json();

        if (response.ok) {
            alert('Inicio de sesión exitoso');
            // Redirigir a la página principal o dashboard
            window.location.href = '/txs/transactions.html';
        } else {
            errorMessage.textContent = result.error || 'Error desconocido';
            errorMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        errorMessage.textContent = 'Error al conectar con el servidor';
        errorMessage.style.display = 'block';
    }
});
