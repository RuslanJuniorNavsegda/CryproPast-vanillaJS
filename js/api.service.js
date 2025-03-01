export class ApiService {
  static async fetchCryptoPrices(symbols) {
    try {
      const responses = await Promise.all(
        symbols.map((symbol) =>
          fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
        )
      );
      return Promise.all(responses.map((r) => r.json()));
    } catch (error) {
      throw new Error("Failed to fetch prices");
    }
  }

  static async fetchChartData(symbol, interval, limit = 100) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`
      );
      return response.json();
    } catch (error) {
      throw new Error("Failed to fetch chart data");
    }
  }

  static async fetchOrderBook(symbol, limit = 10) {
    try {
      const response = await fetch(
        `https://api.binance.com/api/v3/depth?symbol=${symbol}&limit=${limit}`
      );
      return response.json();
    } catch (error) {
      throw new Error("Failed to fetch order book");
    }
  }
}
