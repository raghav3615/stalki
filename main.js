const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, globalShortcut } = require('electron');
const path = require('path');
const { ScreenTimeTracker } = require('./src/screenTimeTracker');
const { DatabaseManager } = require('./src/databaseManager');

let mainWindow;
let tray;
let screenTimeTracker;
let databaseManager;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'src/preload.js')
    },
    icon: path.join(__dirname, 'assets/icon.png'),
    show: false,
    titleBarStyle: 'default'
  });

  mainWindow.loadFile('src/index.html');

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Hide window on minimize
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'assets/icon.png');
  const icon = nativeImage.createFromPath(iconPath);
  icon.resize({ width: 16, height: 16 });
  
  tray = new Tray(icon);
  tray.setToolTip('Screen Time Tracker');
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    {
      label: 'Today\'s Screen Time',
      click: () => {
        if (screenTimeTracker) {
          const today = screenTimeTracker.getTodayScreenTime();
          tray.setToolTip(`Today: ${Math.round(today / 60)} minutes`);
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  
  // Update tray tooltip every minute
  setInterval(() => {
    if (screenTimeTracker) {
      const today = screenTimeTracker.getTodayScreenTime();
      const hours = Math.floor(today / 3600);
      const minutes = Math.floor((today % 3600) / 60);
      tray.setToolTip(`Screen Time: ${hours}h ${minutes}m`);
    }
  }, 60000);
}

function initializeApp() {
  try {
    databaseManager = new DatabaseManager();
    screenTimeTracker = new ScreenTimeTracker(databaseManager);
    
    // Start tracking
    screenTimeTracker.startTracking();
    
    // Set up global shortcuts
    globalShortcut.register('Ctrl+Shift+T', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
    
    console.log('App initialized successfully');
  } catch (error) {
    console.error('Error initializing app:', error);
  }
}

app.whenReady().then(() => {
  createWindow();
  createTray();
  initializeApp();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (screenTimeTracker) {
    screenTimeTracker.stopTracking();
  }
});

// IPC handlers with proper error handling
ipcMain.handle('get-screen-time-data', async (event, period) => {
  try {
    if (screenTimeTracker) {
      return await screenTimeTracker.getScreenTimeData(period);
    }
    return [];
  } catch (error) {
    console.error('Error getting screen time data:', error);
    return [];
  }
});

ipcMain.handle('get-app-usage', async (event, period) => {
  try {
    if (screenTimeTracker) {
      return await screenTimeTracker.getAppUsageData(period);
    }
    return [];
  } catch (error) {
    console.error('Error getting app usage data:', error);
    return [];
  }
});

ipcMain.handle('get-today-stats', async () => {
  try {
    if (screenTimeTracker) {
      return await screenTimeTracker.getTodayStats();
    }
    return {
      date: new Date().toISOString().split('T')[0],
      screenTime: 0,
      appUsage: [],
      goal: 8 * 60 * 60000, // 8 hours in milliseconds
      goalPercentage: 0
    };
  } catch (error) {
    console.error('Error getting today stats:', error);
    return {
      date: new Date().toISOString().split('T')[0],
      screenTime: 0,
      appUsage: [],
      goal: 8 * 60 * 60000,
      goalPercentage: 0
    };
  }
});

// New IPC handlers for improved data visualization
ipcMain.handle('get-weekly-chart-data', async () => {
  try {
    if (databaseManager) {
      return await databaseManager.getWeeklyChartData();
    }
    return [];
  } catch (error) {
    console.error('Error getting weekly chart data:', error);
    return [];
  }
});

ipcMain.handle('get-app-category-data', async (event, period) => {
  try {
    if (databaseManager) {
      const endDate = new Date();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = new Date();
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 30);
          break;
        default:
          startDate = new Date();
          startDate.setDate(startDate.getDate() - 7);
      }
      
      return await databaseManager.getAppCategoryData(startDate, endDate);
    }
    return [];
  } catch (error) {
    console.error('Error getting app category data:', error);
    return [];
  }
});

ipcMain.handle('set-break-reminder', async (event, enabled, interval) => {
  try {
    if (screenTimeTracker) {
      screenTimeTracker.setBreakReminder(enabled, interval);
    }
  } catch (error) {
    console.error('Error setting break reminder:', error);
  }
});

ipcMain.handle('get-settings', async () => {
  try {
    if (screenTimeTracker) {
      return screenTimeTracker.getSettings();
    }
    return {
      breakReminderEnabled: false,
      breakReminderInterval: 60,
      dailyGoal: 480,
      weeklyGoal: 2400,
      notifications: true
    };
  } catch (error) {
    console.error('Error getting settings:', error);
    return {
      breakReminderEnabled: false,
      breakReminderInterval: 60,
      dailyGoal: 480,
      weeklyGoal: 2400,
      notifications: true
    };
  }
});

ipcMain.handle('update-settings', async (event, settings) => {
  try {
    if (screenTimeTracker) {
      await screenTimeTracker.updateSettings(settings);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
});
