export class UIController {
  static initThemeSwitcher(themeService) {
    document.querySelector(".theme-switcher").addEventListener("click", () => {
      themeService.toggle();
    });
  }

  static initWalletButton(walletManager) {
    document.querySelector(".primary-btn").addEventListener("click", () => {
      const isConnected = walletManager.toggleConnection();
      this.showNotification(
        isConnected ? "Кошелек подключен" : "Кошелек отключен"
      );
    });
  }

  static showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.remove(), 3000);
  }

  static updateOrderBook(orders) {
    const tbody = document.getElementById("orderList");
    tbody.innerHTML = orders
      .map(
        (order) => `
      <tr class="${order.type}-row">
        <td>${order.price.toFixed(2)}</td>
        <td>${order.amount.toFixed(4)}</td>
        <td>${(order.price * order.amount).toFixed(2)}</td>
      </tr>
    `
      )
      .join("");
  }
}
