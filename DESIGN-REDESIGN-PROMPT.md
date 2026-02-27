# Prompt de Redesign: Faixas Multi-dia Autônomas com Hierarquia por Transparência

## 1. Contexto

Aplicação **Febre de Arte 2026** — planejador/calendário de tarefas para evento cultural. Arquivo principal: `integracao-funcional.html`. Stack: HTML único, FullCalendar 6, vis-timeline, CSS inline, JavaScript vanilla.

---

## 2. Inventário do Design Atual

### 2.1 Paleta de Cores

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg-base` | `#0d0e10` | Fundo principal, quase preto |
| `--bg-elevated` | `#121416` | Painéis, áreas elevadas |
| `--bg-card` | `#15171a` | Cards, inputs, barras |
| `--border` | `rgba(255,255,255,0.06)` | Bordas gerais |
| `--text` | `#e8eaed` | Texto principal |
| `--text-dim` | `#8b9199` | Texto secundário |
| `--accent` | `#84cc16` | Cor de destaque (verde-limão) |
| `--accent-muted` | `rgba(132,204,22,0.15)` | Accent em fundos sutis |

### 2.2 Cores das Etapas (grayscale crescente)

| Etapa | BG | Border |
|-------|----|--------|
| planejamento | `#4b5563` | `#6b7280` |
| producao | `#6b7280` | `#9ca3af` |
| execucao | `#9ca3af` | `#b4b8bc` |
| pos-producao | `#b4b8bc` | `#d1d5db` |

Padrão visual: `border-left: 3px solid [cor-etapa]` em eventos, cards e blocos.

### 2.3 Tipografia

- **Fonte:** Plus Jakarta Sans (300, 400, 500, 600, 700)
- **Escala:** base 16px; títulos 0.7–1.35rem; labels 0.65–0.85rem; eventos 0.45–0.7rem
- **Convenções:** títulos em accent; labels em uppercase com `letter-spacing: 0.08–0.1em`; eventos em lowercase

### 2.4 Componentes Relevantes

- **Tarefa diária (FullCalendar):** evento com `border-left` da etapa, `--fc-event-bg-color` e `--fc-event-border-color` da etapa, font-weight 300, dot verde `#84cc16`
- **Slots de turno:** `[data-turno]` com `background: rgba(255,255,255,0.02)`; início de turno com `border-top: 2px solid rgba(132,204,22,0.45)`
- **Coluna de turno:** Manhã/Tarde/Noite, escrita vertical, cor accent
- **Modal relatório:** fundo `--bg-elevated`, borda `--border`, seções com `modal-campo`, inputs com `background: rgba(255,255,255,0.06)`

### 2.5 UI Multi-dia Atual

**Barra (multidia-bar):** Lista horizontal acima da grade diária.
- Estrutura: `[‹] [bleed-esq] [centro: título] [bleed-dir] [›]`
- Centro: só título, `font-size: 0.7rem`, `color: var(--text-dim)`, `background: rgba(255,255,255,0.03)`, `border-left: 2px solid [cor-etapa]`
- Clique no centro abre modal relatório (abrirModalRelatorio)
- Bleeds: gradientes `transparent → cor44`
- Setas: navegação entre dias; desabilitadas quando não há dia anterior/próximo

**Faixa de fundo (multidia-stripe-layer):** Colunas proporcionais atrás da grade.
- Uma coluna por tarefa multi-dia, `background: cor70`, `border-right: 1px solid rgba(255,255,255,0.08)`
- `pointer-events: none` — não interativa

**Problema central:** A faixa e a barra não são autônomas. Para ver detalhes da tarefa (responsável, status, datas, etc.), o usuário precisa abrir um modal separado. A informação útil está fora da faixa.

---

## 3. Objetivos do Redesign

1. **Faixa autônoma:** Todas as informações essenciais da tarefa legíveis diretamente na faixa, sem depender de aba/modal.
2. **Hierarquia por transparência:** Usar múltiplos níveis de opacidade e blur (glassmorphism) para criar profundidade e hierarquia, em vez de bordas e blocos opacos.
3. **Coerência visual:** O visual da faixa multi-dia deve harmonizar com tarefas diárias e com o calendário, sem conflitar.
4. **Modal como complemento:** O modal continua para edição detalhada (custos, riscos, observações), mas não para leitura básica.

---

## 4. Dados da Tarefa (o que pode ser exibido na faixa)

- `titulo` — obrigatório
- `etapa` — planejamento, producao, execucao, pos-producao
- `inicio`, `fim` — datas YYYY-MM-DD
- `obterGantt(id)`: `responsavel`, `status`, `dataInicioReal`, `duracaoHoras`, `prioridade`

---

## 5. Princípios de Design para o Redesign

### 5.1 Teoria de Cor e Transparência

- **Fundo escuro:** Em temas escuros, transparências brancas (rgba(255,255,255,X)) criam “elevação”; transparências da cor da etapa criam “ênfase”.
- **Hierarquia por opacidade:** 
  - Nível 0 (fundo): ~0–2% branco
  - Nível 1 (faixa base): 3–8% branco ou 15–25% cor da etapa
  - Nível 2 (conteúdo principal): 6–12% branco
  - Nível 3 (destaque/interação): 10–18% branco ou accent
- **Contraste de texto:** Sobre fundos translúcidos, garantir WCAG AA (mín. 4.5:1 para texto normal; 3:1 para texto grande). Sobre cor+30 a cor+60, usar `--text` ou `--text-dim` conforme legibilidade.
- **Harmonia com etapas:** Usar as cores de etapa existentes como acento, nunca substituí-las por cores novas que conflitem.

### 5.2 Glassmorphism no Contexto Escuro

- **Blur:** `backdrop-filter: blur(8–16px)` em elementos “flutuantes”; evitar blur excessivo que dificulte leitura.
- **Bordas:** Bordas leves `rgba(255,255,255,0.08–0.12)` simulam reflexos; evitar bordas duras.
- **Sombras:** `box-shadow: 0 2px 12px rgba(0,0,0,0.3)` para profundidade; sombras coloridas sutis para acento.
- **Gradientes:** Gradientes verticais sutis (ex.: `linear-gradient(to bottom, rgba(255,255,255,0.06), transparent)`) para sensação de vidro.

### 5.3 Tipografia em Superfícies Translúcidas

- Texto principal: `--text` ou `--text-dim` conforme hierarquia.
- Evitar texto muito pequeno em áreas muito translúcidas (contraste baixo).
- Usar `font-weight: 500–600` para títulos na faixa, `400` para secundário.
- `letter-spacing` ligeiramente maior (0.02–0.04em) para legibilidade em blocos densos.

### 5.4 Densidade de Informação

- **Essencial na faixa:** Título, etapa (ou ícone), período (início–fim), responsável, status.
- **Opcional/condicional:** Prioridade (se alta/crítica); duração/hora início real (se relevante).
- **Fora da faixa:** Custos, riscos, dependências, observações — permanecem no modal.
- Evitar overflow: truncar com ellipsis; usar tooltip para texto completo se necessário.

### 5.5 Diferença Entre Faixa Multi-dia e Tarefa Diária

| Aspecto | Tarefa diária | Faixa multi-dia |
|---------|---------------|-----------------|
| Contexto | Dentro da grade, com horário | Barra acima + faixa de fundo |
| Forma | Bloco com altura por duração | Faixa horizontal full-width |
| Densidade | Mínima (título, hora) | Maior (título, etapa, datas, responsável, status) |
| Estética | Sólida/opaca, border-left | Translúcida, hierarquia por transparência |
| Interação | Clique → modal | Clique → modal (para editar); leitura na faixa |

A faixa multi-dia deve parecer “um nível acima” na hierarquia: mais informativa, mas não mais pesada visualmente que os eventos diários.

---

## 6. Especificação da Faixa Autônoma

### 6.1 Estrutura Proposta

Cada item multi-dia vira um **cartão-faixa** com:

1. **Barra superior (multidia-bar):** Mantida, mas expandida.
   - Conteúdo visível: título, etapa (label ou ícone), datas (início–fim), responsável, status.
   - Layout: flex horizontal; título e meta-dados legíveis; setas de navegação preservadas.
   - Estética: fundo translúcido com blur; borda sutil; cor da etapa como accent (borda-esquerda ou barra lateral).

2. **Faixa de fundo (multidia-stripe):** 
   - Continua proporcional ao número de tarefas.
   - Pode incorporar indicadores visuais mínimos (ex.: label da etapa em cantos) sem poluir.
   - Deve permitir que o texto da barra permaneça legível (contraste).

### 6.2 Hierarquia Visual na Faixa (exemplo)

- **Camada 1 (fundo):** multidia-stripe-col com `background: cor55` ou `cor60`, opcional `backdrop-filter: blur(4px)`.
- **Camada 2 (cartão):** multidia-bar-item com `background: rgba(255,255,255,0.04)` a `rgba(255,255,255,0.08)`, `backdrop-filter: blur(8px)`, `border: 1px solid rgba(255,255,255,0.08)`.
- **Camada 3 (acento):** `border-left: 3px solid [cor-etapa]` ou barra lateral colorida.
- **Camada 4 (texto):** título em `--text` ou `--text-dim`; meta-dados em `--text-dim`, font-size 0.75–0.8rem.

### 6.3 Restrições

- Não alterar a paleta de etapas (planejamento→pos-producao).
- Não alterar o accent principal (`--accent`).
- Manter compatibilidade com FullCalendar e vis-timeline (cores de evento, estrutura).
- Garantir que a faixa seja utilizável em vista Dia (Cronograma e Agenda).

---

## 7. Tarefa para o Redesign

Com base neste documento:

1. **Analisar** o código atual em `integracao-funcional.html` (CSS das classes `.multidia-*`, `.dia-timegrid-wrap`, estrutura da barra e da faixa).
2. **Redesenhar** a faixa multi-dia para que seja autônoma, exibindo título, etapa, datas, responsável e status diretamente nela.
3. **Aplicar** hierarquia por transparência (glassmorphism) de forma consistente com o design existente.
4. **Preservar** a funcionalidade: navegação entre dias, clique para abrir modal, filtros.
5. **Não conflitar** com tarefas diárias, slots de turno, coluna de turno e demais componentes.

---

## 8. Referências de Estética

- Cartões translúcidos com informação legível dentro do elemento.
- Múltiplos níveis de opacidade para criar profundidade.
- Bordas suaves e sombras discretas em temas escuros.
- Cores de etapa como acento, não como fundo dominante.
- Densidade moderada: suficiente para leitura sem edição, sem sobrecarregar.

---

*Documento gerado para guiar um redesign cuidadoso das faixas multi-dia no Febre de Arte 2026.*
