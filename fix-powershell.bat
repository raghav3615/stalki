@echo off
echo Fixing PowerShell execution policy for Screen Time Tracker...
echo.

echo Current execution policy:
powershell -Command "Get-ExecutionPolicy -List"

echo.
echo Setting execution policy to RemoteSigned for current user...
powershell -Command "Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force"

echo.
echo New execution policy:
powershell -Command "Get-ExecutionPolicy -List"

echo.
echo Testing PowerShell commands...
node test-app-detection.js

echo.
echo If you see any errors above, please run the app again.
echo Press any key to continue...
pause > nul
