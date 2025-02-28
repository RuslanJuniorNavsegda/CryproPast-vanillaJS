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
  initFormValidation();
});

function initChart() {
  if (chart) chart.destroy();

  const ctx = document.getElementById("priceChart").getContext("2d");
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
    options: getChartOptions(),
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

function getChartOptions() {
  return {
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
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
        backgroundColor: getComputedStyle(document.body).getPropertyValue(
          "--secondary"
        ),
        titleColor: getComputedStyle(document.body).getPropertyValue("--text"),
        bodyColor: getComputedStyle(document.body).getPropertyValue("--text"),
      },
    },
  };
}

function toggleTheme() {
  const body = document.body;
  body.classList.toggle("light-theme");
  localStorage.setItem(
    "theme",
    body.classList.contains("light-theme") ? "light" : "dark"
  );
  refreshChart();
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem("theme") || "dark";
  document.body.classList.toggle("light-theme", savedTheme === "light");
  refreshChart();
}

function refreshChart() {
  if (chart) {
    chart.destroy();
    initChart();
  }
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

  if (!isValidOrder(price, amount)) {
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

function isValidOrder(price, amount) {
  return !isNaN(price) && !isNaN(amount) && price > 0 && amount > 0;
}

function clearInputs() {
  document.getElementById("priceInput").value = "";
  document.getElementById("amountInput").value = "";
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

function initWebSocket() {
  wsConnection = new WebSocket(
    "wss://stream.binance.com:9443/ws/btcusdt@trade"
  );

  wsConnection.onmessage = (event) => {
    const tradeData = JSON.parse(event.data);
    updateRealTimeData(tradeData);
  };

  wsConnection.onerror = (error) => {
    console.error("WebSocket Error:", error);
    showError("Ошибка подключения к данным");
  };
}

function updateRealTimeData(data) {
  const btc = cryptoData.find((c) => c.symbol === "BTC/USDT");
  const newPrice = parseFloat(data.p);
  const change = (((newPrice - btc.price) / btc.price) * 100).toFixed(1);

  btc.price = newPrice;
  btc.change = parseFloat(change);

  updateChartData(newPrice);
  updateCryptoPrices();
}

function updateChartData(newPrice) {
  if (chart) {
    chart.data.datasets[0].data.shift();
    chart.data.datasets[0].data.push(newPrice);
    chart.update();
  }
}

function hexToRgb(hex) {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
  setTimeout(() => errorDiv.remove(), 3000);
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
  animateElements(".glass-card", 0.1);
  animateElements(".price-card", 0.2);
}

function animateElements(selector, delayStep) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = 1;
        entry.target.style.transform = "translateY(0)";
        entry.target.style.transitionDelay = `${index * delayStep}s`;
      }
    });
  });

  document.querySelectorAll(selector).forEach((element) => {
    element.style.opacity = 0;
    element.style.transform = "translateY(30px)";
    element.style.transition = "all 0.6s cubic-bezier(0.22, 1, 0.36, 1)";
    observer.observe(element);
  });
}

function initFormValidation() {
  document.querySelector(".contact-form").addEventListener("submit", (e) => {
    const email = document.getElementById("email").value;
    if (!isValidEmail(email)) {
      e.preventDefault();
      showError("Введите корректный email");
    }
  });
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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

function updateChart() {
  if (chart) {
    chart.data.datasets[0].data = generateMockChartData();
    chart.update();
  }
}
