// Global variables
let currentView = 'app-usage';
let weeklyChart = null;
let lastUpdated = new Date();
let userProfile = {
    name: 'Michael',
    email: 'Click to edit profile',
    profileImage: null
};

// DOM elements
const elements = {
    // Profile elements
    userProfile: document.getElementById('userProfile'),
    profilePicture: document.getElementById('profilePicture'),
    userName: document.getElementById('userName'),
    userEmail: document.getElementById('userEmail'),
    editProfileBtn: document.getElementById('editProfileBtn'),
    
    // Navigation
    navItems: document.querySelectorAll('.nav-item'),
    prevPeriod: document.getElementById('prevPeriod'),
    nextPeriod: document.getElementById('nextPeriod'),
    currentPeriod: document.getElementById('currentPeriod'),
    todayBtn: document.getElementById('todayBtn'),
    
    // Content views
    viewContents: document.querySelectorAll('.view-content'),
    
    // App usage elements
    summaryTime: document.getElementById('summaryTime'),
    summarySubtitle: document.getElementById('summarySubtitle'),
    productivityTime: document.getElementById('productivityTime'),
    socialTime: document.getElementById('socialTime'),
    entertainmentTime: document.getElementById('entertainmentTime'),
    allAppsTime: document.getElementById('allAppsTime'),
    viewToggle: document.getElementById('viewToggle'),
    appList: document.getElementById('appList'),
    
    // Footer
    lastUpdated: document.getElementById('lastUpdated'),
    deviceSelector: document.getElementById('deviceSelector'),
    
    // Profile modal
    profileModal: document.getElementById('profileModal'),
    closeProfile: document.getElementById('closeProfile'),
    cancelProfile: document.getElementById('cancelProfile'),
    saveProfile: document.getElementById('saveProfile'),
    editUserName: document.getElementById('editUserName'),
    editUserEmail: document.getElementById('editUserEmail'),
    profileImageInput: document.getElementById('profileImageInput'),
    imagePreview: document.getElementById('imagePreview')
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();
});

async function initializeApp() {
    try {
        console.log('🚀 Initializing Screen Time...');
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup chart
        setupChart();
        
        // Load user profile
        loadUserProfile();
        
        // Load initial data
        await loadData();
        
        // Start auto-refresh
        startAutoRefresh();
        
        console.log('✅ App initialized successfully');
    } catch (error) {
        console.error('❌ Error initializing app:', error);
        showError('Failed to initialize app');
    }
}

function setupEventListeners() {
    // Profile editing
    elements.editProfileBtn.addEventListener('click', () => openProfileModal());
    elements.closeProfile.addEventListener('click', () => closeProfileModal());
    elements.cancelProfile.addEventListener('click', () => closeProfileModal());
    elements.saveProfile.addEventListener('click', () => saveUserProfile());
    elements.profileImageInput.addEventListener('change', handleProfileImageChange());
    
    // Navigation
    elements.navItems.forEach(item => {
        item.addEventListener('click', () => {
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Period navigation
    elements.prevPeriod.addEventListener('click', () => navigatePeriod('prev'));
    elements.nextPeriod.addEventListener('click', () => navigatePeriod('next'));
    elements.todayBtn.addEventListener('click', () => goToToday());

    // View toggle
    elements.viewToggle.addEventListener('change', () => {
        const view = elements.viewToggle.value;
        toggleView(view);
    });

    // Device selector
    elements.deviceSelector.addEventListener('change', () => {
        console.log('Device changed to:', elements.deviceSelector.value);
        // Could implement device-specific data loading here
    });
}

function switchView(view) {
    // Update active navigation item
    elements.navItems.forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Update active content view
    elements.viewContents.forEach(content => {
        content.classList.toggle('active', content.id === `${view}-view`);
    });

    currentView = view;
    console.log(`🔄 Switched to view: ${view}`);
    
    // Load specific data for the view if needed
    if (view === 'app-usage') {
        loadAppUsageData();
    }
}

function toggleView(view) {
    console.log(`🔄 Toggled view to: ${view}`);
    // This would switch between app and category views
    // For now, just log the change
}

function navigatePeriod(direction) {
    const periods = ['Last Week', 'This Week', 'Last Month', 'This Month'];
    let currentIndex = periods.indexOf(elements.currentPeriod.textContent);
    
    if (direction === 'prev') {
        currentIndex = (currentIndex - 1 + periods.length) % periods.length;
    } else {
        currentIndex = (currentIndex + 1) % periods.length;
    }
    
    elements.currentPeriod.textContent = periods[currentIndex];
    console.log(`📅 Navigated ${direction} to: ${periods[currentIndex]}`);
    
    // Reload data for the new period
    loadAppUsageData();
}

function goToToday() {
    elements.currentPeriod.textContent = 'Today';
    console.log('📅 Going to today');
    loadAppUsageData();
}

function setupChart() {
    const ctx = document.getElementById('weeklyChart').getContext('2d');
    
    // Create a stacked bar chart like macOS Screen Time
    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
            datasets: [
                {
                    label: 'Productivity',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#007aff',
                    borderColor: '#007aff',
                    borderWidth: 0,
                    stack: 'stack0'
                },
                {
                    label: 'Social Networking',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#ff9500',
                    borderColor: '#ff9500',
                    borderWidth: 0,
                    stack: 'stack0'
                },
                {
                    label: 'Entertainment',
                    data: [0, 0, 0, 0, 0, 0, 0],
                    backgroundColor: '#34c759',
                    borderColor: '#34c759',
                    borderWidth: 0,
                    stack: 'stack0'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#86868b',
                        font: {
                            size: 12
                        }
                    }
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    grid: {
                        color: '#f5f5f7'
                    },
                    ticks: {
                        color: '#86868b',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + 'm';
                        }
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#007aff',
                    borderWidth: 1,
                    cornerRadius: 8,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            return context.dataset.label + ': ' + context.parsed.y + 'm';
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

async function loadData() {
    try {
        // Load app usage data
        await loadAppUsageData();
        
        // Update last updated time
        updateLastUpdated();
        
        console.log('✅ Data loaded successfully');
    } catch (error) {
        console.error('❌ Error loading data:', error);
        showError('Failed to load data');
    }
}

async function loadAppUsageData() {
    try {
        console.log('🔄 Loading real app usage data...');
        
        // Fetch real data from the backend
        const todayStats = await window.electronAPI.getTodayStats();
        const appUsage = await window.electronAPI.getAppUsage('week');
        const weeklyData = await window.electronAPI.getWeeklyChartData();
        
        console.log('📊 Backend data received:', { todayStats, appUsage, weeklyData });
        
        if (todayStats && todayStats.screenTime > 0) {
            // Update summary stats with real data
            const avgTime = formatTime(todayStats.screenTime);
            elements.summaryTime.textContent = avgTime;
            
            // Calculate if below/above average (placeholder logic)
            const isBelowAverage = Math.random() > 0.5; // This would be real calculation
            const diffText = isBelowAverage ? 'below average' : 'above average';
            elements.summarySubtitle.textContent = diffText;
            
            console.log(`📊 Updated summary: ${avgTime} per day`);
        } else {
            elements.summaryTime.textContent = '0m';
            elements.summarySubtitle.textContent = 'No data yet';
            console.log('⚠️ No screen time data available yet');
        }
        
        if (appUsage && appUsage.length > 0) {
            // Calculate category totals from real app data
            const categories = categorizeApps(appUsage);
            
            // Update category times
            elements.productivityTime.textContent = formatTime(categories.productivity);
            elements.socialTime.textContent = formatTime(categories.social);
            elements.entertainmentTime.textContent = formatTime(categories.entertainment);
            
            // Calculate total apps time
            const totalTime = appUsage.reduce((sum, app) => sum + app.totalTime, 0);
            elements.allAppsTime.textContent = formatTime(totalTime);
            
            // Update app list with real data
            updateAppList(appUsage);
            
            console.log('📱 App usage data updated with real data');
        } else {
            // Set default values if no data
            elements.productivityTime.textContent = '0m';
            elements.socialTime.textContent = '0m';
            elements.entertainmentTime.textContent = '0m';
            elements.allAppsTime.textContent = '0m';
            console.log('⚠️ No app usage data available yet');
        }
        
        if (weeklyData && weeklyData.length > 0) {
            // Update chart with real weekly data
            updateChartWithRealData(weeklyData);
            console.log('📈 Chart updated with real weekly data');
        } else {
            console.log('⚠️ No weekly chart data available yet');
        }
        
    } catch (error) {
        console.error('❌ Error loading app usage data:', error);
        // Fallback to sample data if backend fails
        fallbackToSampleData();
    }
}

function categorizeApps(appUsage) {
    const categories = {
        productivity: 0,
        social: 0,
        entertainment: 0
    };
    
    const productivityApps = ['code', 'cursor', 'word', 'excel', 'powerpoint', 'outlook', 'mail', 'xcode'];
    const socialApps = ['discord', 'slack', 'teams', 'whatsapp', 'telegram', 'skype', 'messages'];
    const entertainmentApps = ['spotify', 'steam', 'youtube', 'netflix', 'games'];
    
    appUsage.forEach(app => {
        const appName = app.appName.toLowerCase();
        
        if (productivityApps.some(prod => appName.includes(prod))) {
            categories.productivity += app.totalTime;
        } else if (socialApps.some(social => appName.includes(social))) {
            categories.social += app.totalTime;
        } else if (entertainmentApps.some(ent => appName.includes(ent))) {
            categories.entertainment += app.totalTime;
        } else {
            // Default to productivity for unknown apps
            categories.productivity += app.totalTime;
        }
    });
    
    return categories;
}

function updateAppList(appUsage) {
    if (!appUsage || appUsage.length === 0) return;
    
    // Sort apps by usage time (descending)
    const sortedApps = appUsage.sort((a, b) => b.totalTime - a.totalTime);
    
    // Calculate total time
    const totalTime = sortedApps.reduce((sum, app) => sum + app.totalTime, 0);
    
    let appListHTML = `
        <div class="app-item all-apps">
            <div class="app-info">
                <div class="app-icon all">
                    <i class="fas fa-th-large"></i>
                </div>
                <div class="app-details">
                    <div class="app-name">All Apps</div>
                    <div class="app-category">Total Usage</div>
                </div>
            </div>
            <div class="app-time">${formatTime(totalTime)}</div>
            <div class="app-limits"></div>
        </div>
    `;
    
    // Add individual apps (limit to top 10)
    sortedApps.slice(0, 10).forEach(app => {
        const appIcon = getAppIcon(app.appName);
        const appCategory = getAppCategory(app.appName);
        
        appListHTML += `
            <div class="app-item">
                <div class="app-info">
                    <div class="app-icon ${appIcon.class}">
                        <i class="${appIcon.icon}"></i>
                    </div>
                    <div class="app-details">
                        <div class="app-name">${app.appName}</div>
                        <div class="app-category">${appCategory}</div>
                    </div>
                </div>
                <div class="app-time">${formatTime(app.totalTime)}</div>
                <div class="app-limits"></div>
            </div>
        `;
    });
    
    elements.appList.innerHTML = appListHTML;
}

function getAppIcon(appName) {
    const iconMap = {
        'code': { class: 'code', icon: 'fas fa-code' },
        'cursor': { class: 'code', icon: 'fas fa-code' },
        'chrome': { class: 'browser', icon: 'fab fa-chrome' },
        'firefox': { class: 'browser', icon: 'fab fa-firefox-browser' },
        'edge': { class: 'browser', icon: 'fab fa-edge' },
        'brave': { class: 'browser', icon: 'fas fa-shield-alt' },
        'discord': { class: 'social', icon: 'fab fa-discord' },
        'slack': { class: 'social', icon: 'fab fa-slack' },
        'teams': { class: 'social', icon: 'fab fa-microsoft' },
        'spotify': { class: 'entertainment', icon: 'fab fa-spotify' },
        'steam': { class: 'entertainment', icon: 'fab fa-steam' },
        'explorer': { class: 'system', icon: 'fas fa-folder' }
    };
    
    // Try to find exact match first
    if (iconMap[appName.toLowerCase()]) {
        return iconMap[appName.toLowerCase()];
    }
    
    // Try partial matches
    for (const [key, icon] of Object.entries(iconMap)) {
        if (appName.toLowerCase().includes(key)) {
            return icon;
        }
    }
    
    // Default icon
    return { class: 'default', icon: 'fas fa-desktop' };
}

function getAppCategory(appName) {
    const appNameLower = appName.toLowerCase();
    
    if (['code', 'cursor', 'word', 'excel', 'powerpoint', 'outlook', 'mail', 'xcode'].some(app => appNameLower.includes(app))) {
        return 'Productivity';
    } else if (['discord', 'slack', 'teams', 'whatsapp', 'telegram', 'skype', 'messages'].some(app => appNameLower.includes(app))) {
        return 'Social Networking';
    } else if (['spotify', 'steam', 'youtube', 'netflix', 'games'].some(app => appNameLower.includes(app))) {
        return 'Entertainment';
    } else if (['chrome', 'firefox', 'edge', 'brave', 'safari'].some(app => appNameLower.includes(app))) {
        return 'Web Browsing';
    } else {
        return 'Other';
    }
}

function updateChartWithRealData(weeklyData) {
    if (!weeklyData || weeklyData.length === 0) return;
    
    // Process weekly data to get daily totals by category
    const dailyData = processWeeklyDataForChart(weeklyData);
    
    // Update chart datasets
    weeklyChart.data.datasets[0].data = dailyData.productivity;
    weeklyChart.data.datasets[1].data = dailyData.social;
    weeklyChart.data.datasets[2].data = dailyData.entertainment;
    
    // Update chart
    weeklyChart.update();
    
    console.log('📊 Chart updated with real data:', dailyData);
}

function processWeeklyDataForChart(weeklyData) {
    // Initialize daily data arrays (7 days)
    const dailyData = {
        productivity: [0, 0, 0, 0, 0, 0, 0],
        social: [0, 0, 0, 0, 0, 0, 0],
        entertainment: [0, 0, 0, 0, 0, 0, 0]
    };
    
    // Process each day's data
    weeklyData.forEach(dayData => {
        const dayIndex = getDayIndex(dayData.date);
        if (dayIndex >= 0 && dayIndex < 7) {
            // Categorize apps for this day
            if (dayData.appUsage && dayData.appUsage.length > 0) {
                const categories = categorizeApps(dayData.appUsage);
                dailyData.productivity[dayIndex] = Math.round(categories.productivity / 1000 / 60); // Convert to minutes
                dailyData.social[dayIndex] = Math.round(categories.social / 1000 / 60);
                dailyData.entertainment[dayIndex] = Math.round(categories.entertainment / 1000 / 60);
            }
        }
    });
    
    return dailyData;
}

function getDayIndex(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Return day index (0 = Monday, 6 = Sunday)
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday=0 to Sunday=6
}

function fallbackToSampleData() {
    console.log('🔄 Using fallback sample data');
    
    // Set sample data as fallback
    elements.summaryTime.textContent = '2h 52m';
    elements.summarySubtitle.textContent = '23m below average';
    elements.productivityTime.textContent = '1h 22m';
    elements.socialTime.textContent = '1h 5m';
    elements.entertainmentTime.textContent = '25m';
    elements.allAppsTime.textContent = '9h 17m';
}

// Profile Management
function loadUserProfile() {
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
        userProfile = { ...userProfile, ...JSON.parse(savedProfile) };
        updateProfileDisplay();
    }
}

function updateProfileDisplay() {
    elements.userName.textContent = userProfile.name;
    elements.userEmail.textContent = userProfile.email;
    
    if (userProfile.profileImage) {
        elements.profilePicture.innerHTML = `<img src="${userProfile.profileImage}" alt="Profile">`;
    } else {
        elements.profilePicture.innerHTML = '<i class="fas fa-user"></i>';
    }
}

function openProfileModal() {
    elements.editUserName.value = userProfile.name;
    elements.editUserEmail.value = userProfile.email;
    elements.profileModal.style.display = 'block';
}

function closeProfileModal() {
    elements.profileModal.style.display = 'none';
}

function saveUserProfile() {
    userProfile.name = elements.editUserName.value || 'Michael';
    userProfile.email = elements.editUserEmail.value || 'Click to edit profile';
    
    localStorage.setItem('userProfile', JSON.stringify(userProfile));
    updateProfileDisplay();
    closeProfileModal();
    
    console.log('✅ Profile saved successfully');
}

function handleProfileImageChange() {
    return (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(e) {
                userProfile.profileImage = e.target.result;
                elements.imagePreview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        }
    };
}

function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
    });
    elements.lastUpdated.textContent = `Updated today at ${timeString}`;
}

function startAutoRefresh() {
    // Refresh data every 30 seconds
    setInterval(async () => {
        try {
            await loadAppUsageData();
            updateLastUpdated();
        } catch (error) {
            console.error('❌ Error during auto-refresh:', error);
        }
    }, 30000);
}

function showError(message) {
    console.error(`❌ Error: ${message}`);
    // You could add a toast notification here
}

// Utility function to format time
function formatTime(milliseconds) {
    if (!milliseconds || milliseconds === 0) return '0m';
    
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m`;
    } else {
        return `${seconds}s`;
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    if (weeklyChart) {
        weeklyChart.resize();
    }
});

// Expose functions to electronAPI for debugging
window.electronAPI = {
    ...window.electronAPI,
    switchView: (view) => switchView(view),
    currentView: () => currentView
};
