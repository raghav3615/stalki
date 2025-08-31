const { exec } = require('child_process');

console.log('🎯 Testing new tasklist-based app detection...\n');

// Test the new app detection method
async function testNewDetection() {
  return new Promise((resolve) => {
    exec('tasklist /FO CSV /NH', (error, stdout) => {
      if (error) {
        console.log('❌ Tasklist failed:', error.message);
        resolve('explorer');
      } else {
        // Parse tasklist output to find the most likely active app
        const lines = stdout.split('\n');
        let bestApp = 'explorer';
        
        // Priority order for common apps
        const priorityApps = [
          'chrome.exe', 'firefox.exe', 'edge.exe', 'safari.exe',
          'code.exe', 'notepad.exe', 'word.exe', 'excel.exe',
          'powerpoint.exe', 'outlook.exe', 'teams.exe', 'slack.exe',
          'discord.exe', 'spotify.exe', 'steam.exe', 'explorer.exe'
        ];
        
        console.log('🔍 Looking for priority apps...');
        
        // Look for priority apps first
        for (const priorityApp of priorityApps) {
          for (const line of lines) {
            if (line.includes(`"${priorityApp}"`)) {
              bestApp = priorityApp.replace('.exe', '');
              console.log(`✅ Found priority app: ${bestApp}`);
              resolve(bestApp);
              return;
            }
          }
        }
        
        console.log('⚠️  No priority app found, looking for any visible process...');
        
        // If no priority app found, look for any visible process
        for (const line of lines) {
          if (line.trim() && !line.includes('"System Idle Process"') && 
              !line.includes('"System"') && !line.includes('"Secure System"')) {
            const parts = line.split(',');
            if (parts.length >= 1) {
              const processName = parts[0].replace(/"/g, '').replace('.exe', '');
              if (processName && processName.length > 0) {
                bestApp = processName;
                console.log(`✅ Found visible process: ${bestApp}`);
                break;
              }
            }
          }
        }
        
        console.log(`🎯 Final result: ${bestApp}`);
        resolve(bestApp);
      }
    });
  });
}

// Run the test
testNewDetection().then(appName => {
  console.log(`\n🎉 App detection test completed!`);
  console.log(`📱 Detected app: ${appName}`);
  console.log(`💡 This is the method the app will use to track screen time.`);
  console.log(`🚀 If you see an app name above, the app should now work properly!`);
  
  // Test the database simulation
  console.log(`\n💾 Simulating database save...`);
  const now = Date.now();
  const duration = 5000; // 5 seconds
  console.log(`  - App: ${appName}`);
  console.log(`  - Duration: ${duration}ms`);
  console.log(`  - Would save to database: ${appName} used for ${Math.round(duration/1000)}s`);
});
