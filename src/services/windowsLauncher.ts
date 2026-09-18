/**
 * Windows Desktop Integration Utilities for TR Memorial English Boarding School Bell
 * Generates ready-to-run Windows Batch (.bat), URL shortcut (.url), and Auto-Boot scripts.
 */

export function getAppUrl(): string {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  return 'https://ais-pre-gp5c35f73ny3fsmsivsbw2-892037270957.asia-east1.run.app';
}

/**
 * Downloads a text file with a specified filename and mime type.
 */
export function triggerFileDownload(filename: string, content: string, mimeType = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Generates a Windows Batch Launcher (.bat) that launches Edge or Chrome in standalone --app mode.
 */
export function downloadWindowsBatchLauncher() {
  const url = getAppUrl();
  const scriptContent = `@echo off
:: ===============================================================
:: TR Memorial English Boarding School - Automatic Bell Launcher
:: Sukhad, Kailali | Public Address & Automatic Timetable System
:: ===============================================================

title TR Memorial School Bell System - Launching
echo.
echo ===============================================================
echo   TR MEMORIAL ENGLISH BOARDING SCHOOL - SMART BELL SYSTEM
echo   Sukhad, Kailali
echo ===============================================================
echo.
echo Launching School Bell in Dedicated Windows Desktop App Window...
echo.

:: Try Microsoft Edge in standalone app mode (built-in on all Windows 10/11)
start msedge --app="${url}" --window-size=1280,800
if %ERRORLEVEL% EQU 0 goto done

:: Try Google Chrome if Edge is unavailable
start chrome --app="${url}" --window-size=1280,800
if %ERRORLEVEL% EQU 0 goto done

:: Fallback to default Windows web browser
start "" "${url}"

:done
echo School Bell launched successfully!
exit
`;

  triggerFileDownload('Launch_TR_School_Bell.bat', scriptContent, 'application/x-bat');
}

/**
 * Generates an official Windows Internet Shortcut (.url) file.
 */
export function downloadWindowsUrlShortcut() {
  const url = getAppUrl();
  const shortcutContent = `[InternetShortcut]
URL=${url}
IconIndex=0
HotKey=0
[{000214A0-0000-0000-C000-000000000046}]
Prop3=19,11
`;

  triggerFileDownload('TR_Memorial_School_Bell.url', shortcutContent, 'text/plain');
}

/**
 * Generates a Windows Setup Batch file that registers the app into Windows Startup (%APPDATA%\\...\\Startup)
 * so it automatically starts every time the Windows PC boots up!
 */
export function downloadWindowsAutoBootScript() {
  const url = getAppUrl();
  const scriptContent = `@echo off
:: ===============================================================
:: TR Memorial English Boarding School - AutoStart on Boot Setup
:: sukhand, Kailali
:: ===============================================================

title TR Memorial Bell - AutoStart Setup
color 0A
cls
echo.
echo ===============================================================
echo   TR MEMORIAL ENGLISH BOARDING SCHOOL - WINDOWS AUTO-START
echo ===============================================================
echo.
echo This script sets up the School Bell to automatically open
echo whenever this Windows computer starts up or restarts.
echo.

set "STARTUP_FOLDER=%APPDATA%\\Microsoft\\Windows\\Start Menu\\Programs\\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\\TR_Memorial_School_Bell.url"

echo Creating Auto-Start shortcut in:
echo "%STARTUP_FOLDER%"
echo.

(
  echo [InternetShortcut]
  echo URL=${url}
  echo IconIndex=0
) > "%SHORTCUT_PATH%"

if exist "%SHORTCUT_PATH%" (
  echo.
  echo [SUCCESS] TR Memorial School Bell has been configured to Auto-Start!
  echo Whenever Windows boots up, the Bell System will automatically launch.
  echo.
) else (
  echo.
  echo [ERROR] Could not write to Windows Startup folder.
  echo Please run this script as Administrator or manually copy the shortcut to shell:startup
  echo.
)

pause
exit
`;

  triggerFileDownload('Setup_AutoBoot_Windows.bat', scriptContent, 'application/x-bat');
}
