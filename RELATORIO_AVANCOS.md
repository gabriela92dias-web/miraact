# Relatório de Avanços — Febre de Arte 2026

**Projeto:** Febre de Arte 2026 — Planejador de eventos culturais
**Repositório:** github.com/gabriela92dias-web/miraact
**Período:** 27 de fevereiro de 2026 — 28 de fevereiro de 2026
**Total estimado de horas dedicadas:** ~18 h

---

## Resumo executivo

O projeto "Febre de Arte 2026" é uma aplicação web de planejamento e cronograma para um evento cultural. Em dois dias de trabalho, foi construída a aplicação completa do zero — incluindo calendário interativo com múltiplas vistas, diagrama de Gantt, quadro Kanban, biblioteca de tarefas e sistema de arrastar/redimensionar — e preparado o ambiente de desenvolvimento para colaboração futura.

---

## Dia 1 — Quinta-feira, 27 de fevereiro de 2026

**Horário estimado:** 14:00 – 00:14 (BRT)
**Duração estimada:** ~10 h
**Commit:** `00:14` — *Initial commit: Kanban integrado com calendário e Gantt*

### Atividades realizadas

- **Construção completa da aplicação** desde o início: estrutura HTML, toda a lógica em JavaScript (~2.800 linhas) e estilos CSS (~600 linhas)
- **Calendário interativo** com 6 vistas diferentes:
  - **Mês** — calendário mensal com barras de tarefas multidia
  - **Semana** — grelha semanal dividida por turnos (Manhã, Tarde, Noite)
  - **Dia** — vista diária com horários detalhados
  - **Anual** — diagrama de Gantt com timeline do ano inteiro (usando DHTMLX Gantt)
  - **Lista** — tabela com todas as tarefas e informações
  - **Etapas** — tarefas organizadas por fase do projeto
- **Quadro Kanban** — página separada para gestão visual de tarefas por colunas
- **Funcionalidades avançadas:**
  - Arrastar e soltar tarefas entre datas e vistas
  - Redimensionar duração de tarefas (handles esquerdo e direito)
  - Filtros por etapa, status e responsável
  - Desfazer/refazer (Ctrl+Z / Ctrl+Y)
  - Persistência de dados no navegador (localStorage)
  - Notas de feedback visual ao mover/redimensionar
- **Biblioteca de tarefas** — catálogo pré-definido de tarefas por fase do projeto (Planejamento, Produção, Execução, Pós-produção)
- **Design e identidade visual:**
  - Tema escuro com efeito glassmorphism
  - Paleta definida com tokens de cor consistentes
  - Fonte Plus Jakarta Sans (Google Fonts)
  - Design responsivo ao zoom do navegador
- **Documentação de design e arquitetura:**
  - Análise de hierarquia visual (282 linhas)
  - Prompt de redesign de faixas multidia (185 linhas)
  - Exploração de funcionalidades DHTMLX Gantt (125 linhas)
  - Sugestão de dependências entre tarefas (123 linhas)
  - Documento de escopo aprovado com backup dos ficheiros
- **Configuração do projeto:**
  - Regras de proteção de escopo para o Cursor
  - Configurações de linting HTML (html-validate e htmlhint)
  - Ficheiro .gitignore
  - Scripts utilitários de correção de encoding

### Resultado do dia

Aplicação funcional completa entregue com todas as vistas do calendário, Gantt, Kanban, drag & drop, resize, filtros e persistência de dados. Documentação de design e arquitetura criada para orientar evolução futura.

---

## Dia 2 — Sábado, 28 de fevereiro de 2026

**Horário estimado:** 12:00 – 19:40 (BRT)
**Duração estimada:** ~8 h
**Commit:** `15:40` (BRT) — *Add development environment: AGENTS.md, package.json with html-validate, htmlhint, serve*

### Atividades realizadas

- **Preparação do ambiente de desenvolvimento:**
  - Instalação de ferramentas de linting (html-validate, htmlhint)
  - Instalação de servidor HTTP estático (serve)
  - Criação do package.json com dependências de desenvolvimento
- **Verificação e testes completos:**
  - Execução de lint em todos os ficheiros HTML
  - Teste de todas as 6 vistas do calendário no navegador
  - Teste de criação de tarefas via modal e via biblioteca
  - Teste de navegação entre secções (Cronograma, Biblioteca)
  - Gravação de vídeo demonstrativo da aplicação em funcionamento
- **Documentação para colaboração:**
  - Criação do AGENTS.md com instruções de desenvolvimento
  - Documentação de como servir, fazer lint e testar a aplicação
  - Registo de cuidados importantes (escopo aprovado, dependências CDN, localStorage)

### Resultado do dia

Ambiente de desenvolvimento configurado e validado. Todas as funcionalidades testadas e confirmadas operacionais. Documentação de desenvolvimento criada para facilitar contribuições futuras.

---

## Entregas acumuladas

| # | Entrega | Status |
|---|---------|--------|
| 1 | Aplicação web completa (HTML/CSS/JS) | ✅ Concluída |
| 2 | Calendário mensal com tarefas multidia | ✅ Concluída |
| 3 | Vista semanal por turnos (Manhã/Tarde/Noite) | ✅ Concluída |
| 4 | Vista diária com horários detalhados | ✅ Concluída |
| 5 | Diagrama de Gantt anual (DHTMLX) | ✅ Concluída |
| 6 | Vista de lista e vista por etapas | ✅ Concluída |
| 7 | Quadro Kanban (página separada) | ✅ Concluída |
| 8 | Drag & drop entre datas e vistas | ✅ Concluída |
| 9 | Resize de duração de tarefas | ✅ Concluída |
| 10 | Filtros (etapa, status, responsável) | ✅ Concluída |
| 11 | Desfazer/refazer (Ctrl+Z/Y) | ✅ Concluída |
| 12 | Persistência em localStorage | ✅ Concluída |
| 13 | Biblioteca de tarefas por fase | ✅ Concluída |
| 14 | Tema escuro com glassmorphism | ✅ Concluída |
| 15 | Documentação de design e arquitetura | ✅ Concluída |
| 16 | Ambiente de desenvolvimento configurado | ✅ Concluída |
| 17 | Dependências entre tarefas (predecessoras) | 📋 Planeada |
| 18 | Undo/redo no Gantt (plugin DHTMLX) | 📋 Planeada |
| 19 | Tooltips nas barras do Gantt | 📋 Planeada |

---

## Indicadores do período

| Indicador | Valor |
|-----------|-------|
| Dias de trabalho | 2 |
| Horas totais estimadas | ~18 h |
| Commits | 2 |
| Ficheiros criados | 29 |
| Linhas de código (app principal) | ~3.650 (app.js + estilos.css + HTML) |
| Linhas de código (Kanban) | ~3.825 |
| Linhas totais no repositório | ~13.750 |
| Vistas de calendário implementadas | 6 |
| Documentos de design/arquitetura | 4 |

---

## Sugestão de próximos passos

1. **Dependências entre tarefas** — Implementar o sistema de predecessoras já documentado em `SUGESTAO_DEPENDENCIAS_TAREFAS.md`, permitindo ligar tarefas entre si no Gantt e no calendário.

2. **Undo/redo no Gantt** — Ativar o plugin de undo/redo da DHTMLX para que alterações de datas e links no diagrama possam ser desfeitas.

3. **Tooltips e detalhes rápidos** — Adicionar tooltips nas barras do Gantt e do calendário para ver informações da tarefa sem precisar de abrir o modal.

4. **Atribuição de responsáveis** — Permitir atribuir pessoas às tarefas e filtrar por responsável de forma funcional.

5. **Exportação de dados** — Possibilitar exportar o cronograma em PDF ou imagem para partilha com a equipa.

6. **Integração Kanban ↔ Cronograma** — Sincronizar o estado das tarefas entre o quadro Kanban e o calendário/Gantt.

---

*Relatório gerado em 28 de fevereiro de 2026.*
