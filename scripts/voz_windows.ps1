# Genera audios con las voces de IA de Windows (incluye las OneCore como Raul y Sabina).
# Lo llama `npm run locutor -- --ia`; no hace falta correrlo a mano.
#   powershell -File voz_windows.ps1 lista.json
#   lista.json = [{"voz": "Raul", "ssml": "<speak ...>", "wav": "C:/.../0.wav"}, ...]
param([Parameter(Mandatory = $true)][string]$Lista)
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } | Select-Object -First 1
function Esperar($op, [Type]$tipo) { $t = $asTask.MakeGenericMethod($tipo).Invoke($null, @($op)); $t.Wait(); $t.Result }

$items = Get-Content -Raw -Encoding UTF8 $Lista | ConvertFrom-Json
$todas = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices
$s = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$i = 0
foreach ($it in $items) {
  $i++
  $voz = $todas | Where-Object { $_.DisplayName -like "*$($it.voz)*" } | Select-Object -First 1
  if (-not $voz) { throw "No encuentro la voz '$($it.voz)' en Windows (Configuracion > Hora e idioma > Voz)" }
  $s.Voice = $voz
  $stream = Esperar ($s.SynthesizeSsmlToStreamAsync($it.ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $n = [uint32]$stream.Size
  $null = Esperar ($reader.LoadAsync($n)) ([uint32])
  $bytes = New-Object byte[] $n
  $reader.ReadBytes($bytes)
  [System.IO.File]::WriteAllBytes($it.wav, $bytes)
  $reader.Dispose(); $stream.Dispose()
  if ($i % 25 -eq 0) { Write-Host "  [$i/$($items.Count)]" }
}
