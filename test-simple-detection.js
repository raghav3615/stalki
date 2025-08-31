const { exec } = require('child_process');

console.log('🧪 Testing Simple App Detection...\n');

// Test the new detection method
console.log('📱 Testing app detection...');
exec('tasklist /FO CSV /NH', (error, stdout) => {
  if (error) {
    console.log('❌ Tasklist failed:', error.message);
  } else {
    const lines = stdout.split('\n');
    console.log('✅ Found running processes:');
    
    // Priority apps we want to track (same as main app)
    const priorityApps = [
      'chrome', 'firefox', 'edge', 'msedge', 'brave',
      'code', 'cursor', 'notepad', 'wordpad',
      'winword', 'excel', 'powerpnt', 'outlook',
      'teams', 'slack', 'discord', 'spotify', 'steam',
      'photoshop', 'illustrator', 'blender', 'unity',
      'whatsapp', 'telegram', 'skype'
    ];
    
    let foundPriorityApp = null;
    let foundUserApp = null;
    
    // System processes to skip (same as main app)
    const systemProcesses = ['system idle process', 'system', 'secure system', 'registry', 'smss', 'csrss', 'wininit', 'services', 'lsaiso', 'lsass', 'svchost', 'conhost', 'fontdrvhost', 'dwm', 'nvcontainer', 'sihost', 'taskhostw', 'runtimebroker', 'backgroundtaskhost'];
    
    lines.forEach(line => {
      if (line.trim()) {
        const parts = line.split(',');
        if (parts.length >= 1) {
          const processName = parts[0].replace(/"/g, '');
          const cleanName = processName.replace('.exe', '');
          const processNameLower = cleanName.toLowerCase();
          
          console.log(`  - ${cleanName}`);
          
          // Check if it's a priority app (case-insensitive)
          if (!foundPriorityApp) {
            for (const priorityApp of priorityApps) {
              if (processNameLower.includes(priorityApp.toLowerCase())) {
                foundPriorityApp = cleanName;
                break;
              }
            }
          }
          
          // Check if it's a user app (not system)
          if (!foundUserApp && !systemProcesses.some(sys => processNameLower.includes(sys))) {
            foundUserApp = cleanName;
          }
        }
      }
    });
    
    console.log('\n🎯 Detection Results:');
    if (foundPriorityApp) {
      console.log(`✅ Priority app found: ${foundPriorityApp}`);
    } else {
      console.log('⚠️ No priority app found');
    }
    
    if (foundUserApp) {
      console.log(`📱 User app found: ${foundUserApp}`);
    } else {
      console.log('⚠️ No user app found');
    }
    
    console.log('\n💡 To test detection:');
    console.log('1. Open Chrome, Notepad, or any other application');
    console.log('2. Run the main app: npm start');
    console.log('3. Watch the console for app detection messages');
    
    console.log('\n🚀 Now testing the main app detection method...');
    testMainAppDetection();
  }
});

function testMainAppDetection() {
  // Simulate the main app's detection logic
  console.log('\n🔍 Simulating main app detection...');
  
  exec('tasklist /FO CSV /NH', (error, stdout) => {
    if (error) {
      console.log('❌ Tasklist failed in main app simulation');
      return;
    }
    
    const lines = stdout.split('\n');
    let bestApp = 'explorer';
    
    // Priority order for common apps - these are the ones we really want to track
    const priorityApps = [
      'chrome', 'firefox', 'edge', 'msedge', 'brave',
      'code', 'cursor', 'notepad', 'wordpad',
      'winword', 'excel', 'powerpnt', 'outlook',
      'teams', 'slack', 'discord', 'spotify', 'steam',
      'photoshop', 'illustrator', 'blender', 'unity',
      'whatsapp', 'telegram', 'skype'
    ];
    
    // First pass: look for priority apps (case-insensitive)
    for (const line of lines) {
      if (line.trim()) {
        const parts = line.split(',');
        if (parts.length >= 1) {
          const processName = parts[0].replace(/"/g, '').replace('.exe', '').toLowerCase();
          
          for (const priorityApp of priorityApps) {
            if (processName.includes(priorityApp.toLowerCase())) {
              bestApp = parts[0].replace(/"/g, '').replace('.exe', '');
              console.log(`🎯 Main app found priority app: ${bestApp}`);
              return;
            }
          }
        }
      }
    }
    
    // Second pass: look for any visible process that's not a system process
    const systemProcesses = ['system idle process', 'system', 'secure system', 'registry', 'smss', 'csrss', 'wininit', 'services', 'lsaiso', 'lsass', 'svchost', 'conhost', 'fontdrvhost', 'dwm', 'nvcontainer', 'sihost', 'taskhostw', 'runtimebroker', 'backgroundtaskhost'];
    
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
          if (processName && processName.length > 0) {
            bestApp = parts[0].replace(/"/g, '').replace('.exe', '');
            console.log(`📱 Main app found user process: ${bestApp}`);
            break;
          }
        }
      }
    }
    
    console.log(`🎯 Main app final result: ${bestApp}`);
  });
}

console.log('\n⏳ Running detection test...');
