Add-Type -TypeDefinition @'
using System;
using System.Runtime.InteropServices;
public class MciAudio {
    [DllImport("winmm.dll", EntryPoint = "mciSendStringA", ExactSpelling = true, CharSet = CharSet.Ansi, SetLastError = true)]
    public static extern int mciSendString(string lpstrCommand, string lpstrReturnString, int uReturnLength, int hwndCallback);
}
'@

Write-Host "Opening Windows WinMM audio recorder..."
[MciAudio]::mciSendString("open new Type waveaudio Alias recsound", $null, 0, 0)
[MciAudio]::mciSendString("set recsound time format ms bitspersample 16 channels 1 samplespersec 16000", $null, 0, 0)
[MciAudio]::mciSendString("record recsound", $null, 0, 0)
Write-Host "Recording for 2 seconds (listening for audio)..."
Start-Sleep -Seconds 2
[MciAudio]::mciSendString("save recsound scratch/test-mic.wav", $null, 0, 0)
[MciAudio]::mciSendString("close recsound", $null, 0, 0)

$wavPath = "scratch/test-mic.wav"
if (Test-Path $wavPath) {
    $bytes = [System.IO.File]::ReadAllBytes($wavPath)
    Write-Host "WAV file created! Size: $($bytes.Length) bytes"
    # Skip 44 bytes WAV header
    $samples = $bytes[44..($bytes.Length - 1)]
    $maxVal = 0
    for ($i = 0; $i -lt $samples.Length - 1; $i += 2) {
        $s = [BitConverter]::ToInt16($samples, $i)
        $abs = [Math]::Abs($s)
        if ($abs -gt $maxVal) { $maxVal = $abs }
    }
    Write-Host "Max Audio Sample Amplitude: $maxVal (out of 32767)"
    if ($maxVal -gt 100) {
        Write-Host "SUCCESS: Microphone is actively picking up sound!"
    } else {
        Write-Host "WARNING: Audio samples are flat/zero ($maxVal). Microphone is hardware-muted or volume is 0!"
    }
} else {
    Write-Host "FAILED: WAV file was not saved."
}
