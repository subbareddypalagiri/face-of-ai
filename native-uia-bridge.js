// native-uia-bridge.js — SOTA Windows UI Automation (UIA) Engine for UNIN
// Directly targets OS Accessibility Tree nodes, sets values in RAM, and invokes controls without blind SendKeys.
'use strict';

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

/**
 * Execute native PowerShell script with optimal performance and silent progress
 */
function runPowerShell(script, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const fullScript = `
      $ProgressPreference = 'SilentlyContinue'
      [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
      ${script}
    `;
    const encoded = Buffer.from(fullScript, 'utf16le').toString('base64');
    exec(`powershell.exe -NoProfile -NonInteractive -EncodedCommand ${encoded}`, { timeout: timeoutMs }, (err, stdout, stderr) => {
      resolve({
        success: !err,
        stdout: (stdout || '').trim(),
        stderr: (stderr || '').trim(),
        error: err ? err.message : null
      });
    });
  });
}

/**
 * Find UI Automation element and set its value directly via ValuePattern / TextPattern
 * Works even if window is not topmost or partially occluded!
 */
async function setElementValue(windowTitleRegex, controlNameRegex, textToSet, controlType = 'Edit') {
  const psScript = `
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    Add-Type -AssemblyName WindowsBase

    $root = [System.Windows.Automation.AutomationElement]::RootElement

    # Step 1: Locate Target Window
    $winCondition = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Window
    )
    $allWindows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $winCondition)
    
    $targetWin = $null
    foreach ($win in $allWindows) {
        $name = $win.Current.Name
        if ($name -match '${windowTitleRegex.replace(/'/g, "''")}') {
            $targetWin = $win
            break
        }
    }

    if (-not $targetWin) {
        Write-Output "ERROR:WINDOW_NOT_FOUND"
        exit
    }

    # Step 2: Search for target control by ControlType and Name/AutomationId
    $cType = [System.Windows.Automation.ControlType]::${controlType}
    $typeCond = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        $cType
    )

    $controls = $targetWin.FindAll([System.Windows.Automation.TreeScope]::Descendants, $typeCond)
    $targetControl = $null

    foreach ($ctrl in $controls) {
        $ctrlName = $ctrl.Current.Name
        $autoId = $ctrl.Current.AutomationId
        if ($ctrlName -match '${controlNameRegex.replace(/'/g, "''")}' -or $autoId -match '${controlNameRegex.replace(/'/g, "''")}') {
            $targetControl = $ctrl
            break
        }
    }

    # Fallback: if controlNameRegex is empty, take first matching control type
    if (-not $targetControl -and [string]::IsNullOrWhiteSpace('${controlNameRegex.replace(/'/g, "''")}')) {
        if ($controls.Count -gt 0) {
            $targetControl = $controls[0]
        }
    }

    if (-not $targetControl) {
        Write-Output "ERROR:CONTROL_NOT_FOUND"
        exit
    }

    # Step 3: Inject text via ValuePattern directly into RAM
    $valPattern = $null
    try {
        $valPattern = $targetControl.GetCurrentPattern([System.Windows.Automation.ValuePattern]::Pattern)
    } catch {}

    if ($valPattern) {
        $valPattern.SetValue('${textToSet.replace(/'/g, "''")}')
        Write-Output "SUCCESS:VALUE_PATTERN_SET"
        exit
    }

    # Fallback Step 4: Set Focus and Native Paste
    try {
        $targetControl.SetFocus()
        Start-Sleep -Milliseconds 50
        [System.Windows.Forms.Clipboard]::SetText('${textToSet.replace(/'/g, "''")}')
        $ws = New-Object -ComObject WScript.Shell
        $ws.SendKeys('^a^v')
        Write-Output "SUCCESS:FOCUSED_AND_PASTED"
        exit
    } catch {
        Write-Output "ERROR:SET_FOCUS_FAILED"
    }
  `;

  const res = await runPowerShell(psScript);
  const out = res.stdout;

  return {
    success: out.includes('SUCCESS:'),
    method: out.includes('VALUE_PATTERN_SET') ? 'ValuePattern_Direct_RAM' : (out.includes('FOCUSED_AND_PASTED') ? 'Native_Focus_Paste' : 'failed'),
    window: windowTitleRegex,
    target: controlNameRegex,
    rawOutput: out,
    error: res.error || (out.startsWith('ERROR:') ? out : null)
  };
}

/**
 * Click a button or invoke a control directly via InvokePattern (Zero Coordinates Needed!)
 */
async function invokeElement(windowTitleRegex, buttonNameRegex, controlType = 'Button') {
  const psScript = `
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes

    $root = [System.Windows.Automation.AutomationElement]::RootElement

    $winCond = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        [System.Windows.Automation.ControlType]::Window
    )
    $allWindows = $root.FindAll([System.Windows.Automation.TreeScope]::Children, $winCond)

    $targetWin = $null
    foreach ($win in $allWindows) {
        if ($win.Current.Name -match '${windowTitleRegex.replace(/'/g, "''")}') {
            $targetWin = $win
            break
        }
    }

    if (-not $targetWin) {
        Write-Output "ERROR:WINDOW_NOT_FOUND"
        exit
    }

    $cType = [System.Windows.Automation.ControlType]::${controlType}
    $typeCond = New-Object System.Windows.Automation.PropertyCondition(
        [System.Windows.Automation.AutomationElement]::ControlTypeProperty,
        $cType
    )
    $controls = $targetWin.FindAll([System.Windows.Automation.TreeScope]::Descendants, $typeCond)

    $targetBtn = $null
    foreach ($ctrl in $controls) {
        $name = $ctrl.Current.Name
        $autoId = $ctrl.Current.AutomationId
        if ($name -match '${buttonNameRegex.replace(/'/g, "''")}' -or $autoId -match '${buttonNameRegex.replace(/'/g, "''")}') {
            $targetBtn = $ctrl
            break
        }
    }

    if (-not $targetBtn) {
        Write-Output "ERROR:BUTTON_NOT_FOUND"
        exit
    }

    try {
        $invokePattern = $targetBtn.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern)
        $invokePattern.Invoke()
        Write-Output "SUCCESS:INVOKE_PATTERN_FIRED"
        exit
    } catch {
        try {
            $togglePattern = $targetBtn.GetCurrentPattern([System.Windows.Automation.TogglePattern]::Pattern)
            $togglePattern.Toggle()
            Write-Output "SUCCESS:TOGGLE_PATTERN_FIRED"
            exit
        } catch {
            Write-Output "ERROR:INVOKE_FAILED"
        }
    }
  `;

  const res = await runPowerShell(psScript);
  const out = res.stdout;

  return {
    success: out.includes('SUCCESS:'),
    action: out.includes('INVOKE_PATTERN_FIRED') ? 'InvokePattern' : 'TogglePattern',
    button: buttonNameRegex,
    window: windowTitleRegex,
    rawOutput: out,
    error: res.error || (out.startsWith('ERROR:') ? out : null)
  };
}

module.exports = {
  setElementValue,
  invokeElement,
  runPowerShell
};
