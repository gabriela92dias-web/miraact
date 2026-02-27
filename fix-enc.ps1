$path = Join-Path $PSScriptRoot "app.js"
$c = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
# Use hex for problematic chars
$c = $c -replace 'S\xC3\xA1b','Sáb' -replace 'S\xC3\xA1bado','Sábado' -replace 'Manh\xC3\xA3','Manhã'
$c = $c -replace '\xE2\x80\x93','-' -replace '\xE2\x80\x94','-'  # en/em dash to hyphen
$c = $c -replace 'v\xC3\xA1rios','vários' -replace 'Respons\xC3\xA1vel','Responsável'
$c = $c -replace 'Ter\xC3\xA7a','Terça' -replace 'Mar\xC3\xA7o','Março' -replace 'In\xC3\xADcio','Início'
$c = $c -replace 'dispon\xC3\xADvel','disponível' -replace 'programa\xC3\xA7\xC3\xA3o','programação'
$c = $c -replace 'pre\xC3\xA7o','preço' -replace 'inscri\xC3\xA7\xC3\xB5es','inscrições'
$c = $c -replace 'Execu\xC3\xA7\xC3\xA3o','Execução' -replace 'relat\xC3\xB3rios','relatórios'
$c = $c -replace 'divulga\xC3\xA7\xC3\xA3o','divulgação' -replace 'dura\xC3\xA7\xC3\xA3o','duração'
$c = $c -replace 'di\xC3\xA1ria','diária' -replace 'hor\xC3\xA1rios','horários'
$c = $c -replace 'altera\xC3\xA7\xC3\xB5es','alterações' -replace 'altera\xC3\xA7\xC3\xA3o','alteração'
$c = $c -replace 'Or\xC3\xA7amento','Orçamento' -replace 'N\xC3\xA3o','Não'
$c = $c -replace 'Conclu\xC3\xADda','Concluída' -replace 'Produ\xC3\xA7\xC3\xA3o','Produção'
$c = $c -replace 'P\xC3\xB3s-produ\xC3\xA7\xC3\xA3o','Pós-produção' -replace '\xC3\x97','×'
# Mojibake: UTF-8 bytes interpreted as Latin-1
$c = $c -replace [char]0xE2+[char]0x80+[char]0x94,'-' -replace [char]0xE2+[char]0x80+[char]0x93,'-'
[System.IO.File]::WriteAllText($path, $c, [System.Text.Encoding]::UTF8)
Write-Host "Done"
