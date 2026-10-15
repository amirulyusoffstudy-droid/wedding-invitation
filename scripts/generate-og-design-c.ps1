Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 1200
$outputPath = "public/images/og-design-c.jpg"
$paperPath = "src/assets/design-c-paper.png"

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = "AntiAlias"
$graphics.InterpolationMode = "HighQualityBicubic"
$graphics.PixelOffsetMode = "HighQuality"
$graphics.TextRenderingHint = "AntiAliasGridFit"

$backgroundBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 247, 251))
$graphics.FillRectangle($backgroundBrush, 0, 0, $width, $height)

$paper = [System.Drawing.Image]::FromFile((Resolve-Path $paperPath))
$targetHeight = $height
$targetWidth = [int]($paper.Width * $targetHeight / $paper.Height)
$targetX = [int](($width - $targetWidth) / 2)
$graphics.DrawImage($paper, $targetX, 0, $targetWidth, $targetHeight)

$olive = [System.Drawing.Color]::FromArgb(255, 146, 144, 78)
$textBrush = New-Object System.Drawing.SolidBrush($olive)

$titleFont = New-Object System.Drawing.Font("Garamond", 58, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$nameFont = New-Object System.Drawing.Font("Segoe Script", 42, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$ampFont = New-Object System.Drawing.Font("Segoe Script", 30, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$detailFont = New-Object System.Drawing.Font("Garamond", 38, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
$hashFont = New-Object System.Drawing.Font("Garamond", 36, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

$center = New-Object System.Drawing.StringFormat
$center.Alignment = "Center"
$center.LineAlignment = "Center"

$graphics.DrawString("Majlis", $titleFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 258, $width, 58)), $center)
$graphics.DrawString("Raikan Cinta", $titleFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 310, $width, 62)), $center)

$graphics.DrawString("Erni Alysya", $nameFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 434, $width, 54)), $center)
$graphics.DrawString("&", $ampFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 482, $width, 30)), $center)
$graphics.DrawString("Muhammad Amirul", $nameFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 510, $width, 58)), $center)

$graphics.DrawString("26 December 2026", $detailFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 640, $width, 44)), $center)
$graphics.DrawString("Inap D'Bondang Resort", $detailFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 688, $width, 44)), $center)
$graphics.DrawString("#AmiruLamarErni", $hashFont, $textBrush, (New-Object System.Drawing.RectangleF(0, 768, $width, 42)), $center)

$bitmap.Save($outputPath, [System.Drawing.Imaging.ImageFormat]::Jpeg)

$graphics.Dispose()
$bitmap.Dispose()
$paper.Dispose()
$backgroundBrush.Dispose()
$textBrush.Dispose()
$titleFont.Dispose()
$nameFont.Dispose()
$ampFont.Dispose()
$detailFont.Dispose()
$hashFont.Dispose()
$center.Dispose()

Get-Item $outputPath | Select-Object FullName, Length
