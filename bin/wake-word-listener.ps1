[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Speech

$rec = New-Object System.Speech.Recognition.SpeechRecognitionEngine
$choices = New-Object System.Speech.Recognition.Choices
$choices.Add([string[]]@('hey buddy', 'buddy', 'hey unin', 'unin', 'namaste buddy', 'hello buddy', 'hi buddy', 'ok unin'))

$gb = New-Object System.Speech.Recognition.GrammarBuilder($choices)
$g = New-Object System.Speech.Recognition.Grammar($gb)
$rec.LoadGrammar($g)

try {
  $rec.SetInputToDefaultAudioDevice()
  Register-ObjectEvent -InputObject $rec -EventName 'SpeechRecognized' -Action {
    $text = $Event.SourceEventArgs.Result.Text
    $conf = $Event.SourceEventArgs.Result.Confidence
    if ($conf -ge 0.40) {
      $json = @{
        event = "wake_word"
        word = $text
        confidence = [math]::Round($conf, 2)
      } | ConvertTo-Json -Compress
      [Console]::WriteLine($json)
    }
  } | Out-Null

  $rec.RecognizeAsync([System.Speech.Recognition.RecognizeMode]::Multiple)
  [Console]::WriteLine('{"event":"ready"}')
  
  while ($true) {
    Start-Sleep -Milliseconds 500
  }
} catch {
  $err = @{
    event = "error"
    message = $_.Exception.Message
  } | ConvertTo-Json -Compress
  [Console]::WriteLine($err)
} finally {
  $rec.Dispose()
}
