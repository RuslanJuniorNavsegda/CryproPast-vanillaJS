import { Chart } from "https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js";

export class ChartManager {
  constructor(theme = "dark") {
    this.chart = null;
    this.theme = theme;
    this.currentSymbol = "BTCUSDT";
    this.currentInterval = "1h";
  }

  async init(ctx, symbol, interval) {
    if (this.chart) this.destroy();

    const data = await this.fetchData(symbol, interval);
    this.createChart(ctx, data);
  }

  async fetchData(symbol, interval) {
    const rawData = await ApiService.fetchChartData(symbol, interval);
    return rawData.map((d) => ({
      t: new Date(d[0]),
      o: parseFloat(d[1]),
      h: parseFloat(d[2]),
      l: parseFloat(d[3]),
      c: parseFloat(d[4]),
    }));
  }

  createChart(ctx, data) {
    this.chart = new Chart(ctx, {
      type: "candlestick",
      data: {
        datasets: [
          {
            data: data,
            color: this.getChartColors(),
            borderWidth: 2,
            wickColor: (ctx) =>
              ctx.raw.c >= ctx.raw.o
                ? this.getChartColors().up
                : this.getChartColors().down,
          },
        ],
      },
      options: this.getChartOptions(),
    });
  }

  getChartColors() {
    return this.theme === "dark"
      ? { up: "#34D399", down: "#F87171" }
      : { up: "#15803d", down: "#dc2626" };
  }

  getChartOptions() {
    const gridColor =
      this.theme === "dark"
        ? "rgba(255, 255, 255, 0.05)"
        : "rgba(0, 0, 0, 0.05)";

    return {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: { type: "time", time: { unit: "hour" }, grid: { color: gridColor } },
        y: { position: "right", grid: { color: gridColor } },
      },
      plugins: { legend: false },
    };
  }

  updateTheme(theme) {
    this.theme = theme;
    this.chart.options.scales.x.grid.color = gridColor;
    this.chart.options.scales.y.grid.color = gridColor;
    this.chart.update();
  }

  destroy() {
    if (this.chart) this.chart.destroy();
  }
}
