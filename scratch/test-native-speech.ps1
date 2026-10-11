Add-Type -AssemblyName System.Speech
$rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$choices = New-Object System.Speech.Recognition.Choices
$choices.Add([string[]]@('hey buddy', 'buddy', 'hey unin', 'unin', 'namaste buddy', 'hello buddy', 'hi buddy'))
$gb = New-Object System.Speech.Recognition.GrammarBuilder($choices)
$g = New-Object System.Speech.Recognition.Grammar($gb)
$rec.LoadGrammar($g)
try {
  $rec.SetInputToDefaultAudioDevice()
  Write-Host "Default audio device connected successfully! Ready to spot wake words offline."
} catch {
  Write-Host "Audio input warning: $($_.Exception.Message)"
}
$rec.Dispose()
