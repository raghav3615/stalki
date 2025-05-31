const ext = typeof browser !== "undefined" ? browser : chrome;

// --- Color palette for charts and legend ---
const palette = [
  "#6366f1", "#a21caf", "#f43f5e", "#f59e42", "#fbbf24",
  "#22d3ee", "#10b981", "#84cc16", "#eab308", "#f472b6"
];

let pieChartInstance = null;
let barChartInstance = null;

// --- Helper functions ---
function msToTime(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function msToHours(ms) {
  return Math.floor(ms / 3600000);
}

function msToMinutes(ms) {
  return Math.floor((ms % 3600000) / 60000);
}

function getPercent(ms, total) {
  if (!total) return "0%";
  return Math.round((ms / total) * 100) + "%";
}

// --- Simulate data for demo (replace with real data logic) ---
async function getTodayData() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const data = await ext.storage.local.get([todayKey]);
  const todayData = { ...(data[todayKey] || {}) };
  // Add ongoing time
  const ongoing = await getOngoingTime();
  if (ongoing.domain && ongoing.ms) {
    todayData[ongoing.domain] = (todayData[ongoing.domain] || 0) + ongoing.ms;
  }
  return todayData;
}

async function getWeeklyData() {
  const now = new Date();
  const week = [];
  let todayIndex = 6; // Sunday is 6
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const data = await ext.storage.local.get([key]);
    let dayTotal = Object.values(data[key] || {}).reduce((a, b) => a + b, 0);
    // Add ongoing time for today
    if (i === 6) {
      const ongoing = await getOngoingTime();
      if (ongoing.domain && ongoing.ms) {
        dayTotal += ongoing.ms;
      }
    }
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
    const data = await ext.storage.local.get([key]);
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

  // Destroy previous chart instance if exists
  if (pieChartInstance) {
    pieChartInstance.destroy();
  }

  const pieCtx = document.getElementById('pieChart').getContext('2d');
  pieChartInstance = new Chart(pieCtx, {
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

  // Destroy previous chart instance if exists
  if (barChartInstance) {
    barChartInstance.destroy();
  }

  const barCtx = document.getElementById('barChart').getContext('2d');
  barChartInstance = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [{
        data: weekly.map(ms => ms / 3600000), // hours
        backgroundColor: "#3b82f6",
        borderRadius: 4,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: "#aaa", font: { size: 12 } }
        },
        y: {
          grid: { color: "#222" },
          display: false
        }
      }
    }
  });

  // Summary box with precise time formatting
  // Calculate hours and minutes precisely
  const weeklyHours = Math.floor(total / 3600000);
  const weeklyMinutes = Math.floor((total % 3600000) / 60000);
  const monthlyHours = Math.floor(monthly / 3600000);
  
  // Update DOM with precise values
  document.getElementById('weeklyTotal').textContent = `${weeklyHours}h`;
  document.getElementById('weeklyTotalMinutes').textContent = `${weeklyMinutes}m`;
  document.getElementById('monthlyTotal').textContent = `${monthlyHours}h`;
}

// --- Main render ---
async function renderAll() {
  await renderPieChart();
  await renderBarChart();
}

renderAll();

// Listen for storage changes (real-time update)
ext.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    renderAll();
  }
});

// Get the currently active tab's domain and time since last activation
async function getOngoingTime() {
  return new Promise((resolve) => {
    ext.runtime.sendMessage({ type: "getOngoingTime" }, (resp) => {
      resolve(resp || {});
    });
  });
}

ext.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "forceReload") {
    renderAll();
  }
});