const { exec } = require('child_process');

console.log('🔍 Testing PowerShell app detection commands...\n');

// Test 1: Get current active app with better error handling
console.log('📱 Test 1: Getting current active app...');
const getActiveAppCommand = `
  try {
    # Get the process with the highest CPU usage that has a window
    $processes = Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Sort-Object CPU -Descending | Select-Object -First 1
    if ($processes) {
      Write-Host "SUCCESS:$($processes.ProcessName)"
    } else {
      # Fallback: get any visible process
      $visibleProcesses = Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object -First 1
      if ($visibleProcesses) {
        Write-Host "SUCCESS:$($visibleProcesses.ProcessName)"
      } else {
        Write-Host "SUCCESS:explorer"
      }
    }
  } catch {
    Write-Host "ERROR:$($_.Exception.Message)"
  }
`;

exec(`powershell -Command "${getActiveAppCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PowerShell execution error:', error.message);
  } else if (stderr) {
    console.log('⚠️  PowerShell warning:', stderr);
  } else {
    const output = stdout.trim();
    if (output.startsWith('SUCCESS:')) {
      const appName = output.replace('SUCCESS:', '');
      console.log('✅ Active app detected:', appName);
    } else if (output.startsWith('ERROR:')) {
      const errorMsg = output.replace('ERROR:', '');
      console.log('❌ PowerShell error:', errorMsg);
    } else {
      console.log('⚠️  Unexpected output:', output);
    }
  }
});

// Test 2: Get list of visible processes
console.log('\n📋 Test 2: Getting list of visible processes...');
const getVisibleProcessesCommand = `
  try {
    $visibleProcesses = Get-Process | Where-Object {$_.MainWindowTitle -ne ""} | Select-Object -First 5 ProcessName, MainWindowTitle, CPU
    if ($visibleProcesses) {
      Write-Host "SUCCESS:"
      $visibleProcesses | ForEach-Object {
        Write-Host "  $($_.ProcessName) - $($_.MainWindowTitle) (CPU: $($_.CPU))"
      }
    } else {
      Write-Host "SUCCESS:No visible processes found"
    }
  } catch {
    Write-Host "ERROR:$($_.Exception.Message)"
  }
`;

exec(`powershell -Command "${getVisibleProcessesCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PowerShell execution error:', error.message);
  } else if (stderr) {
    console.log('⚠️  PowerShell warning:', stderr);
  } else {
    const output = stdout.trim();
    if (output.startsWith('SUCCESS:')) {
      const content = output.replace('SUCCESS:', '');
      console.log('✅ Visible processes:');
      console.log(content);
    } else if (output.startsWith('ERROR:')) {
      const errorMsg = output.replace('ERROR:', '');
      console.log('❌ PowerShell error:', errorMsg);
    } else {
      console.log('⚠️  Unexpected output:', output);
    }
  }
});

// Test 3: Test basic PowerShell functionality
console.log('\n🧪 Test 3: Testing basic PowerShell functionality...');
const basicTestCommand = `
  try {
    $date = Get-Date
    $processCount = (Get-Process).Count
    Write-Host "SUCCESS:Date: $date, Process Count: $processCount"
  } catch {
    Write-Host "ERROR:$($_.Exception.Message)"
  }
`;

exec(`powershell -Command "${basicTestCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PowerShell execution error:', error.message);
  } else if (stderr) {
    console.log('⚠️  PowerShell warning:', stderr);
  } else {
    const output = stdout.trim();
    if (output.startsWith('SUCCESS:')) {
      const content = output.replace('SUCCESS:', '');
      console.log('✅ Basic PowerShell test:', content);
    } else if (output.startsWith('ERROR:')) {
      const errorMsg = output.replace('ERROR:', '');
      console.log('❌ PowerShell error:', errorMsg);
    } else {
      console.log('⚠️  Unexpected output:', output);
    }
  }
});

// Test 4: Test execution policy
console.log('\n🔒 Test 4: Checking PowerShell execution policy...');
const executionPolicyCommand = `
  try {
    $policy = Get-ExecutionPolicy -Scope CurrentUser
    Write-Host "SUCCESS:Current execution policy: $policy"
  } catch {
    Write-Host "ERROR:$($_.Exception.Message)"
  }
`;

exec(`powershell -Command "${executionPolicyCommand}"`, (error, stdout, stderr) => {
  if (error) {
    console.log('❌ PowerShell execution error:', error.message);
  } else if (stderr) {
    console.log('⚠️  PowerShell warning:', stderr);
  } else {
    const output = stdout.trim();
    if (output.startsWith('SUCCESS:')) {
      const content = output.replace('SUCCESS:', '');
      console.log('✅ Execution policy:', content);
    } else if (output.startsWith('ERROR:')) {
      const errorMsg = output.replace('ERROR:', '');
      console.log('❌ PowerShell error:', errorMsg);
    } else {
      console.log('⚠️  Unexpected output:', output);
    }
  }
});

console.log('\n📊 Testing completed. Check the output above for any errors.');
console.log('💡 If you see errors, try running: fix-powershell.bat');
console.log('🚀 If PowerShell is working, the app should now track screen time properly!');
