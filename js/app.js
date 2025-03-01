import { ApiService } from "./api.service.js";
import { ChartManager } from "./chart.manager.js";
import { ThemeService } from "./theme.service.js";
import { WalletManager } from "./wallet.js";
import { UIController } from "./ui.controller.js";

class CryptoApp {
  constructor() {
    this.themeService = new ThemeService();
    this.walletManager = new WalletManager();
    this.chartManager = new ChartManager(this.themeService.theme);
    this.init();
  }

  async init() {
    UIController.initThemeSwitcher(this.themeService);
    UIController.initWalletButton(this.walletManager);
    await this.loadData();
    this.initChart();
    this.initWebSocket();
  }

  async loadData() {
    try {
      const [prices, orders] = await Promise.all([
        ApiService.fetchCryptoPrices(["BTCUSDT", "ETHUSDT", "SOLUSDT"]),
        ApiService.fetchOrderBook("BTCUSDT"),
      ]);
      UIController.updateOrderBook(this.formatOrders(orders));
    } catch (error) {
      UIController.showNotification(error.message, "error");
    }
  }

  initChart() {
    const ctx = document.getElementById("priceChart").getContext("2d");
    this.chartManager.init(ctx, "BTCUSDT", "1h");
  }

  initWebSocket() {
    this.ws = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
    this.ws.onmessage = (e) => this.handleTradeUpdate(e);
    this.ws.onerror = (e) => this.handleSocketError(e);
  }

  handleTradeUpdate(event) {
    const data = JSON.parse(event.data);
    this.chartManager.updateRealTimeData(data);
    UIController.updatePriceDisplay(data.s, data.p);
  }

  handleSocketError(error) {
    UIController.showNotification("Ошибка подключения", "error");
    setTimeout(() => this.initWebSocket(), 5000);
  }

  formatOrders(orderBookData) {
    return [
      ...orderBookData.asks.map((a) => ({
        price: a[0],
        amount: a[1],
        type: "ask",
      })),
      ...orderBookData.bids.map((b) => ({
        price: b[0],
        amount: b[1],
        type: "bid",
      })),
    ].sort((a, b) => b.price - a.price);
  }
}

// Инициализация приложения
document.addEventListener("DOMContentLoaded", () => {
  new CryptoApp();
});
