// Función para obtener las métricas desde el servidor
async function fetchMetrics() {
    try {
        const response = await fetch('http://localhost:3001/metrics');
        const metrics = await response.json();
        createBarChart(metrics); // Crear el gráfico de barras con las métricas de la CPU
    } catch (error) {
        console.error('Error al obtener las métricas:', error);
    }
}

// Función para crear el gráfico de barras
function createBarChart(metrics) {
    const ctx = document.getElementById('metricsChart').getContext('2d');

    // Filtrar las métricas relacionadas con la CPU
    const cpuMetrics = metrics.labels
        .map((label, index) => ({
            label,
            value: metrics.values[index]
        }))
        .filter(item => item.label.toLowerCase().includes('cpu')) // Filtrar solo las métricas que contienen "cpu"
        .map(item => ({
            label: item.label,
            value: Math.min(Math.max(item.value, 1), 100) // Ajustar los valores para que estén entre 1 y 100
        }));

    // Etiquetas y valores de las métricas de la CPU
    const labels = cpuMetrics.map(item => item.label);
    const values = cpuMetrics.map(item => item.value);

    // Colores derivados de #00e8b4 (usando tonos más oscuros)
    const colors = [
        '#00e8b4', // Color original
        '#00d8a2', // Tono más oscuro
        '#00c891', // Tono más oscuro
        '#00b680', // Tono más oscuro
        '#00a36f', // Tono más oscuro
        '#00905e', // Tono más oscuro
        '#007c4d', // Tono más oscuro
        '#006b3c', // Tono más oscuro
        '#005a2b', // Tono más oscuro
        '#004920'  // Tono más oscuro
    ];

    // Configuración del gráfico de barras verticales
    const config = {
        type: 'bar', // Tipo de gráfico: barras
        data: {
            labels: labels, // Las etiquetas de las métricas de la CPU
            datasets: [{
                label: 'Métricas de CPU',
                data: values, // Los valores de las métricas de la CPU
                backgroundColor: function(ctx) {
                    const index = ctx.dataIndex % colors.length; // Seleccionar el color dependiendo del índice
                    return colors[index]; // Asignar el color correspondiente
                },
                borderColor: 'rgba(75, 192, 192, 1)', // Color del borde
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top', // Colocamos la leyenda en la parte superior
                    labels: {
                        font: {
                            size: 10 // Reducir el tamaño de la fuente de la leyenda
                        }
                    }
                },
                title: {
                    display: true, // Mostrar el título
                    text: 'Métricas de CPU', // Título del gráfico
                    font: {
                        size: 12 // Reducir el tamaño del texto del título
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Métricas', // Título del eje X
                        font: {
                            size: 10 // Reducir el tamaño de la fuente del título del eje X
                        }
                    },
                    ticks: {
                        autoSkip: true,
                        maxTicksLimit: 5 // Limitar la cantidad de etiquetas en el eje X
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valor (%)', // Título del eje Y
                        font: {
                            size: 10 // Reducir el tamaño de la fuente del título del eje Y
                        }
                    },
                    min: 1, // Mínimo valor en el eje Y
                    max: 100, // Máximo valor en el eje Y
                    beginAtZero: true, // Comenzar desde 0 en el eje Y
                    ticks: {
                        stepSize: 20, // Establecer un intervalo adecuado para el eje Y
                        font: {
                            size: 8 // Reducir el tamaño de la fuente de las etiquetas del eje Y
                        }
                    }
                }
            },
            layout: {
                padding: {
                    top: 10, // Espaciado superior reducido
                    right: 10, // Espaciado derecho reducido
                    bottom: 10, // Espaciado inferior reducido
                    left: 10 // Espaciado izquierdo reducido
                }
            }
        }
    };

    // Crear el gráfico utilizando la configuración
    new Chart(ctx, config);
}

// Llamamos a la función para obtener las métricas y crear el gráfico
fetchMetrics();

