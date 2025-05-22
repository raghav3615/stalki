// --- Color palette for charts and legend ---
const palette = [
  "#6366f1", "#a21caf", "#f43f5e", "#f59e42", "#fbbf24",
  "#22d3ee", "#10b981", "#84cc16", "#eab308", "#f472b6"
];

// --- Helper functions ---
function msToTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function getPercent(ms, total) {
  if (!total) return "0%";
  return Math.round((ms / total) * 100) + "%";
}

// --- Simulate data for demo (replace with real data logic) ---
async function getTodayData() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const data = await chrome.storage.local.get([todayKey]);
  return data[todayKey] || {};
}

async function getWeeklyData() {
  const now = new Date();
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const data = await chrome.storage.local.get([key]);
    const dayTotal = Object.values(data[key] || {}).reduce((a, b) => a + b, 0);
    week.push(dayTotal);
  }
  return week;
}

async function getMonthlyTotal() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  let total = 0;
  for (let day = 1; day <= 31; day++) {
    const key = `${year}-${month}-${String(day).padStart(2, '0')}`;
    const data = await chrome.storage.local.get([key]);
    if (data[key]) {
      total += Object.values(data[key]).reduce((a, b) => a + b, 0);
    }
  }
  return total;
}

// --- Render Pie Chart and Custom Legend ---
async function renderPieChart() {
  const data = await getTodayData();
  const domains = Object.keys(data);
  const times = Object.values(data);
  const total = times.reduce((a, b) => a + b, 0);

  // Pie chart
  const pieCtx = document.getElementById('pieChart').getContext('2d');
  new Chart(pieCtx, {
    type: 'doughnut',
    data: {
      labels: domains,
      datasets: [{
        data: times,
        backgroundColor: palette,
        borderWidth: 0
      }]
    },
    options: {
      cutout: "65%",
      plugins: {
        legend: { display: false }
      }
    }
  });

  // Custom legend
  const legend = document.getElementById('pieLegend');
  legend.innerHTML = '';
  domains.forEach((domain, i) => {
    const percent = getPercent(times[i], total);
    const time = msToTime(times[i]);
    legend.innerHTML += `
      <div class="legend-item">
        <span class="legend-color" style="background:${palette[i % palette.length]}"></span>
        <span class="legend-label">${domain}</span>
        <span class="legend-time">${time}</span>
        <span class="legend-percent">(${percent})</span>
      </div>
    `;
  });
}

// --- Render Bar Chart and Summary Box ---
async function renderBarChart() {
  const weekly = await getWeeklyData();
  const total = weekly.reduce((a, b) => a + b, 0);
  const monthly = await getMonthlyTotal();

  // Bar chart
  const barCtx = document.getElementById('barChart').getContext('2d');
  new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: weekly.map(ms => ms / 3600000), // hours
        backgroundColor: "#3b82f6",
        borderRadius: 7,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#aaa", font: { size: 13 } }
        },
        y: {
          grid: { color: "#222" },
          ticks: { color: "#aaa", font: { size: 13 }, stepSize: 2 }
        }
      }
    }
  });

  // Summary box
  document.getElementById('weeklyTotal').textContent = msToTime(total);
  document.getElementById('monthlyTotal').textContent = msToTime(monthly);
}

// --- Main render ---
async function renderAll() {
  await renderPieChart();
  await renderBarChart();
}

renderAll();

// Listen for storage changes (real-time update)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    renderAll();
  }
});