Get-Process | Where-Object { $_.MainWindowTitle -ne '' } | ForEach-Object {
    [PSCustomObject]@{
        Id = $_.Id
        ProcessName = $_.ProcessName
        Title = $_.MainWindowTitle
    }
} | Format-Table -AutoSize
