Add-Type -AssemblyName System.Drawing

$width = 1200
$height = 1200
$outputPath = "public/images/og-design-d-v5.jpg"
$paperPath = "src/assets/WEDDING CARD ERNI & AMIRUL 4.png"

function Draw-CenteredText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$Y,
    [float]$Height,
    [float]$Width = 1200
  )

  $format = New-Object System.Drawing.StringFormat
  $format.Alignment = "Center"
  $format.LineAlignment = "Center"
  $Graphics.DrawString($Text, $Font, $Brush, (New-Object System.Drawing.RectangleF(0, $Y, $Width, $Height)), $format)
  $format.Dispose()
}

function Draw-SpacedCenteredText {
  param(
    [System.Drawing.Graphics]$Graphics,
    [string]$Text,
    [System.Drawing.Font]$Font,
    [System.Drawing.Brush]$Brush,
    [float]$CenterY,
    [float]$LetterSpacing
  )

  $characters = $Text.ToCharArray()
  $totalWidth = 0
  foreach ($character in $characters) {
    $size = $Graphics.MeasureString([string]$character, $Font)
    $totalWidth += $size.Width
  }
  $totalWidth += [Math]::Max(0, $characters.Length - 1) * $LetterSpacing

  $x = ($script:width - $totalWidth) / 2
  foreach ($character in $characters) {
    $text = [string]$character
    $size = $Graphics.MeasureString($text, $Font)
    $Graphics.DrawString($text, $Font, $Brush, $x, $CenterY - ($size.Height / 2))
    $x += $size.Width + $LetterSpacing
  }
}

$bitmap = New-Object System.Drawing.Bitmap($width, $height)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = "AntiAlias"
$graphics.InterpolationMode = "HighQualityBicubic"
$graphics.PixelOffsetMode = "HighQuality"
$graphics.TextRenderingHint = "AntiAliasGridFit"
$graphics.Clear([System.Drawing.Color]::FromArgb(255, 247, 243, 235))

$paper = [System.Drawing.Image]::FromFile((Resolve-Path $paperPath))

# WhatsApp shows the image in a tight square crop. Fill the whole square so the
# card preview does not have white side bars.
$scale = [Math]::Max($width / $paper.Width, $height / $paper.Height)
$targetWidth = [int]($paper.Width * $scale)
$targetHeight = [int]($paper.Height * $scale)
$targetX = [int](($width - $targetWidth) / 2)
$targetY = -22
$graphics.DrawImage($paper, $targetX, $targetY, $targetWidth, $targetHeight)

$green = [System.Drawing.Color]::FromArgb(255, 48, 77, 31)
$pink = [System.Drawing.Color]::FromArgb(255, 223, 79, 105)
$buttonPink = [System.Drawing.Color]::FromArgb(235, 217, 90, 115)
$white = [System.Drawing.Color]::FromArgb(255, 255, 255, 255)
$greenBrush = New-Object System.Drawing.SolidBrush($green)
$pinkBrush = New-Object System.Drawing.SolidBrush($pink)
$buttonBrush = New-Object System.Drawing.SolidBrush($buttonPink)
$whiteBrush = New-Object System.Drawing.SolidBrush($white)

$titleFont = New-Object System.Drawing.Font("Garamond", 43, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$nameFont = New-Object System.Drawing.Font("Segoe Script", 40, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$ampFont = New-Object System.Drawing.Font("Segoe Script", 25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$detailFont = New-Object System.Drawing.Font("Garamond", 27, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$hashFont = New-Object System.Drawing.Font("Segoe Script", 32, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)
$buttonFont = New-Object System.Drawing.Font("Segoe UI", 24, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Pixel)

Draw-SpacedCenteredText $graphics "MAJLIS RAIKAN" $titleFont $greenBrush 104 20
Draw-SpacedCenteredText $graphics "CINTA" $titleFont $greenBrush 146 20

Draw-CenteredText $graphics "Erni" $nameFont $greenBrush 492 48 1120
Draw-CenteredText $graphics "Alysya" $nameFont $greenBrush 548 48 1120
Draw-CenteredText $graphics "&" $ampFont $greenBrush 598 30 1120
Draw-CenteredText $graphics "Muhammad" $nameFont $greenBrush 630 52 1120
Draw-CenteredText $graphics "Amirul" $nameFont $greenBrush 690 48 1120

Draw-CenteredText $graphics "26 . 12 . 2026" $detailFont $greenBrush 882 28
Draw-CenteredText $graphics "Inap D'Bondang Resort," $detailFont $greenBrush 912 30
Draw-CenteredText $graphics "#AmiruLamarErni" $hashFont $pinkBrush 958 38

$buttonRect = New-Object System.Drawing.RectangleF(286, 1034, 628, 64)
$buttonPath = [System.Drawing.Drawing2D.GraphicsPath]::new()
$radius = 32
$buttonPath.AddArc($buttonRect.X, $buttonRect.Y, $radius * 2, $radius * 2, 180, 90)
$buttonPath.AddArc($buttonRect.Right - ($radius * 2), $buttonRect.Y, $radius * 2, $radius * 2, 270, 90)
$buttonPath.AddArc($buttonRect.Right - ($radius * 2), $buttonRect.Bottom - ($radius * 2), $radius * 2, $radius * 2, 0, 90)
$buttonPath.AddArc($buttonRect.X, $buttonRect.Bottom - ($radius * 2), $radius * 2, $radius * 2, 90, 90)
$buttonPath.CloseFigure()
$graphics.FillPath($buttonBrush, $buttonPath)
$buttonText = "Buka Jemputan  " + [char]0x2661
Draw-CenteredText $graphics $buttonText $buttonFont $whiteBrush 1037 58

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParameters = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParameters.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, 92L)
$bitmap.Save($outputPath, $jpegCodec, $encoderParameters)

$graphics.Dispose()
$bitmap.Dispose()
$paper.Dispose()
$greenBrush.Dispose()
$pinkBrush.Dispose()
$buttonBrush.Dispose()
$whiteBrush.Dispose()
$titleFont.Dispose()
$nameFont.Dispose()
$ampFont.Dispose()
$detailFont.Dispose()
$hashFont.Dispose()
$buttonFont.Dispose()
$buttonPath.Dispose()
$encoderParameters.Dispose()

Get-Item $outputPath | Select-Object FullName, Length
