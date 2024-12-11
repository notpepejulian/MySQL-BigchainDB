const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');  // Importa el paquete cors

const app = express();
const port = 3001;

// Habilitar CORS para todas las rutas y orígenes
app.use(cors());

// Middleware para servir archivos estáticos de la carpeta 'network'
app.use('/network', express.static(path.join(__dirname, 'network')));

// Endpoint para obtener las métricas
app.get('/metrics', (req, res) => {
    exec('curl -s http://192.168.1.100:9100/metrics', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al ejecutar curl: ${error.message}`);
            return res.status(500).send(`Error al ejecutar curl: ${error.message}`);
        }
        if (stderr) {
            console.error(`Error en stderr: ${stderr}`);
            return res.status(500).send(`Error en stderr: ${stderr}`);
        }

        if (!stdout) {
            console.error('No se recibió ningún dato de Prometheus');
            return res.status(500).send('No se recibió ningún dato de Prometheus');
        }

        try {
            const metrics = parseMetrics(stdout);
            res.json(metrics);
        } catch (err) {
            console.error('Error al procesar las métricas:', err);
            return res.status(500).send(`Error al procesar las métricas: ${err.message}`);
        }
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}/metrics`);
});

// Función para procesar las métricas
function parseMetrics(data) {
    const lines = data.split('\n');
    const metrics = {
        labels: [],
        values: []
    };

    lines.forEach(line => {
        const metricRegex = /^([a-zA-Z0-9_]+)\{(.*?)\}\s+([0-9.]+)$/;
        const match = line.match(metricRegex);

        if (match) {
            const metricName = match[1];
            const labels = match[2];
            const value = parseFloat(match[3]);

            metrics.labels.push(`${metricName} {${labels}}`);
            metrics.values.push(value);
        }
    });

    return metrics;
}

