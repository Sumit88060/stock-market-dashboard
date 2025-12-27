/* ================= CONFIG ================= */
const API_KEY = "2bd7cfda36d24d3683a0d115d3bcf279";
const BASE_URL = "https://api.twelvedata.com";

/* ================= THEME TOGGLE ================= */
const toggleBtn = document.getElementById("themeToggle");
const body = document.body;

toggleBtn.onclick = () => {
  body.classList.toggle("light");
  body.classList.toggle("dark");

  toggleBtn.textContent =
    body.classList.contains("dark") ? "🌙 Dark" : "☀️ Light";
};


/* ================= STOCK LIST ================= */
const STOCKS = [
  { symbol: "AAPL", name: "Apple Inc" },
  { symbol: "MSFT", name: "Microsoft" },
  { symbol: "TSLA", name: "Tesla" },
  { symbol: "GOOGL", name: "Alphabet" },
  { symbol: "AMZN", name: "Amazon" },
  { symbol: "META", name: "Meta" },
  { symbol: "NFLX", name: "Netflix" },
  { symbol: "NVDA", name: "Nvidia" }
];

/* ================= STATE ================= */
let chart, candleSeries;
let currentSymbol = "AAPL";
let currentRange = 180;

/* ================= DOM ================= */
const inputEl = document.getElementById("searchInput");
const searchBtn = document.getElementById("searchBtn");
const loader = document.getElementById("loader");
const suggestionsEl = document.getElementById("suggestions");

const nameEl = document.getElementById("stock-name");
const priceEl = document.getElementById("stock-price");
const changeEl = document.getElementById("stock-change");
const openEl = document.getElementById("stock-open");
const highEl = document.getElementById("stock-high");
const lowEl = document.getElementById("stock-low");
const volumeEl = document.getElementById("stock-volume");

/* ================= INIT ================= */
initChart();
loadStock(currentSymbol);

/* ================= CHART ================= */
function initChart() {
  chart = LightweightCharts.createChart(
    document.getElementById("chart"),
    {
      layout: {
        background: { color: "#050517" },
        textColor: "#ccc"
      },
      grid: {
        vertLines: { color: "#111" },
        horzLines: { color: "#111" }
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false
      }
    }
  );

  candleSeries = chart.addSeries(
    LightweightCharts.CandlestickSeries,
    {
      upColor: "#39FF14",
      downColor: "#ff4d4d",
      wickUpColor: "#39FF14",
      wickDownColor: "#ff4d4d",
      borderUpColor: "#39FF14",
      borderDownColor: "#ff4d4d"
    }
  );
}

/* ================= AUTOCOMPLETE ================= */
inputEl.addEventListener("input", () => {
  const q = inputEl.value.toUpperCase();
  suggestionsEl.innerHTML = "";
  if (!q) return;

  STOCKS.filter(
    s => s.symbol.includes(q) || s.name.toUpperCase().includes(q)
  ).forEach(stock => {
    const div = document.createElement("div");
    div.className = "suggestion";
    div.textContent = `${stock.symbol} — ${stock.name}`;
    div.onclick = () => {
      inputEl.value = stock.symbol;
      suggestionsEl.innerHTML = "";
      loadStock(stock.symbol);
    };
    suggestionsEl.appendChild(div);
  });
});

/* ================= SEARCH ================= */
searchBtn.onclick = () => {
  const symbol = inputEl.value.trim().toUpperCase();
  if (symbol) loadStock(symbol);
};

/* ================= RANGE ================= */
document.querySelectorAll(".range-buttons button").forEach(btn => {
  btn.onclick = () => {
    currentRange = +btn.dataset.range;
    loadCandles(currentSymbol);
  };
});

/* ================= LOAD STOCK ================= */
async function loadStock(symbol) {
  currentSymbol = symbol;
  loader.style.display = "block";

  try {
    await Promise.all([
      loadQuote(symbol),
      loadCandles(symbol)
    ]);
  } catch (err) {
    alert(err.message);
  }

  loader.style.display = "none";
}

/* ================= QUOTE ================= */
async function loadQuote(symbol) {
  const res = await fetch(
    `${BASE_URL}/quote?symbol=${symbol}&apikey=${API_KEY}`
  );
  const q = await res.json();

  if (q.status === "error") throw new Error(q.message);

  nameEl.textContent = q.name || symbol;
  priceEl.textContent = `$${(+q.close).toFixed(2)}`;

  const change = +q.percent_change;
  changeEl.textContent =
    `${change >= 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(2)}%`;
  changeEl.style.color = change >= 0 ? "#39FF14" : "red";

  openEl.textContent = `$${(+q.open).toFixed(2)}`;
  highEl.textContent = `$${(+q.high).toFixed(2)}`;
  lowEl.textContent = `$${(+q.low).toFixed(2)}`;
  volumeEl.textContent = Number(q.volume).toLocaleString();
}

/* ================= CANDLES ================= */
async function loadCandles(symbol) {
  const res = await fetch(
    `${BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${currentRange}&apikey=${API_KEY}`
  );
  const data = await res.json();

  if (!Array.isArray(data.values)) {
    throw new Error("Chart data unavailable");
  }

  const candles = data.values
    .reverse()
    .map(v => ({
      time: v.datetime.split(" ")[0],
      open: +v.open,
      high: +v.high,
      low: +v.low,
      close: +v.close
    }));

  candleSeries.setData(candles);
  chart.timeScale().fitContent();
}
