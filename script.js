let orders = [
  { price: 45000, amount: 0.5, type: "bid" },
  { price: 44900, amount: 1.2, type: "bid" },
  { price: 45200, amount: 0.8, type: "ask" },
  { price: 45300, amount: 1.5, type: "ask" },
];

const cryptoData = [
  { symbol: "BTC/USDT", price: 45230.5, change: 2.4 },
  { symbol: "ETH/USDT", price: 2450.75, change: -1.2 },
  { symbol: "SOL/USDT", price: 98.2, change: 5.1 },
];

let chart;
let wsConnection = null;

document.addEventListener("DOMContentLoaded", () => {
  initChart();
  updateOrderBook();
  updateCryptoPrices();
  initWebSocket();
});

function initChart() {
  const ctx = document.getElementById("priceChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: generateTimeLabels(),
      datasets: [
        {
          label: "BTC/USDT",
          data: generateMockChartData(),
          borderColor: "#2172E5",
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          fill: {
            target: "origin",
            above: "rgba(33,114,229,0.1)",
          },
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          ticks: {
            color: "#fff",
            callback: (value) => `$${value.toLocaleString()}`,
          },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
        x: {
          ticks: { color: "#fff" },
          grid: { color: "rgba(255,255,255,0.1)" },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function generateMockChartData() {
  return Array(24)
    .fill()
    .map(() => Math.random() * 1000 + 45000);
}

function generateTimeLabels() {
  const now = new Date();
  return Array(24)
    .fill()
    .map((_, i) => {
      const d = new Date(now - i * 3600000);
      return d.toLocaleTimeString("ru-RU", {
        hour: "2-digit",
        minute: "2-digit",
      });
    })
    .reverse();
}

function updateCryptoPrices() {
  const container = document.querySelector(".crypto-prices");
  container.innerHTML = cryptoData
    .map(
      (coin) => `
        <div class="price-card ${coin.symbol.split("/")[0].toLowerCase()}">
            <span class="symbol">${coin.symbol}</span>
            <span class="price">$${coin.price.toFixed(2)}</span>
            <span class="change ${coin.change >= 0 ? "positive" : "negative"}">
                ${coin.change >= 0 ? "+" : ""}${coin.change.toFixed(1)}%
            </span>
        </div>
    `
    )
    .join("");
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
  const priceInput = document.getElementById("priceInput");
  const amountInput = document.getElementById("amountInput");

  const price = parseFloat(priceInput.value);
  const amount = parseFloat(amountInput.value);

  if (!price || !amount || price <= 0 || amount <= 0) {
    showError("Некорректные значения цены или количества");
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

// Вспомогательные функции
function clearInputs() {
  document.getElementById("priceInput").value = "";
  document.getElementById("amountInput").value = "";
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
}

// WebSocket
function initWebSocket() {
  wsConnection = new WebSocket(
    "wss://stream.binance.com:9443/ws/btcusdt@trade"
  );

  wsConnection.onmessage = (event) => {
    const tradeData = JSON.parse(event.data);
    handleRealTimeData(tradeData);
  };

  wsConnection.onerror = (error) => {
    console.error("WebSocket Error:", error);
    showError("Ошибка подключения к данным");
  };
}

function handleRealTimeData(data) {
  const btc = cryptoData.find((c) => c.symbol === "BTC/USDT");
  const newPrice = parseFloat(data.p);
  const change = (((newPrice - btc.price) / btc.price) * 100).toFixed(1);

  btc.price = newPrice;
  btc.change = parseFloat(change);

  chart.data.datasets[0].data.shift();
  chart.data.datasets[0].data.push(newPrice);
  chart.update();

  updateCryptoPrices();
}

function updateChart() {
  chart.data.datasets[0].data = generateMockChartData();
  chart.update();
}
