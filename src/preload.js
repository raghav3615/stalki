const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Screen time data
  getScreenTimeData: (period) => ipcRenderer.invoke('get-screen-time-data', period),
  getAppUsage: (period) => ipcRenderer.invoke('get-app-usage', period),
  getTodayStats: () => ipcRenderer.invoke('get-today-stats'),
  
  // New methods for improved data visualization
  getWeeklyChartData: () => ipcRenderer.invoke('get-weekly-chart-data'),
  getAppCategoryData: (period) => ipcRenderer.invoke('get-app-category-data', period),
  
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  
  // Break reminders
  setBreakReminder: (enabled, interval) => ipcRenderer.invoke('set-break-reminder', enabled, interval),
  
  // Utility functions
  formatTime: (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  },
  
  formatTimeDetailed: (milliseconds) => {
    const hours = Math.floor(milliseconds / 3600000);
    const minutes = Math.floor((milliseconds % 3600000) / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    
    return {
      hours,
      minutes,
      seconds,
      totalMinutes: Math.floor(milliseconds / 60000),
      totalHours: Math.floor(milliseconds / 3600000)
    };
  },
  
  getPercentage: (value, total) => {
    if (total === 0) return 0;
    return Math.min((value / total) * 100, 100);
  },
  
  // Date utilities
  formatDate: (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  },
  
  getRelativeDate: (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  },
  
  // Notification utilities
  showNotification: (title, body) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body });
        }
      });
    }
  },

  getDailyAppUsageWithCategories: (date) => ipcRenderer.invoke('get-daily-app-usage-with-categories', date),
  getConsolidatedDailyData: (date) => ipcRenderer.invoke('get-consolidated-daily-data', date),
});
