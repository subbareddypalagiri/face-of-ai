using System;
using System.Text;
using System.Runtime.InteropServices;

public class WinFind {
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    public static void Main() {
        EnumWindows((hWnd, lParam) => {
            StringBuilder sbTitle = new StringBuilder(256);
            GetWindowText(hWnd, sbTitle, 256);
            StringBuilder sbClass = new StringBuilder(256);
            GetClassName(hWnd, sbClass, 256);
            uint pid;
            GetWindowThreadProcessId(hWnd, out pid);
            string title = sbTitle.ToString();
            string cls = sbClass.ToString();
            if (title.ToLower().Contains("whatsapp") || cls.ToLower().Contains("whatsapp")) {
                Console.WriteLine("HWND:" + hWnd + " | PID:" + pid + " | CLASS:" + cls + " | TITLE:" + title);
            }
            return true;
        }, IntPtr.Zero);
    }
}
