// Инициализация данных
let orders = [
  { price: 45000, amount: 0.5, type: "bid" },
  { price: 44900, amount: 1.2, type: "bid" },
  { price: 45200, amount: 0.8, type: "ask" },
  { price: 45300, amount: 1.5, type: "ask" },
];

let chart;

document.addEventListener("DOMContentLoaded", () => {
  const ctx = document.getElementById("priceChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: Array(24)
        .fill()
        .map((_, i) => `${i}:00`),
      datasets: [
        {
          label: "BTC/USDT",
          data: generateMockChartData(),
          borderColor: "#2172E5",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
    },
  });

  updateOrderBook();
});

function generateMockChartData() {
  return Array(24)
    .fill()
    .map(() => Math.random() * 1000 + 45000);
}

function updateOrderBook() {
  const tbody = document.getElementById("orderList");
  tbody.innerHTML = orders
    .sort((a, b) => b.price - a.price)
    .map(
      (order) => `
            <tr class="${order.type}-row">
                <td>${order.price.toLocaleString()}</td>
                <td>${order.amount.toFixed(4)}</td>
                <td>${(order.price * order.amount).toLocaleString()}</td>
            </tr>
        `
    )
    .join("");
}

function placeOrder(type) {
  const price = parseFloat(document.getElementById("priceInput").value);
  const amount = parseFloat(document.getElementById("amountInput").value);

  if (!price || !amount) {
    alert("Заполните все поля!");
    return;
  }

  orders.push({
    price,
    amount,
    type: type === "buy" ? "bid" : "ask",
  });

  updateOrderBook();
  updateChart();
  clearInputs();
}

function updateChart() {
  chart.data.datasets[0].data = generateMockChartData();
  chart.update();
}

function clearInputs() {
  document.getElementById("priceInput").value = "";
  document.getElementById("amountInput").value = "";
}

function connectWebSocket() {
  const ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

  ws.onmessage = (event) => {
    const response = JSON.parse(event.data);
    console.log("Новые данные:", response);
  };
}

// Для активации реального подключения раскомментируйте:
// connectWebSocket();
