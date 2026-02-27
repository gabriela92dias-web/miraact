# O que mais a DHTMLX Gantt pode oferecer ao projeto

Estás a usar a **edição Standard** do DHTMLX Gantt (GPL). Abaixo está o que a biblioteca oferece e como se relaciona com o teu projeto — **Standard** (disponível agora) vs **PRO** (edição paga).

---

## Já em uso no projeto

- Tarefas com datas e duração, arrastar e redimensionar barras
- Dependências entre tarefas (FS, SS, FF, SF) e ligações no diagrama
- Duplo-clique para abrir o teu modal de relatório
- Persistência em `localStorage` ao alterar datas/links
- Nota “Datas atualizadas” ao mover/esticar

---

## Standard (GPL) — o que podes adicionar sem custo

### 1. **Undo / Redo no Gantt**
- A biblioteca tem plugin de undo/redo (desfazer / refazer alterações no diagrama).
- **No teu projeto:** Já tens undo/redo no relatório (histórico). Podes ativar o undo da DHTMLX para o Gantt: arrastar, alterar datas, adicionar/remover links passa a ser desfazível dentro da vista Anual.
- Doc: [Undo/Redo](https://docs.dhtmlx.com/gantt/desktop__undo_redo.html) — `gantt.plugins({ undo: true })`, depois `gantt.undo()` / `gantt.redo()`.

### 2. **Escala temporal e zoom**
- Escala configurável (dia, semana, mês, ano) e **zoom** com vários níveis (ex.: ver por semana ou por mês).
- **No teu projeto:** Ajustar a escala inicial (ex.: mês) e adicionar botões ou atalhos para zoom (mais perto / mais longe) na vista Anual.
- Doc: [Configuring time scale](https://docs.dhtmlx.com/gantt/guides/time-scale/), [Zooming](https://docs.dhtmlx.com/gantt/desktop__zooming.html).

### 3. **Tooltips nas barras**
- Tooltips em tarefas (e noutros elementos) com texto e comportamento configuráveis.
- **No teu projeto:** Mostrar no hover o nome da tarefa, datas, responsável ou status (dados que já tens em `obterGantt(id)`).
- Doc: [Tooltips](https://docs.dhtmlx.com/gantt/guides/tooltips/).

### 4. **Filtragem de tarefas no Gantt**
- Filtrar tarefas por critério (ex.: prioridade, responsável, texto).
- **No teu projeto:** Já tens filtros globais (Etapa, Status, Responsável, Busca). Podes ligar esses filtros ao Gantt para que a vista Anual mostre só as tarefas filtradas (via `gantt.filter()` ou mostrando apenas as tarefas que passam no teu `filtradas`).
- Doc: [Filtering](https://docs.dhtmlx.com/gantt/guides/filtering/).

### 5. **Ordenação por coluna**
- Ordenar a lista (grid) do Gantt por coluna (nome, data, etc.).
- **No teu projeto:** Ordenar tarefas na coluna da esquerda do Gantt (ex.: por início, por título).
- Doc: [Sorting](https://docs.dhtmlx.com/gantt/guides/sorting/).

### 6. **Colunas do grid configuráveis**
- Definir colunas (nome, datas, progresso, etc.) e reordenar.
- **No teu projeto:** Mostrar no grid do Gantt colunas como “Responsável”, “Status” ou “Etapa” (dados de `obterGantt` e `TAREFAS`).
- Doc: [Specifying columns](https://docs.dhtmlx.com/gantt/guides/specifying-columns/).

### 7. **Edição inline no grid**
- Editar tarefas diretamente na grelha (texto, datas, duração, etc.).
- **No teu projeto:** Editar título ou datas na grelha e sincronizar com `TAREFAS` + `salvar()` (como já fazes em `onAfterTaskUpdate`).
- Doc: [Inline editing](https://docs.dhtmlx.com/gantt/guides/inline-editing/).

### 8. **Seleção múltipla e arrastar várias tarefas**
- Selecionar várias tarefas (Ctrl/Shift) e movê-las em bloco no tempo.
- **No teu projeto:** Mover várias tarefas de uma vez na vista Anual.
- Doc: [Multiselection](https://docs.dhtmlx.com/gantt/guides/multiselection/).

### 9. **Destacar intervalos (ex.: fins de semana)**
- Destacar células da escala (ex.: fins de semana) para facilitar a leitura.
- **No teu projeto:** Fins de semana a outra cor na escala temporal.
- Doc: [Highlighting time slots](https://docs.dhtmlx.com/gantt/guides/highlighting-time-slots/).

### 10. **Exportar (PDF, PNG, Excel, iCal)**
- Export do diagrama para PDF/PNG e dos dados para Excel/iCal (serviço online da DHTMLX; PDF/PNG podem ter marca de água sem licença).
- **No teu projeto:** Já tens “Exportar PDF” (print) e “Exportar CSV”. Podes complementar com export nativo da DHTMLX (PDF/PNG do Gantt, Excel) se quiseres.
- Doc: [Export](https://docs.dhtmlx.com/gantt/guides/export/), [Excel](https://docs.dhtmlx.com/gantt/guides/excel/).

### 11. **Navegação por teclado**
- Atalhos para navegar e editar no Gantt.
- **No teu projeto:** Melhorar acessibilidade e uso sem rato na vista Anual.
- Doc: [Keyboard navigation](https://docs.dhtmlx.com/gantt/guides/keyboard-navigation/).

### 12. **Modo apenas leitura**
- Diagrama só leitura (sem arrastar/editar).
- **No teu projeto:** Opção “ver apenas” para partilha ou impressão.
- Doc: [Readonly mode](https://docs.dhtmlx.com/gantt/guides/readonly-mode/).

### 13. **Localização (32 idiomas)**
- Textos da UI em português (datas, botões, etc.).
- **No teu projeto:** Interface do Gantt em PT (labels, formato de data).
- Doc: [Localization](https://docs.dhtmlx.com/gantt/guides/localization/).

### 14. **Temas / skins**
- Vários temas (incl. Material, dark).
- **No teu projeto:** Alinhar o tema do Gantt ao teu tema escuro.
- Doc: [Skins](https://docs.dhtmlx.com/gantt/guides/skins/).

### 15. **Modo ecrã inteiro**
- Gantt em fullscreen.
- **No teu projeto:** Botão “ecrã inteiro” na vista Anual.
- Doc: [Fullscreen mode](https://docs.dhtmlx.com/gantt/guides/fullscreen-mode/).

---

## PRO (edição paga) — referência rápida

Se no futuro considerares licença PRO, tens acesso a coisas como:

- **Caminho crítico** — realçar tarefas que atrasam o projeto
- **Recursos** — atribuir pessoas/recursos e ver carga
- **Auto‑agendamento** — datas calculadas a partir das dependências
- **Agrupamento** — agrupar tarefas (ex.: por responsável ou etapa)
- **Tipos de tarefa** — projeto, marco (milestone), tarefa
- **Tarefas divididas (split)** — uma tarefa em vários segmentos no tempo
- **Baselines e prazos** — linhas de referência e deadlines visuais
- **Calendário de trabalho** — fins de semana e feriados por projeto/recurso
- **Carregamento dinâmico** — muitos tarefas sem travar a UI

Nada disto é necessário para explorar bem a Standard; são extensões para necessidades mais avançadas.

---

## Sugestão de ordem para explorar (Standard)

1. **Tooltips** — pouco código, melhora logo a experiência (nome, datas, responsável).
2. **Escala + zoom** — vista por mês/semana e botões de zoom na Anual.
3. **Undo/Redo no Gantt** — ativar o plugin e, se quiseres, botões na barra da vista Anual.
4. **Filtros** — aplicar os teus filtros (Etapa, Status, Responsável, Busca) ao Gantt.
5. **Colunas extra** — Responsável e/ou Status no grid do Gantt.
6. **Destacar fins de semana** — escala mais legível.
7. **Localização (PT)** — textos e datas em português no Gantt.
8. **Export** — PDF/PNG/Excel via API da DHTMLX (se quiseres além do print e CSV).

Se disseres qual destes queres primeiro (ex.: “tooltips e zoom”), posso indicar os passos concretos no teu `app.js` e no init do `gantt`.
