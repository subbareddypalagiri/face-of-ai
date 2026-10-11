Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinInfo {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    public static void Dump() {
        EnumWindows((hWnd, lParam) => {
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            var sbTitle = new StringBuilder(256);
            GetWindowText(hWnd, sbTitle, 256);
            var sbClass = new StringBuilder(256);
            GetClassName(hWnd, sbClass, 256);
            string title = sbTitle.ToString();
            string cls = sbClass.ToString();
            bool vis = IsWindowVisible(hWnd);
            try {
                var p = System.Diagnostics.Process.GetProcessById((int)pid);
                if (p.ProcessName.IndexOf("whatsapp", StringComparison.OrdinalIgnoreCase) >= 0) {
                    Console.WriteLine("HWND: " + hWnd + " | PID: " + pid + " | Name: " + p.ProcessName + " | Vis: " + vis + " | Class: " + cls + " | Title: '" + title + "'");
                }
            } catch {}
            return true;
        }, IntPtr.Zero);
    }
}
'@

[WinInfo]::Dump()
