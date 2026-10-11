const { runPowerShell } = require('../desktop-automator.js');

async function test() {
  const ps = `
    Add-Type -TypeDefinition '
    using System;
    using System.Collections.Generic;
    using System.Runtime.InteropServices;
    using System.Text;

    public class WinEnum {
        public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
        [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
        [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
        [DllImport("user32.dll")] public static extern int GetWindowTextLength(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        public static List<string> GetAllWindows() {
            List<string> result = new List<string>();
            EnumWindows((hWnd, lParam) => {
                if (IsWindowVisible(hWnd)) {
                    int length = GetWindowTextLength(hWnd);
                    if (length > 0) {
                        StringBuilder sb = new StringBuilder(length + 1);
                        GetWindowText(hWnd, sb, sb.Capacity);
                        uint pid;
                        GetWindowThreadProcessId(hWnd, out pid);
                        result.Add(pid + " | " + hWnd + " | " + sb.ToString());
                    }
                }
                return true;
            }, IntPtr.Zero);
            return result;
        }
    }
    ';

    $wins = [WinEnum]::GetAllWindows()
    foreach ($w in $wins) {
        Write-Output $w
    }
  `;
  const res = await runPowerShell(ps);
  console.log('Result:\n', res.stdout);
  process.exit(0);
}

test();
