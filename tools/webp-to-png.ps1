# Giải mã WebP (giữ kênh trong suốt) bằng bộ giải mã của Windows, ghi ra .rgba thô rồi gọi tools/rgba2png.js.
# Dùng: powershell -File tools/webp-to-png.ps1 <vào.webp> <ra.png>
param([string]$In, [string]$Out)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[void][Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsRuntime]
[void][Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | ? { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, $type) { $t = $asTask.MakeGenericMethod($type).Invoke($null, @($op)); $t.Wait(-1) | Out-Null; $t.Result }
$p = (Resolve-Path $In).Path
$f = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($p)) ([Windows.Storage.StorageFile])
$s = Await ($f.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
$d = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($s)) ([Windows.Graphics.Imaging.BitmapDecoder])
$pd = Await ($d.GetPixelDataAsync([Windows.Graphics.Imaging.BitmapPixelFormat]::Rgba8, [Windows.Graphics.Imaging.BitmapAlphaMode]::Straight, (New-Object Windows.Graphics.Imaging.BitmapTransform), [Windows.Graphics.Imaging.ExifOrientationMode]::IgnoreExifOrientation, [Windows.Graphics.Imaging.ColorManagementMode]::DoNotColorManage)) ([Windows.Graphics.Imaging.PixelDataProvider])
$raw = [IO.Path]::ChangeExtension((Join-Path (Get-Location) $Out), 'rgba')
[IO.File]::WriteAllBytes($raw, $pd.DetachPixelData())
node (Join-Path $PSScriptRoot 'rgba2png.js') $raw $d.PixelWidth $d.PixelHeight (Join-Path (Get-Location) $Out)
Remove-Item $raw
