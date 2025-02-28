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

let wallet = {
  balance: 12450.0,
  weeklyChange: 3.2,
  connected: false,
};

let chart;
let wsConnection = null;

document.addEventListener("DOMContentLoaded", () => {
  loadSavedTheme();
  initChart();
  updateOrderBook();
  updateCryptoPrices();
  updateWalletDisplay();
  initWebSocket();
  initAnimations();
  initWalletButton();
});

function initChart() {
  const ctx = document.getElementById("priceChart").getContext("2d");
  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: generateTimeLabels(),
      datasets: [
        {
          label: "BTC/USDT",
          data: generateMockChartData(),
          borderColor: getComputedStyle(
            document.documentElement
          ).getPropertyValue("--accent"),
          borderWidth: 2,
          pointRadius: 0,
          tension: 0.4,
          backgroundColor: "rgba(33,114,229,0.1)",
          fill: true,
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
            color: () =>
              getComputedStyle(document.body).getPropertyValue("--text"),
            callback: (value) => `$${value.toLocaleString()}`,
          },
          grid: {
            color: () =>
              `rgba(${hexToRgb(
                getComputedStyle(document.body).getPropertyValue("--text")
              )}, 0.1)`,
          },
        },
        x: {
          ticks: {
            color: () =>
              getComputedStyle(document.body).getPropertyValue("--text"),
          },
          grid: {
            color: () =>
              `rgba(${hexToRgb(
                getComputedStyle(document.body).getPropertyValue("--text")
              )}, 0.1)`,
          },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });
}

function generateMockChartData() {
  return Array.from(
    { length: 24 },
    (_, i) => 45000 + Math.sin(i * 0.5) * 1000 + Math.random() * 500
  );
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

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
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

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-theme");
  localStorage.setItem(
    "theme",
    body.classList.contains("light-theme") ? "light" : "dark"
  );
  updateChartColors();
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
  updateChartColors();
}

function updateChartColors() {
  chart.options.scales.x.ticks.color = getComputedStyle(
    document.body
  ).getPropertyValue("--text");
  chart.options.scales.y.ticks.color = getComputedStyle(
    document.body
  ).getPropertyValue("--text");
  chart.options.scales.y.grid.color = `rgba(${hexToRgb(
    getComputedStyle(document.body).getPropertyValue("--text")
  )}, 0.1)`;
  chart.options.scales.x.grid.color = `rgba(${hexToRgb(
    getComputedStyle(document.body).getPropertyValue("--text")
  )}, 0.1)`;
  chart.update();
}

function updateWalletDisplay() {
  document.querySelector(
    ".amount"
  ).textContent = `$${wallet.balance.toLocaleString(undefined, {
    minimumFractionDigits: 2,
  })}`;
  document.querySelector(".wallet-card .change").textContent = `${
    wallet.weeklyChange >= 0 ? "+" : ""
  }${wallet.weeklyChange.toFixed(1)}% за неделю`;
}

function initWalletButton() {
  document.querySelector(".cta-btn").addEventListener("click", () => {
    wallet.connected = !wallet.connected;
    updateWalletButtonState();
    showNotification(
      wallet.connected ? "Кошелек подключен" : "Кошелек отключен"
    );
  });
}

function updateWalletButtonState() {
  const btn = document.querySelector(".cta-btn");
  btn.textContent = wallet.connected
    ? "Управление кошельком"
    : "Подключить кошелёк";
  btn.style.backgroundColor = wallet.connected
    ? "var(--accent)"
    : "var(--positive)";
}

function showNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("hide");
    setTimeout(() => notification.remove(), 300);
  }, 2000);
}

function initAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = "translateY(0)";
      }
    });
  });

  document.querySelectorAll(".glass-card").forEach((card) => {
    card.style.opacity = 0;
    card.style.transform = "translateY(30px)";
    card.style.transition = "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
    observer.observe(card);
  });
}

function updateChart() {
  chart.data.datasets[0].data = generateMockChartData();
  chart.update();
}
