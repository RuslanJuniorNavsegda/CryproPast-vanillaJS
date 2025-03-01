export class WalletManager {
  constructor() {
    this.state = {
      balance: 12450.0,
      currencies: { BTC: 0.5, ETH: 4.2, USDT: 12450.0 },
      connected: false,
    };
  }

  executeTrade(type, price, amount) {
    if (type === "sell") {
      this.state.currencies.BTC -= amount;
      this.state.currencies.USDT += price * amount;
    } else {
      this.state.currencies.USDT -= price * amount;
      this.state.currencies.BTC += amount;
    }
    this.updateBalance();
  }

  updateBalance() {
    this.state.balance = Object.entries(this.state.currencies).reduce(
      (acc, [key, val]) => acc + val * this.getCoinPrice(key),
      0
    );
  }

  getCoinPrice(symbol) {
    // Реальная имплементация должна получать цены из API
    return {
      BTC: 45000,
      ETH: 2500,
      USDT: 1,
    }[symbol];
  }

  toggleConnection() {
    this.state.connected = !this.state.connected;
    return this.state.connected;
  }
}
