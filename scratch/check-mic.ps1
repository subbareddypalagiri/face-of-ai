$code = @'
using System;
using System.Runtime.InteropServices;

[ComImport]
[Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
internal class MMDeviceEnumeratorCom {}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDeviceEnumerator {
    int NotImpl1();
    [PreserveSig]
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppDevice);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
internal interface IMMDevice {
    [PreserveSig]
    int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
}

[Guid("5CDF2C82-841E-4546-9722-0CF74078229A"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioEndpointVolume {
    int NotImpl1();
    int NotImpl2();
    int GetChannelCount(out uint pnChannelCount);
    int SetMasterVolumeLevel(float fLevelDB, ref Guid pguidEventContext);
    int SetMasterVolumeLevelScalar(float fLevel, ref Guid pguidEventContext);
    int GetMasterVolumeLevel(out float pfLevelDB);
    [PreserveSig]
    int GetMasterVolumeLevelScalar(out float pfLevel);
    [PreserveSig]
    int SetMute([MarshalAs(UnmanagedType.Bool)] bool bMute, ref Guid pguidEventContext);
    [PreserveSig]
    int GetMute([MarshalAs(UnmanagedType.Bool)] out bool pbMute);
}

public class AudioMaster {
    public static string GetCaptureMuteStatus() {
        var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorCom());
        IMMDevice dev;
        // eCapture = 1, eConsole = 0
        int hr = enumerator.GetDefaultAudioEndpoint(1, 0, out dev);
        if (hr != 0 || dev == null) return "No capture device found";
        var iid = typeof(IAudioEndpointVolume).GUID;
        object epvObj;
        dev.Activate(ref iid, 23, IntPtr.Zero, out epvObj);
        var epv = (IAudioEndpointVolume)epvObj;
        bool isMuted;
        epv.GetMute(out isMuted);
        float vol;
        epv.GetMasterVolumeLevelScalar(out vol);
        return "Windows Default Mic -> Muted: " + isMuted + " | Volume: " + Math.Round(vol * 100) + "%";
    }

    public static string UnmuteAndSetVolume(float targetVol = 0.85f) {
        var enumerator = (IMMDeviceEnumerator)(new MMDeviceEnumeratorCom());
        IMMDevice dev;
        int hr = enumerator.GetDefaultAudioEndpoint(1, 0, out dev);
        if (hr != 0 || dev == null) return "No capture device found";
        var iid = typeof(IAudioEndpointVolume).GUID;
        object epvObj;
        dev.Activate(ref iid, 23, IntPtr.Zero, out epvObj);
        var epv = (IAudioEndpointVolume)epvObj;
        Guid empty = Guid.Empty;
        epv.SetMute(false, ref empty);
        epv.SetMasterVolumeLevelScalar(targetVol, ref empty);
        return "SUCCESS: Unmuted and set volume to " + Math.Round(targetVol * 100) + "%";
    }
}
'@

Add-Type -TypeDefinition $code
[AudioMaster]::UnmuteAndSetVolume([float]0.95)
[AudioMaster]::GetCaptureMuteStatus()
