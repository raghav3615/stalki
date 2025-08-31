const { exec } = require('child_process');

console.log('🧪 Testing Real App Detection...\n');

// Test the new PowerShell detection method
console.log('🔍 Testing PowerShell app detection...');
const detectionCommand = `
  try {
    $processes = Get-Process | Where-Object {$_.MainWindowTitle -ne "" -and $_.CPU -gt 0} | Sort-Object CPU -Descending | Select-Object -First 10 ProcessName, CPU, MainWindowTitle
    
    if ($processes) {
      Write-Host "SUCCESS: Found processes with windows:"
      $processes | ForEach-Object {
        Write-Host "  $($_.ProcessName) - CPU: $($_.CPU) - Window: $($_.MainWindowTitle)"
      }
      
      $commonApps = @('chrome', 'firefox', 'edge', 'code', 'notepad', 'word', 'excel', 'powerpoint', 'outlook', 'teams', 'slack', 'discord', 'spotify', 'steam')
      
      Write-Host "Looking for common apps..."
      foreach ($app in $commonApps) {
        $found = $processes | Where-Object {$_.ProcessName -like "*$app*"}
        if ($found) {
          Write-Host "Found: $($found[0].ProcessName)"
          break
        }
      }
      
      $topProcess = $processes[0].ProcessName
      Write-Host "Top process: $topProcess"
      Write-Output $topProcess
    } else {
      Write-Host "WARNING: No processes with windows found"
      Write-Output "explorer"
    }
  } catch {
    Write-Host "ERROR: $($_.Exception.Message)"
    Write-Output "explorer"
  }
`;

exec(`powershell -Command "${detectionCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PowerShell execution error:', error.message);
    console.log('💡 Trying fallback detection...');
    testFallbackDetection();
  } else if (stderr) {
    console.log('⚠️ PowerShell warning:', stderr);
  } else {
    const output = stdout.trim();
    if (output && output !== 'explorer') {
      console.log(`✅ Successfully detected app: ${output}`);
    } else {
      console.log('⚠️ No specific app detected, using explorer');
    }
  }
});

function testFallbackDetection() {
  console.log('\n📋 Testing fallback tasklist detection...');
  exec('tasklist /FO CSV /NH', (error, stdout) => {
    if (error) {
      console.log('❌ Tasklist failed:', error.message);
    } else {
      const lines = stdout.split('\n');
      console.log('✅ Found running processes:');
      
      // Look for common apps
      const commonApps = ['chrome.exe', 'firefox.exe', 'edge.exe', 'code.exe', 'notepad.exe'];
      let foundApp = null;
      
      lines.forEach(line => {
        if (line.trim()) {
          const parts = line.split(',');
          if (parts.length >= 1) {
            const processName = parts[0].replace(/"/g, '');
            console.log(`  - ${processName}`);
            
            // Check if it's a common app
            if (!foundApp && commonApps.some(app => processName.includes(app))) {
              foundApp = processName.replace('.exe', '');
            }
          }
        }
      });
      
      if (foundApp) {
        console.log(`\n🎯 Found common app: ${foundApp}`);
      } else {
        console.log('\n⚠️ No common apps found');
      }
    }
  });
}

console.log('\n⏳ Running detection tests...');
console.log('💡 Open some applications (Chrome, Notepad, etc.) to see detection in action!');
