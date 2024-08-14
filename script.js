// Inicialización
let loanHistory = JSON.parse(localStorage.getItem('loanHistory')) || [];
let historyVisibleCount = 3;

// Eventos
document.getElementById('calculateBtn').addEventListener('click', debounce(handleCalculateClick, 300));
document.getElementById('resetBtn').addEventListener('click', debounce(handleResetClick, 300));
document.getElementById('viewMoreBtn').addEventListener('click', showMoreHistory);

// Función de debounce para evitar múltiples clics rápidos
function debounce(func, delay) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
}

// Funciones de Manejo de Eventos
function handleCalculateClick() {
    let loanAmount = parseFloat(document.getElementById('loanAmount').value);
    let interestRate = parseFloat(document.getElementById('interestRate').value);
    let loanTerm = parseInt(document.getElementById('loanTerm').value);

    if (isNaN(loanAmount) || isNaN(interestRate) || isNaN(loanTerm) || loanAmount <= 0 || interestRate <= 0 || loanTerm <= 0) {
        alert("Por favor, ingrese valores numéricos válidos y mayores a cero.");
        return;
    }

    let loanData = { loanAmount, interestRate, loanTerm };
    loanHistory.push(loanData);
    localStorage.setItem('loanHistory', JSON.stringify(loanHistory));

    let monthlyPayment = calcularPagoMensual(loanData);
    mostrarResultado(monthlyPayment);
    mostrarGraficaAmortizacion(loanData, monthlyPayment);
    document.getElementById('viewMoreBtn').style.display = loanHistory.length > historyVisibleCount ? 'block' : 'none';
}

function handleResetClick() {
    document.getElementById('confirmDialog').style.display = 'block';

    // Usar un solo listener por evento
    document.getElementById('confirmYes').addEventListener('click', resetSimulator);
    document.getElementById('confirmNo').addEventListener('click', () => {
        document.getElementById('confirmDialog').style.display = 'none';
    });
}

function resetSimulator() {
    document.getElementById('confirmDialog').style.display = 'none';

    // Limpiar los campos del formulario
    document.getElementById('loanAmount').value = '';
    document.getElementById('interestRate').value = '';
    document.getElementById('loanTerm').value = '';

    // Limpiar resultados y gráfica
    document.getElementById('result').textContent = '';
    document.getElementById('history').innerHTML = '';
    const ctx = document.getElementById('amortizationChart').getContext('2d');
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Limpiar historial
    loanHistory = [];
    localStorage.removeItem('loanHistory');
    historyVisibleCount = 3; // Reiniciar el contador de historial visible
    document.getElementById('viewMoreBtn').style.display = 'none';
}

// Función para calcular el pago mensual
function calcularPagoMensual({ loanAmount, interestRate, loanTerm }) {
    let monthlyRate = interestRate / 100 / 12;
    let numberOfPayments = loanTerm * 12;
    return (loanAmount * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -numberOfPayments));
}

// Mostrar resultado en pantalla
function mostrarResultado(monthlyPayment) {
    let resultDiv = document.getElementById('result');
    resultDiv.textContent = `Pago mensual estimado: $${monthlyPayment.toFixed(2)}`;
}

// Mostrar la gráfica de amortización
function mostrarGraficaAmortizacion({ loanAmount, interestRate, loanTerm }, monthlyPayment) {
    let ctx = document.getElementById('amortizationChart').getContext('2d');
    let chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...Array(loanTerm * 12).keys()].map(x => `Mes ${x + 1}`),
            datasets: [{
                label: 'Saldo del préstamo',
                data: [...Array(loanTerm * 12).keys()].map(x => calcularSaldo(loanAmount, interestRate, loanTerm, x + 1, monthlyPayment)),
                borderColor: 'rgba(0, 123, 255, 1)',
                fill: false
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Meses'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Saldo (USD)'
                    }
                }
            }
        }
    });
}

function calcularSaldo(loanAmount, interestRate, loanTerm, month, monthlyPayment) {
    let balance = loanAmount;
    let monthlyRate = interestRate / 100 / 12;
    for (let i = 0; i < month; i++) {
        balance -= (monthlyPayment - (balance * monthlyRate));
    }
    return Math.max(balance, 0);
}

function showMoreHistory() {
    historyVisibleCount += 3;
    mostrarHistorial();
}

function mostrarHistorial() {
    let historyDiv = document.getElementById('history');
    historyDiv.innerHTML = '';
    loanHistory.slice(0, historyVisibleCount).forEach((loan, index) => {
        let loanDiv = document.createElement('div');
        loanDiv.classList.add('loan-entry');
        loanDiv.innerHTML = `<strong>Préstamo ${index + 1}:</strong> Monto: $${loan.loanAmount}, Tasa: ${loan.interestRate}%, Plazo: ${loan.loanTerm} años`;
        historyDiv.appendChild(loanDiv);
    });
}
