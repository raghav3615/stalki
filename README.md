# Screen Time Tracker for Windows

A comprehensive desktop application that tracks your computer usage time, similar to the screen time features on iPhones and Android devices. Built with Electron and JavaScript for Windows.

## 🚀 Features

### 📊 **Real-time Tracking**
- Monitors active screen time continuously
- Tracks which applications you use most
- Records session data and user activity

### 📈 **Beautiful Dashboard**
- Modern, responsive UI with gradient backgrounds
- Interactive charts showing screen time trends
- App usage statistics and breakdowns
- Daily, weekly, and monthly views

### ⏰ **Smart Notifications**
- Break reminders to prevent eye strain
- Customizable reminder intervals
- Desktop notifications support
- Goal tracking and progress indicators

### 🎯 **Goal Setting**
- Set daily and weekly screen time goals
- Visual progress bars and percentages
- Weekly averages and trends
- Achievement tracking

### 🔧 **Customizable Settings**
- Break reminder preferences
- Daily/weekly goal configuration
- Notification settings
- Data retention policies

### 💾 **Data Persistence**
- SQLite database for reliable data storage
- Automatic data cleanup (configurable)
- Export capabilities for data analysis
- Secure data handling

## 🛠️ Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Windows 10/11

### Quick Start

1. **Clone or download the project**
   ```bash
   git clone <repository-url>
   cd screen-time-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Run the application**
   ```bash
   npm start
   ```

4. **Build for distribution**
   ```bash
   npm run build
   ```

## 📱 Usage

### First Launch
1. The app will start tracking automatically
2. Grant notification permissions when prompted
3. Customize your settings in the Settings panel
4. Set your daily screen time goals

### Daily Use
- **Minimize to tray**: The app runs in the background
- **View dashboard**: Click the tray icon or use Ctrl+Shift+T
- **Monitor progress**: Check your daily goals and usage
- **Take breaks**: Follow the reminder notifications

### Navigation
- **Overview Cards**: Quick stats at a glance
- **Charts**: Interactive visualizations of your data
- **Settings**: Customize reminders and goals
- **Period Toggle**: Switch between week/month views

## 🎨 Interface Overview

### Main Dashboard
- **Today's Screen Time**: Current day usage with goal progress
- **Apps Used Today**: Number of different applications
- **Weekly Average**: Average daily usage this week
- **Break Reminder Status**: Current reminder settings

### Charts Section
- **Screen Time Trend**: Line chart showing usage over time
- **Top Apps**: Doughnut chart of most-used applications
- **Period Controls**: Toggle between week/month views

### Detailed Statistics
- **Daily Breakdown**: Day-by-day usage summary
- **App Usage Details**: Top applications with time spent

## ⚙️ Configuration

### Break Reminders
- Enable/disable break notifications
- Set custom reminder intervals (15-180 minutes)
- Desktop notification support

### Goals
- **Daily Goal**: Set target hours per day (1-24 hours)
- **Weekly Goal**: Set target hours per week (10-168 hours)
- Visual progress indicators

### Notifications
- Desktop notification permissions
- Success/error message display
- Break reminder alerts

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally on your device
- **No Cloud Sync**: Your usage data stays private
- **Secure IPC**: Safe communication between processes
- **Data Cleanup**: Automatic removal of old data (90 days default)

## 🏗️ Technical Architecture

### Backend (Main Process)
- **Electron**: Cross-platform desktop framework
- **ScreenTimeTracker**: Core tracking logic
- **DatabaseManager**: SQLite data operations
- **PowerShell Integration**: Windows-specific process monitoring

### Frontend (Renderer Process)
- **Modern HTML5/CSS3**: Responsive design
- **Chart.js**: Interactive data visualizations
- **Vanilla JavaScript**: No heavy frameworks
- **Responsive Grid**: Mobile-friendly layout

### Data Flow
```
User Activity → PowerShell Commands → ScreenTimeTracker → DatabaseManager → SQLite
                                    ↓
                              IPC Communication → Renderer Process → Charts & UI
```

## 🚀 Development

### Project Structure
```
screen-time-tracker/
├── src/
│   ├── screenTimeTracker.js    # Core tracking logic
│   ├── databaseManager.js      # Database operations
│   ├── preload.js             # Secure IPC bridge
│   ├── index.html             # Main UI
│   ├── styles.css             # Styling
│   └── renderer.js            # Frontend logic
├── assets/
│   └── icon.png               # App icon
├── main.js                    # Electron main process
├── package.json               # Dependencies & scripts
└── README.md                  # This file
```

### Key Technologies
- **Electron**: Desktop app framework
- **SQLite3**: Local database
- **Chart.js**: Data visualization
- **Moment.js**: Date handling
- **PowerShell**: Windows process monitoring

### Development Commands
```bash
npm start          # Run in development mode
npm run dev        # Run with dev flags
npm run build      # Build for distribution
npm run pack       # Package without distribution
npm run dist       # Create distributable
```

## 📊 Data Schema

### Activities Table
- `id`: Unique identifier
- `timestamp`: Activity timestamp
- `date`: Date string (YYYY-MM-DD)
- `appName`: Application name
- `duration`: Duration in milliseconds
- `isActive`: Active status boolean

### Sessions Table
- `id`: Unique identifier
- `date`: Session date
- `startTime`: Session start timestamp
- `endTime`: Session end timestamp
- `duration`: Total session duration

### Settings Table
- `key`: Setting name
- `value`: Setting value (JSON)
- `updated_at`: Last modification time

## 🐛 Troubleshooting

### Common Issues

**App won't start**
- Ensure Node.js is installed (v16+)
- Check all dependencies are installed
- Verify PowerShell execution policy

**No data showing**
- Check if tracking is enabled
- Verify database permissions
- Check console for error messages

**Charts not rendering**
- Ensure Chart.js is loaded
- Check browser console for errors
- Verify canvas elements exist

**Break reminders not working**
- Check notification permissions
- Verify reminder settings
- Check system notification settings

### Debug Mode
```bash
npm run dev
```
This runs the app with additional debugging information.

### Logs
Check the console output for detailed error messages and tracking information.

## 🔮 Future Enhancements

- **Cross-platform Support**: macOS and Linux versions
- **Cloud Sync**: Optional cloud backup
- **Advanced Analytics**: Detailed usage insights
- **Productivity Features**: Focus time tracking
- **API Integration**: Export to other tools
- **Mobile Companion**: Phone app integration

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

If you encounter any issues or have questions:

1. Check the troubleshooting section
2. Review the console logs
3. Open an issue on GitHub
4. Check the documentation

## 🙏 Acknowledgments

- **Electron Team**: For the amazing desktop framework
- **Chart.js**: For beautiful data visualizations
- **Font Awesome**: For the icon set
- **Open Source Community**: For inspiration and tools

---

**Happy Tracking! 📱💻⏰**

*Monitor your digital habits, set healthy boundaries, and improve your productivity with Screen Time Tracker.*
