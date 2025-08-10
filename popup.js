const ext = typeof browser !== "undefined" ? browser : chrome;

// --- Color palette for charts and legend ---
const palette = [
  "#6366f1", "#8b5cf6", "#06b6d4", "#10b981", "#f59e0b", 
  "#ef4444", "#f472b6", "#a21caf", "#84cc16", "#22d3ee"
];

let pieChartInstance = null;
let barChartInstance = null;
let currentPeriod = 'week';

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

function formatTime(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}

function formatClock(ms) {
  const hours = Math.floor(ms / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function getWeekdayLabels(startingMonday = true) {
  // Generate localized weekday short labels starting from Monday (or Sunday)
  const base = startingMonday ? 1 : 0; // 1=Mon, 0=Sun
  const fmt = new Intl.DateTimeFormat(undefined, { weekday: 'short' });
  const labels = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.UTC(2020, 5, base + i)); // stable week
    labels.push(fmt.format(d));
  }
  return labels;
}

// --- Enhanced data fetching with better accuracy ---
async function getTodayData() {
  const todayKey = new Date().toISOString().slice(0, 10);
  const data = await ext.storage.local.get([todayKey]);
  const todayData = { ...(data[todayKey] || {}) };
  
  // Add ongoing time with higher precision
  const ongoing = await getOngoingTime();
  if (ongoing.domain && ongoing.ms > 0) {
    todayData[ongoing.domain] = (todayData[ongoing.domain] || 0) + ongoing.ms;
  }
  
  return todayData;
}

async function getWeeklyData() {
  const now = new Date();
  const week = [];
  
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const data = await ext.storage.local.get([key]);
    let dayTotal = Object.values(data[key] || {}).reduce((a, b) => a + b, 0);
    
    // Add ongoing time for today
    if (i === 6) {
      const ongoing = await getOngoingTime();
      if (ongoing.domain && ongoing.ms > 0) {
        dayTotal += ongoing.ms;
      }
    }
    week.push(dayTotal);
  }
  return week;
}

async function getMonthlyData() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  let total = 0;
  const dailyData = [];
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const key = date.toISOString().slice(0, 10);
    const data = await ext.storage.local.get([key]);
    const dayTotal = Object.values(data[key] || {}).reduce((a, b) => a + b, 0);
    
    // Add ongoing time for today
    if (date.toDateString() === now.toDateString()) {
      const ongoing = await getOngoingTime();
      if (ongoing.domain && ongoing.ms > 0) {
        total += dayTotal + ongoing.ms;
        dailyData.push(dayTotal + ongoing.ms);
      } else {
        total += dayTotal;
        dailyData.push(dayTotal);
      }
    } else {
      total += dayTotal;
      dailyData.push(dayTotal);
    }
  }
  
  return { total, dailyData };
}

async function getAllData() {
  const allData = await ext.storage.local.get(null);
  const processedData = [];
  
  for (const [key, value] of Object.entries(allData)) {
    if (key.match(/^\d{4}-\d{2}-\d{2}$/)) { // Date format YYYY-MM-DD
      for (const [domain, time] of Object.entries(value)) {
        processedData.push({
          date: key,
          domain: domain,
          time: time,
          timeFormatted: formatTime(time)
        });
      }
    }
  }
  
  return processedData.sort((a, b) => new Date(b.date) - new Date(a.date));
}

// --- Render Pie Chart and Custom Legend ---
async function renderPieChart() {
  const data = await getTodayData();
  const domains = Object.keys(data);
  const times = Object.values(data);
  const total = times.reduce((a, b) => a + b, 0);

  // Update total time display as HH:MM:SS for precision
  document.getElementById('totalToday').textContent = formatClock(total);

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
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#ffffff'
      }]
    },
    options: {
      cutout: "65%",
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(13, 18, 26, 0.98)',
          titleColor: '#e7eaf0',
          bodyColor: '#a6adbb',
          borderColor: '#263142',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              const domain = context.label;
              const time = formatTime(context.raw);
              const percent = getPercent(context.raw, total);
              return `${domain}: ${time} (${percent})`;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 800
      }
    }
  });

  // Enhanced custom legend
  const legend = document.getElementById('pieLegend');
  legend.innerHTML = '';
  
  if (domains.length === 0) {
    legend.innerHTML = '<div class="legend-item"><span class="legend-label">No data for today</span></div>';
    return;
  }

  domains.forEach((domain, i) => {
    const percent = getPercent(times[i], total);
    const time = formatTime(times[i]);
    legend.innerHTML += `
      <div class="legend-item" data-domain="${domain}">
        <span class="legend-color" style="background:${palette[i % palette.length]}"></span>
        <span class="legend-label">${domain}</span>
        <span class="legend-time">${time}</span>
        <span class="legend-percent">${percent}</span>
      </div>
    `;
  });
}

// --- Render Bar Chart and Enhanced Stats ---
async function renderBarChart() {
  const weekly = await getWeeklyData();
  const monthlyData = await getMonthlyData();
  const weeklyTotal = weekly.reduce((a, b) => a + b, 0);
  const monthlyTotal = monthlyData.total;

  // Destroy previous chart instance if exists
  if (barChartInstance) {
    barChartInstance.destroy();
  }

  const chartData = currentPeriod === 'week' ? weekly : monthlyData.dailyData.slice(-7);
  const labels = currentPeriod === 'week'
    ? getWeekdayLabels(true)
    : ['-6d', '-5d', '-4d', '-3d', '-2d', 'Yesterday', 'Today'];

  const barCtx = document.getElementById('barChart').getContext('2d');
  barChartInstance = new Chart(barCtx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        data: chartData.map(ms => ms / 3600000), // Convert to hours
        backgroundColor: palette[0],
        borderRadius: 6,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.8
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { 
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(37, 37, 66, 0.95)',
          titleColor: '#ffffff',
          bodyColor: '#a1a1aa',
          borderColor: '#374151',
          borderWidth: 1,
          cornerRadius: 8,
          callbacks: {
            label: function(context) {
              return formatTime(context.raw * 3600000);
            }
          }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { 
            color: "#a6adbb", 
            font: { size: 11, family: 'inherit' }
          },
          border: { display: false }
        },
        y: {
          grid: { 
            color: "#263142",
            lineWidth: 1
          },
          ticks: { 
            color: "#a6adbb",
            font: { size: 10, family: 'inherit' },
            callback: function(value) {
              return value + 'h';
            }
          },
          border: { display: false }
        }
      },
      animation: {
        duration: 800,
        easing: 'easeOutQuart'
      }
    }
  });

  // Update stats with enhanced calculations
  const weeklyHours = Math.floor(weeklyTotal / 3600000);
  const weeklyMinutes = Math.floor((weeklyTotal % 3600000) / 60000);
  const monthlyHours = Math.floor(monthlyTotal / 3600000);
  const monthlyMinutes = Math.floor((monthlyTotal % 3600000) / 60000);
  
  // Calculate daily average for the week
  const dailyAverage = weeklyTotal / 7;
  const dailyAvgHours = Math.floor(dailyAverage / 3600000);
  const dailyAvgMinutes = Math.floor((dailyAverage % 3600000) / 60000);
  
  // Update DOM elements
  document.getElementById('weeklyTotal').textContent = `${weeklyHours}h`;
  document.getElementById('weeklyTotalMinutes').textContent = `${weeklyMinutes}m`;
  document.getElementById('dailyAverage').textContent = `${dailyAvgHours}h`;
  document.getElementById('dailyAverageMinutes').textContent = `${dailyAvgMinutes}m`;
  document.getElementById('monthlyTotal').textContent = `${monthlyHours}h`;
  document.getElementById('monthlyTotalMinutes').textContent = `${monthlyMinutes}m`;
}

// --- CSV Export functionality ---
function generateCSV(data, type) {
  let csvContent = '';
  
  switch(type) {
    case 'today':
      csvContent = 'Domain,Time (ms),Time (formatted),Percentage\n';
      const todayTotal = Object.values(data).reduce((a, b) => a + b, 0);
      Object.entries(data).forEach(([domain, time]) => {
        const percent = getPercent(time, todayTotal);
        csvContent += `"${domain}",${time},"${formatTime(time)}","${percent}"\n`;
      });
      break;
      
    case 'week':
    case 'month':
      csvContent = 'Date,Domain,Time (ms),Time (formatted)\n';
      data.forEach(row => {
        csvContent += `"${row.date}","${row.domain}",${row.time},"${row.timeFormatted}"\n`;
      });
      break;
      
    case 'all':
      csvContent = 'Date,Domain,Time (ms),Time (formatted)\n';
      data.forEach(row => {
        csvContent += `"${row.date}","${row.domain}",${row.time},"${row.timeFormatted}"\n`;
      });
      break;
  }
  
  return csvContent;
}

function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

async function handleExport(exportType) {
  let data, filename, csvContent;
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  
  switch(exportType) {
    case 'today':
      data = await getTodayData();
      filename = `stalki-today-${timestamp}.csv`;
      csvContent = generateCSV(data, 'today');
      break;
      
    case 'week':
      data = await getAllData();
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekData = data.filter(row => new Date(row.date) >= weekAgo);
      filename = `stalki-week-${timestamp}.csv`;
      csvContent = generateCSV(weekData, 'week');
      break;
      
    case 'month':
      data = await getAllData();
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const monthData = data.filter(row => new Date(row.date) >= monthAgo);
      filename = `stalki-month-${timestamp}.csv`;
      csvContent = generateCSV(monthData, 'month');
      break;
      
    case 'all':
      data = await getAllData();
      filename = `stalki-all-data-${timestamp}.csv`;
      csvContent = generateCSV(data, 'all');
      break;
  }
  
  downloadCSV(csvContent, filename);
}

// --- Event Listeners ---
function setupEventListeners() {
  // Export button
  document.getElementById('exportBtn').addEventListener('click', () => {
    document.getElementById('exportModal').style.display = 'block';
  });

  // Close modal
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('exportModal').style.display = 'none';
  });
  
  document.getElementById('cancelExport').addEventListener('click', () => {
    document.getElementById('exportModal').style.display = 'none';
  });

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    const modal = document.getElementById('exportModal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Download CSV
  document.getElementById('downloadCSV').addEventListener('click', async () => {
    const selectedType = document.querySelector('input[name="exportType"]:checked').value;
    await handleExport(selectedType);
    document.getElementById('exportModal').style.display = 'none';
  });

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', () => {
    renderAll();
  });

  // Period selector
  document.querySelectorAll('.period-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPeriod = btn.dataset.period;
      renderBarChart();
    });
  });

  // Legend hover effects
  document.addEventListener('click', (e) => {
    if (e.target.closest('.legend-item')) {
      const item = e.target.closest('.legend-item');
      item.style.transform = 'scale(1.02)';
      setTimeout(() => {
        item.style.transform = '';
      }, 150);
    }
  });
}

// --- Main render ---
async function renderAll() {
  await renderPieChart();
  await renderBarChart();
}

// --- Initialize ---
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  renderAll();
});

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