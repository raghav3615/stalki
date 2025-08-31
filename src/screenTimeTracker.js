const { exec } = require('child_process');
const moment = require('moment');

class ScreenTimeTracker {
  constructor(databaseManager) {
    this.databaseManager = databaseManager;
    this.isTracking = false;
    this.trackingInterval = null;
    this.appCheckInterval = null;
    this.lastActivityTime = Date.now();
    this.currentSessionStart = Date.now();
    this.breakReminderEnabled = false;
    this.breakReminderInterval = 60; // minutes
    this.lastBreakReminder = 0;
    this.currentActiveApp = 'Unknown';
    this.lastAppCheck = 0;
    this.appUsageData = new Map(); // Track usage in memory
    this.settings = {
      breakReminderEnabled: false,
      breakReminderInterval: 60,
      dailyGoal: 480, // 8 hours in minutes
      weeklyGoal: 2400, // 40 hours in minutes
      notifications: true
    };
    
    this.loadSettings();
  }

  async loadSettings() {
    try {
      const savedSettings = await this.databaseManager.getSettings();
      if (savedSettings && Object.keys(savedSettings).length > 0) {
        this.settings = { ...this.settings, ...savedSettings };
        this.breakReminderEnabled = this.settings.breakReminderEnabled;
        this.breakReminderInterval = this.settings.breakReminderInterval;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  startTracking() {
    if (this.isTracking) return;
    
    try {
      this.isTracking = true;
      this.currentSessionStart = Date.now();
      this.lastActivityTime = Date.now();
      this.lastAppCheck = Date.now();
      
      console.log('🚀 Starting screen time tracking...');
      
      // Track every 10 seconds for more frequent updates
      this.trackingInterval = setInterval(() => {
        try {
          this.trackActivity();
        } catch (error) {
          console.error('Error in tracking interval:', error);
        }
      }, 10000);
      
      // Check active app every 2 seconds for precise tracking
      this.appCheckInterval = setInterval(() => {
        try {
          this.checkActiveApp();
        } catch (error) {
          console.error('Error in app check interval:', error);
        }
      }, 2000);
      
      console.log('✅ Screen time tracking started with precise app detection');
      console.log('📱 Checking active app every 2 seconds');
      console.log('💾 Saving activity data every 10 seconds');
      
    } catch (error) {
      console.error('Error starting tracking:', error);
      this.isTracking = false;
    }
  }

  stopTracking() {
    if (!this.isTracking) return;
    
    try {
      this.isTracking = false;
      
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = null;
      }
      
      if (this.appCheckInterval) {
        clearInterval(this.appCheckInterval);
        this.appCheckInterval = null;
      }
      
      // Save final session data
      this.saveSessionData();
      
      // Save any remaining app usage data
      this.saveAllAppUsage();
      
      console.log('🛑 Screen time tracking stopped');
    } catch (error) {
      console.error('Error stopping tracking:', error);
    }
  }

  async checkActiveApp() {
    try {
      const newActiveApp = await this.getCurrentActiveApp();
      
      if (newActiveApp !== this.currentActiveApp) {
        // App changed, save the previous app's usage
        if (this.currentActiveApp !== 'Unknown') {
          const now = Date.now();
          const duration = now - this.lastAppCheck;
          
          if (duration > 1000) { // Only save if usage was more than 1 second
            try {
              this.recordAppUsage(this.currentActiveApp, duration);
              console.log(`💾 Recorded ${this.currentActiveApp} usage: ${Math.round(duration/1000)}s`);
            } catch (error) {
              console.error('Error recording app usage:', error);
            }
          }
        }
        
        this.currentActiveApp = newActiveApp;
        this.lastAppCheck = Date.now();
        console.log(`🔄 Active app changed to: ${newActiveApp}`);
      }
    } catch (error) {
      console.error('Error checking active app:', error);
      // Don't crash the app, just continue
    }
  }

  recordAppUsage(appName, duration) {
    try {
      const today = moment().format('YYYY-MM-DD');
      const key = `${today}_${appName}`;
      
      if (!this.appUsageData.has(key)) {
        this.appUsageData.set(key, {
          date: today,
          appName: appName,
          totalDuration: 0,
          sessions: 0
        });
      }
      
      const usage = this.appUsageData.get(key);
      usage.totalDuration += duration;
      usage.sessions += 1;
      
      console.log(`📊 ${appName}: ${Math.round(usage.totalDuration/1000)}s total, ${usage.sessions} sessions`);
    } catch (error) {
      console.error('Error in recordAppUsage:', error);
      throw error;
    }
  }

  async saveAllAppUsage() {
    try {
      for (const [key, usage] of this.appUsageData) {
        try {
          await this.databaseManager.saveAppUsage({
            date: usage.date,
            appName: usage.appName,
            duration: usage.totalDuration,
            timestamp: Date.now()
          });
        } catch (error) {
          console.error(`Error saving app usage for ${usage.appName}:`, error);
        }
      }
      
      // Clear the in-memory data
      this.appUsageData.clear();
      console.log('💾 All app usage data saved to database');
    } catch (error) {
      console.error('Error saving all app usage:', error);
    }
  }

  async trackActivity() {
    try {
      const now = Date.now();
      const today = moment().format('YYYY-MM-DD');
      
      // Save current app usage if it's been active
      if (this.currentActiveApp !== 'Unknown') {
        const duration = now - this.lastAppCheck;
        if (duration > 1000) {
          try {
            this.recordAppUsage(this.currentActiveApp, duration);
            this.lastAppCheck = now;
          } catch (error) {
            console.error('Error recording current app usage:', error);
          }
        }
      }
      
      // Save to database every 10 seconds
      try {
        await this.databaseManager.saveActivity({
          timestamp: now,
          date: today,
          appName: this.currentActiveApp,
          duration: 10000, // 10 seconds
          isActive: true
        });
        
        console.log(`📊 Activity logged: ${this.currentActiveApp} for 10s at ${new Date(now).toLocaleTimeString()}`);
      } catch (error) {
        console.error('Error saving activity to database:', error);
      }
      
      // Save app usage data every 10 seconds to ensure consistency
      try {
        await this.saveAllAppUsage();
      } catch (error) {
        console.error('Error saving app usage during tracking:', error);
      }
      
      // Check break reminder
      if (this.breakReminderEnabled) {
        try {
          const sessionDuration = now - this.currentSessionStart;
          this.checkBreakReminder(sessionDuration);
        } catch (error) {
          console.error('Error checking break reminder:', error);
        }
      }
      
      this.lastActivityTime = now;
    } catch (error) {
      console.error('Error tracking activity:', error);
    }
  }

  async getCurrentActiveApp() {
    return new Promise((resolve) => {
      try {
        // Use tasklist to get all running processes
        exec('tasklist /FO CSV /NH', (error, stdout) => {
          try {
            if (error) {
              console.log('Tasklist failed, using default app');
              resolve('explorer');
              return;
            }
            
            const lines = stdout.split('\n');
            let bestApp = 'explorer';
            let foundApps = [];
            
            // Priority order for common apps - these are the ones we really want to track
            // Order matters - put the most important ones first
            const priorityApps = [
              'discord', 'code', 'cursor', 'brave', 'chrome', 'firefox', 'edge', 'msedge',
              'notepad', 'wordpad', 'winword', 'excel', 'powerpnt', 'outlook',
              'teams', 'slack', 'spotify', 'steam', 'whatsapp', 'telegram', 'skype',
              'photoshop', 'illustrator', 'blender', 'unity', 'obs', 'zoom', 'webex',
              'notion', 'figma', 'canva', 'trello', 'asana', 'jira', 'confluence',
              'vscode', 'intellij', 'eclipse', 'android studio', 'xcode', 'terminal',
              'powershell', 'cmd', 'git', 'github', 'gitlab', 'bitbucket'
            ];
            
            // Enhanced unwanted processes list
            const unwantedProcesses = [
              'crash', 'handler', 'service', 'agent', 'webview', 'msedgewebview', 
              'background', 'runtime', 'helper', 'updater', 'installer', 'uninstaller',
              'bravecrash', 'crashhandler', 'crashreporter', 'crashpad', 'crashpad_handler',
              'crashreporter', 'crashpad_handler', 'crashpad_handler.exe', 'crashpad.exe',
              'crashreporter.exe', 'crashpad_handler.exe', 'crashpad.exe', 'crashreporter.exe',
              'msedgewebview2', 'webview2', 'webview', 'webview2.exe', 'webview.exe',
              'backgroundtaskhost', 'backgroundtaskhost.exe', 'backgroundtaskhost.exe',
              'runtimebroker', 'runtimebroker.exe', 'runtimebroker.exe',
              'taskhostw', 'taskhostw.exe', 'taskhostw.exe',
              'sihost', 'sihost.exe', 'sihost.exe',
              'nvcontainer', 'nvcontainer.exe', 'nvcontainer.exe',
              'fontdrvhost', 'fontdrvhost.exe', 'fontdrvhost.exe',
              'conhost', 'conhost.exe', 'conhost.exe',
              'dwm', 'dwm.exe', 'dwm.exe',
              'lsaiso', 'lsaiso.exe', 'lsaiso.exe',
              'lsass', 'lsass.exe', 'lsass.exe',
              'svchost', 'svchost.exe', 'svchost.exe',
              'wininit', 'wininit.exe', 'wininit.exe',
              'services', 'services.exe', 'services.exe',
              'csrss', 'csrss.exe', 'csrss.exe',
              'smss', 'smss.exe', 'smss.exe',
              'registry', 'registry.exe', 'registry.exe',
              'system', 'system.exe', 'system.exe',
              'secure system', 'secure system.exe', 'secure system.exe',
              'system idle process', 'system idle process.exe', 'system idle process.exe'
            ];
            
            // First pass: look for priority apps (case-insensitive), but skip unwanted processes
            for (const line of lines) {
              if (line.trim()) {
                const parts = line.split(',');
                if (parts.length >= 1) {
                  const processName = parts[0].replace(/"/g, '').replace('.exe', '').toLowerCase();
                  
                  // Skip unwanted processes
                  if (unwantedProcesses.some(unwanted => processName.includes(unwanted.toLowerCase()))) {
                    continue;
                  }
                  
                  for (const priorityApp of priorityApps) {
                    if (processName.includes(priorityApp.toLowerCase())) {
                      foundApps.push(parts[0].replace(/"/g, '').replace('.exe', ''));
                      if (foundApps.length === 1) { // First priority app found
                        bestApp = parts[0].replace(/"/g, '').replace('.exe', '');
                        console.log(`🎯 Found priority app: ${bestApp}`);
                      }
                    }
                  }
                }
              }
            }
            
            // If we found multiple priority apps, log them all
            if (foundApps.length > 1) {
              console.log(`📱 Found ${foundApps.length} priority apps: ${foundApps.join(', ')}`);
            }
            
            // Second pass: look for any visible process that's not a system process
            const systemProcesses = [
              'system idle process', 'system', 'secure system', 'registry', 'smss', 'csrss', 
              'wininit', 'services', 'lsaiso', 'lsass', 'svchost', 'conhost', 'fontdrvhost', 
              'dwm', 'nvcontainer', 'sihost', 'taskhostw', 'runtimebroker', 'backgroundtaskhost', 
              'crash', 'handler', 'service', 'agent', 'webview', 'msedgewebview', 'background', 
              'runtime', 'helper', 'updater', 'installer', 'uninstaller', 'msiexec', 'wuauserv',
              'spoolsv', 'alg', 'wscsvc', 'winlogon', 'csrss', 'wininit', 'services', 'lsm'
            ];
            
            for (const line of lines) {
              if (line.trim()) {
                const parts = line.split(',');
                if (parts.length >= 1) {
                  const processName = parts[0].replace(/"/g, '').replace('.exe', '').toLowerCase();
                  
                  // Skip system processes
                  if (systemProcesses.some(sys => processName.includes(sys))) {
                    continue;
                  }
                  
                  // If it's not a system process, it might be a user app
                  if (processName && processName.length > 0 && processName.length < 50) {
                    if (!foundApps.includes(parts[0].replace(/"/g, '').replace('.exe', ''))) {
                      foundApps.push(parts[0].replace(/"/g, '').replace('.exe', ''));
                    }
                  }
                }
              }
            }
            
            // Log all found apps for debugging
            if (foundApps.length > 0) {
              console.log(`📱 Total apps found: ${foundApps.length} - ${foundApps.join(', ')}`);
            }
            
            resolve(bestApp);
          } catch (error) {
            console.error('Error processing tasklist output:', error);
            resolve('explorer');
          }
        });
      } catch (error) {
        console.error('Error executing tasklist:', error);
        resolve('explorer');
      }
    });
  }

  checkBreakReminder(sessionDuration) {
    try {
      const now = Date.now();
      const minutesSinceLastBreak = (now - this.lastBreakReminder) / 60000;
      
      if (minutesSinceLastBreak >= this.breakReminderInterval) {
        this.showBreakReminder();
        this.lastBreakReminder = now;
      }
    } catch (error) {
      console.error('Error checking break reminder:', error);
    }
  }

  showBreakReminder() {
    console.log('⏰ Break reminder: Take a break!');
  }

  async saveSessionData() {
    try {
      const sessionDuration = Date.now() - this.currentSessionStart;
      const today = moment().format('YYYY-MM-DD');
      
      await this.databaseManager.saveSession({
        date: today,
        startTime: this.currentSessionStart,
        endTime: Date.now(),
        duration: sessionDuration
      });
      
      console.log(`💾 Session saved: ${Math.round(sessionDuration/1000)}s on ${today}`);
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  async getTodayScreenTime() {
    try {
      const today = moment().format('YYYY-MM-DD');
      const activities = await this.databaseManager.getActivitiesByDate(today);
      
      let totalTime = 0;
      if (activities && activities.length > 0) {
        activities.forEach(activity => {
          if (activity.isActive) {
            totalTime += activity.duration;
          }
        });
      }
      
      return totalTime;
    } catch (error) {
      console.error('Error getting today screen time:', error);
      return 0;
    }
  }

  async getScreenTimeData(period = 'week') {
    try {
      const endDate = moment();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = moment().startOf('day');
          break;
        case 'week':
          startDate = moment().subtract(7, 'days');
          break;
        case 'month':
          startDate = moment().subtract(30, 'days');
          break;
        default:
          startDate = moment().subtract(7, 'days');
      }
      
      const data = await this.databaseManager.getScreenTimeData(startDate.toDate(), endDate.toDate());
      return data || [];
    } catch (error) {
      console.error('Error getting screen time data:', error);
      return [];
    }
  }

  async getAppUsageData(period = 'week') {
    try {
      const endDate = moment();
      let startDate;
      
      switch (period) {
        case 'day':
          startDate = moment().startOf('day');
          break;
        case 'week':
          startDate = moment().subtract(7, 'days');
          break;
        case 'month':
          startDate = moment().subtract(30, 'days');
          break;
        default:
          startDate = moment().subtract(7, 'days');
      }
      
      const data = await this.databaseManager.getAppUsageData(startDate.toDate(), endDate.toDate());
      return data || [];
    } catch (error) {
      console.error('Error getting app usage data:', error);
      return [];
    }
  }

  async getTodayStats() {
    try {
      const today = moment().format('YYYY-MM-DD');
      
      // Get screen time from activities table
      const screenTime = await this.getTodayScreenTime();
      
      // Get app usage from app_usage table for today
      const appUsage = await this.databaseManager.getDailyAppUsage(today);
      
      return {
        date: today,
        screenTime,
        appUsage: appUsage || [],
        goal: this.settings.dailyGoal * 60000, // Convert to milliseconds
        goalPercentage: Math.min((screenTime / (this.settings.dailyGoal * 60000)) * 100, 100)
      };
    } catch (error) {
      console.error('Error getting today stats:', error);
      return {
        date: moment().format('YYYY-MM-DD'),
        screenTime: 0,
        appUsage: [],
        goal: this.settings.dailyGoal * 60000,
        goalPercentage: 0
      };
    }
  }

  setBreakReminder(enabled, interval) {
    try {
      this.breakReminderEnabled = enabled;
      this.breakReminderInterval = interval;
      this.settings.breakReminderEnabled = enabled;
      this.settings.breakReminderInterval = interval;
      this.saveSettings();
    } catch (error) {
      console.error('Error setting break reminder:', error);
    }
  }

  getSettings() {
    return this.settings;
  }

  async updateSettings(newSettings) {
    try {
      this.settings = { ...this.settings, ...newSettings };
      this.breakReminderEnabled = this.settings.breakReminderEnabled;
      this.breakReminderInterval = this.settings.breakReminderInterval;
      await this.saveSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  async saveSettings() {
    try {
      await this.databaseManager.saveSettings(this.settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}

module.exports = { ScreenTimeTracker };
