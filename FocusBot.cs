using System;
using System.Runtime.InteropServices;
using System.Threading;

namespace AuraBot {
    public class FocusBot {
        [DllImport("user32.dll")] public static extern bool SetCursorPos(int X, int Y);
        [DllImport("user32.dll")] public static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);
        [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
        [DllImport("user32.dll")] public static extern bool ShowWindowAsync(IntPtr hWnd, int nCmdShow);
        [DllImport("user32.dll")] public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        public static void Click(int x, int y) {
            SetCursorPos(x, y);
            mouse_event(0x02, 0, 0, 0, UIntPtr.Zero);
            Thread.Sleep(40);
            mouse_event(0x04, 0, 0, 0, UIntPtr.Zero);
        }

        public static void DoubleClick(int x, int y) {
            Click(x, y);
            Thread.Sleep(80);
            Click(x, y);
        }
    }
}
