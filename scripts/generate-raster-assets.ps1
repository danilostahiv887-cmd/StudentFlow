Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$badgeDir = Join-Path $root 'public\seed-images\badges'
$clubDir = Join-Path $root 'public\seed-images\clubs'
$systemDir = Join-Path $root 'public\seed-images\system'
New-Item -ItemType Directory -Force -Path $badgeDir, $clubDir, $systemDir | Out-Null

$palette = @(
  [System.Drawing.Color]::FromArgb(38, 198, 218),
  [System.Drawing.Color]::FromArgb(126, 87, 194),
  [System.Drawing.Color]::FromArgb(190, 226, 75),
  [System.Drawing.Color]::FromArgb(255, 105, 97),
  [System.Drawing.Color]::FromArgb(50, 211, 153),
  [System.Drawing.Color]::FromArgb(251, 191, 36),
  [System.Drawing.Color]::FromArgb(96, 165, 250),
  [System.Drawing.Color]::FromArgb(244, 114, 182)
)

for ($i = 0; $i -lt $palette.Count; $i++) {
  $bitmap = [System.Drawing.Bitmap]::new(256, 256)
  $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
  $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $graphics.Clear([System.Drawing.Color]::FromArgb(25, 27, 31))
  $brush = [System.Drawing.SolidBrush]::new($palette[$i])
  $graphics.FillEllipse($brush, 24, 24, 208, 208)
  $inner = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(25, 27, 31))
  $graphics.FillEllipse($inner, 57, 57, 142, 142)
  $font = [System.Drawing.Font]::new('Segoe UI', 54, [System.Drawing.FontStyle]::Bold)
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $graphics.DrawString(($i + 1).ToString(), $font, $brush, [System.Drawing.RectangleF]::new(0, 0, 256, 256), $format)
  $bitmap.Save((Join-Path $badgeDir ("badge-{0}.png" -f ($i + 1))), [System.Drawing.Imaging.ImageFormat]::Png)
  $font.Dispose(); $format.Dispose(); $inner.Dispose(); $brush.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
}

$atlas = Join-Path $root 'public\seed-images\activities\campus-pulse-atlas.png'
foreach ($club in @('science', 'it-community', 'debate', 'culture', 'sport')) {
  Copy-Item -LiteralPath $atlas -Destination (Join-Path $clubDir "$club.png") -Force
}

$iconBitmap = [System.Drawing.Bitmap]::new(128, 128)
$iconGraphics = [System.Drawing.Graphics]::FromImage($iconBitmap)
$iconGraphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$iconGraphics.Clear([System.Drawing.Color]::FromArgb(25, 27, 31))
$aqua = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(38, 198, 218))
$violet = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::FromArgb(126, 87, 194))
$iconGraphics.FillRectangle($aqua, 17, 17, 42, 94)
$iconGraphics.FillRectangle($violet, 69, 17, 42, 94)
$iconBitmap.Save((Join-Path $root 'public\favicon-32x32.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$iconBitmap.Save((Join-Path $root 'public\apple-touch-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)
$icon = [System.Drawing.Icon]::FromHandle($iconBitmap.GetHicon())
$stream = [System.IO.File]::Open((Join-Path $root 'public\favicon.ico'), [System.IO.FileMode]::Create)
$icon.Save($stream)
$stream.Dispose(); $icon.Dispose(); $aqua.Dispose(); $violet.Dispose(); $iconGraphics.Dispose(); $iconBitmap.Dispose()
Copy-Item -LiteralPath (Join-Path $root 'public\favicon-32x32.png') -Destination (Join-Path $root 'public\favicon-16x16.png') -Force
