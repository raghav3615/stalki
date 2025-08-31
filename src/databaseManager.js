const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class DatabaseManager {
  constructor() {
    // Store database in user's local app data folder - NO CLOUD SYNC
    this.dbPath = path.join(process.env.APPDATA || process.env.HOME, 'ScreenTimeTracker', 'screentime.db');
    this.ensureDirectoryExists();
    this.initDatabase();
  }

  ensureDirectoryExists() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  initDatabase() {
    this.db = new sqlite3.Database(this.dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
      } else {
        console.log('Connected to local SQLite database - NO EXTERNAL CONNECTIONS');
        this.createTables();
      }
    });
  }

  createTables() {
    const createActivitiesTable = `
      CREATE TABLE IF NOT EXISTS activities (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        date TEXT NOT NULL,
        appName TEXT NOT NULL,
        duration INTEGER NOT NULL,
        isActive BOOLEAN NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSessionsTable = `
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        startTime INTEGER NOT NULL,
        endTime INTEGER NOT NULL,
        duration INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createAppUsageTable = `
      CREATE TABLE IF NOT EXISTS app_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        appName TEXT NOT NULL,
        duration INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSettingsTable = `
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_activities_date ON activities(date);
      CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp);
      CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
      CREATE INDEX IF NOT EXISTS idx_app_usage_date ON app_usage(date);
      CREATE INDEX IF NOT EXISTS idx_app_usage_app ON app_usage(appName);
      CREATE INDEX IF NOT EXISTS idx_app_usage_timestamp ON app_usage(timestamp);
    `;

    this.db.serialize(() => {
      this.db.run(createActivitiesTable);
      this.db.run(createSessionsTable);
      this.db.run(createAppUsageTable);
      this.db.run(createSettingsTable);
      this.db.run(createIndexes);
    });
  }

  async saveActivity(activity) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO activities (timestamp, date, appName, duration, isActive)
        VALUES (?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        activity.timestamp,
        activity.date,
        activity.appName,
        activity.duration,
        activity.isActive ? 1 : 0
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async saveAppUsage(appUsage) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO app_usage (date, appName, duration, timestamp)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([
        appUsage.date,
        appUsage.appName,
        appUsage.duration,
        appUsage.timestamp
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async saveSession(session) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO sessions (date, startTime, endTime, duration)
        VALUES (?, ?, ?, ?)
      `);
      
      stmt.run([
        session.date,
        session.startTime,
        session.endTime,
        session.duration
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  async getActivitiesByDate(date) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT * FROM activities 
        WHERE date = ? 
        ORDER BY timestamp ASC
      `, [date], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getScreenTimeData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      
      this.db.all(`
        SELECT 
          date,
          SUM(CASE WHEN isActive = 1 THEN duration ELSE 0 END) as activeTime,
          SUM(CASE WHEN isActive = 0 THEN duration ELSE 0 END) as inactiveTime,
          COUNT(DISTINCT appName) as uniqueApps
        FROM activities 
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `, [startDateStr, endDateStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getAppUsageData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      
      // Get precise app usage data from the new app_usage table
      this.db.all(`
        SELECT 
          appName,
          SUM(duration) as totalTime,
          COUNT(*) as usageCount,
          MAX(timestamp) as lastUsed,
          AVG(duration) as avgSessionTime
        FROM app_usage 
        WHERE date BETWEEN ? AND ?
        GROUP BY appName
        ORDER BY totalTime DESC
        LIMIT 20
      `, [startDateStr, endDateStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getDailyAppUsage(date) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          appName,
          SUM(duration) as totalTime,
          COUNT(*) as usageCount
        FROM app_usage 
        WHERE date = ?
        GROUP BY appName
        ORDER BY totalTime DESC
      `, [date], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getWeeklyChartData() {
    return new Promise((resolve, reject) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get daily breakdown for the weekly chart
      this.db.all(`
        SELECT 
          date,
          SUM(duration) as totalTime,
          COUNT(DISTINCT appName) as appsUsed
        FROM app_usage 
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `, [startDateStr, endDateStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // If no data, create empty entries for the week
          if (!rows || rows.length === 0) {
            const emptyWeek = [];
            for (let i = 6; i >= 0; i--) {
              const date = new Date();
              date.setDate(date.getDate() - i);
              emptyWeek.push({
                date: date.toISOString().split('T')[0],
                totalTime: 0,
                appsUsed: 0
              });
            }
            resolve(emptyWeek);
          } else {
            resolve(rows);
          }
        }
      });
    });
  }

  async getAppCategoryData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      
      // Categorize apps and get usage data
      this.db.all(`
        SELECT 
          CASE 
            WHEN appName IN ('chrome', 'firefox', 'edge', 'safari', 'explorer') THEN 'Web Browsing'
            WHEN appName IN ('word', 'excel', 'powerpoint', 'outlook', 'teams', 'slack') THEN 'Productivity'
            WHEN appName IN ('spotify', 'music', 'youtube', 'netflix', 'steam') THEN 'Entertainment'
            WHEN appName IN ('discord', 'skype', 'whatsapp', 'telegram') THEN 'Communication'
            WHEN appName IN ('photoshop', 'illustrator', 'blender', 'unity') THEN 'Creative'
            ELSE 'Other'
          END as category,
          SUM(duration) as totalTime,
          COUNT(DISTINCT appName) as uniqueApps
        FROM app_usage 
        WHERE date BETWEEN ? AND ?
        GROUP BY category
        ORDER BY totalTime DESC
      `, [startDateStr, endDateStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getSettings() {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT key, value FROM settings
      `, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const settings = {};
          if (rows && rows.length > 0) {
            rows.forEach(row => {
              try {
                settings[row.key] = JSON.parse(row.value);
              } catch (e) {
                settings[row.key] = row.value;
              }
            });
          }
          resolve(settings);
        }
      });
    });
  }

  async saveSettings(settings) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT OR REPLACE INTO settings (key, value, updated_at)
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `);
      
      const promises = Object.entries(settings).map(([key, value]) => {
        return new Promise((res, rej) => {
          stmt.run([key, JSON.stringify(value)], function(err) {
            if (err) {
              rej(err);
            } else {
              res();
            }
          });
        });
      });
      
      Promise.all(promises)
        .then(() => {
          stmt.finalize();
          resolve();
        })
        .catch(reject);
    });
  }

  async getDailyStats(days = 7) {
    return new Promise((resolve, reject) => {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      this.db.all(`
        SELECT 
          date,
          SUM(duration) as screenTime,
          COUNT(DISTINCT appName) as appsUsed
        FROM app_usage 
        WHERE date BETWEEN ? AND ?
        GROUP BY date
        ORDER BY date ASC
      `, [startDateStr, endDateStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async getTopApps(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(`
        SELECT 
          appName,
          SUM(duration) as totalTime,
          COUNT(*) as usageCount
        FROM app_usage 
        GROUP BY appName
        ORDER BY totalTime DESC
        LIMIT ?
      `, [limit], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  async cleanupOldData(daysToKeep = 90) {
    return new Promise((resolve, reject) => {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0];
      
      // Clean up old data from all tables
      this.db.run(`
        DELETE FROM activities WHERE date < ?
      `, [cutoffDateStr], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes);
        }
      });
    });
  }

  // Export data for local backup (NO CLOUD SYNC)
  async exportData(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const startDateStr = new Date(startDate).toISOString().split('T')[0];
      const endDateStr = new Date(endDate).toISOString().split('T')[0];
      
      this.db.all(`
        SELECT 
          'activities' as table_name,
          * FROM activities 
        WHERE date BETWEEN ? AND ?
        UNION ALL
        SELECT 
          'app_usage' as table_name,
          * FROM app_usage 
        WHERE date BETWEEN ? AND ?
        UNION ALL
        SELECT 
          'sessions' as table_name,
          * FROM sessions 
        WHERE date BETWEEN ? AND ?
      `, [startDateStr, endDateStr, startDateStr, endDateStr, startDateStr, endDateStr], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Local database connection closed - all data remains secure');
        }
      });
    }
  }
}

module.exports = { DatabaseManager };
