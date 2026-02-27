# Executa isto no PowerShell para ter o Kanban independente
Copy-Item "C:\Users\gabri\Planejamento_Evento_2026\Kanban_Evento_2026.html" -Destination "C:\Users\gabri\Kanban_NOVO_standalone\Kanban.html"
(Get-Content "C:\Users\gabri\Kanban_NOVO_standalone\Kanban.html") -replace "const KEY = 'febre-arte-2026';", "const KEY = 'febre-arte-2026-NOVO';" | Set-Content "C:\Users\gabri\Kanban_NOVO_standalone\Kanban.html" -Encoding UTF8
Write-Host "Pronto. Abra Kanban.html nesta pasta."
