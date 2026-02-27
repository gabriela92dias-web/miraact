# Análise de Hierarquia Visual — Febre de Arte 2026
## Visão do Designer: Texto, Borda, Brilho e Luz (não só background)

---

## 1. Princípio Central Corrigido

**No tema preto, o que é mais importante deve ser mais claro** — mas **não pelo background inteiro**. A hierarquia se constrói em:

- **Texto** (clareza, peso, cor)
- **Bordas** (definição, glow, contorno de luz)
- **Brilho** (box-shadow, glow em elementos ativos)
- **Reflexos** (highlights nas bordas, sensação de vidro)
- **Sombra** (profundidade, “flutuação”)

O **efeito vidro** (glassmorphism) permanece em todos os elementos; a hierarquia vem do **conteúdo dentro do vidro**, não do grau de opacidade do fundo.

---

## 2. Tokens Propostos para Hierarquia

### 2.1 Texto (3 níveis)

| Token | Valor sugerido | Uso |
|-------|----------------|-----|
| `--text` | `#e8eaed` | Texto principal |
| `--text-dim` | `#8b9199` | Texto secundário |
| `--text-bright` | `#f4f5f7` | Texto em destaque (títulos ativos, labels focados) |

- **Importante:** `--text` ou `--text-bright`, `font-weight: 600`
- **Detalhe/aviso:** `--text-dim`, `font-weight: 400`, eventual `opacity: 0.85`

### 2.2 Bordas (3 níveis)

| Token | Valor sugerido | Uso |
|-------|----------------|-----|
| `--border` | `rgba(255,255,255,0.06)` | Bordas sutis, elementos secundários |
| `--border-strong` | `rgba(255,255,255,0.12)` | Bordas definidas |
| `--border-glow` | `rgba(132,204,22,0.4)` | Contorno de luz em ativos/focados |

### 2.3 Brilho (Glow)

| Token | Uso |
|-------|-----|
| `--glow-accent` | `0 0 12px rgba(132,204,22,0.35), 0 0 24px rgba(132,204,22,0.15)` |
| `--glow-accent-strong` | `0 0 16px rgba(132,204,22,0.5), 0 0 32px rgba(132,204,22,0.2)` |
| `--glow-subtle` | `0 0 8px rgba(255,255,255,0.08)` |

### 2.4 Sombra (Profundidade)

| Token | Uso |
|-------|-----|
| `--shadow-float` | `0 4px 24px rgba(0,0,0,0.25)` |
| `--shadow-modal` | `0 12px 48px rgba(0,0,0,0.5)` |
| `--shadow-inset` | `inset 0 1px 0 rgba(255,255,255,0.04)` (reflexo de luz interno) |

---

## 3. Análise Componente a Componente

### 3.1 Header

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Texto h1** | `--text` implícito | `--text-bright`, `font-weight: 600` |
| **Header-ano** | `--text-dim` | Manter; reforça hierarquia |
| **Borda inferior** | `--border` | Manter |
| **Brilho** | Nenhum | Opcional: `--shadow-inset` sutil |

### 3.2 Tabs (Home / Cronograma / Agenda / Biblioteca)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Tab inativa** | `--text-dim`, bg opacity-2 | Manter texto dim |
| **Tab ativa** | `--text`, bg opacity-7 | **Texto:** `--text-bright`; **Borda:** `--border-glow`; **Glow:** `--glow-accent` |
| **Hover** | `--text`, bg opacity-3 | Manter; transição suave |

### 3.3 Nav-sidebar (Menu lateral)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Aba inativa** | `--text-dim` | Manter |
| **Aba ativa** | `--text`, bg opacity-6 | **Texto:** `--text-bright`; **Borda esquerda:** 2px `--accent` + glow sutil |
| **Nav-sidebar-toggle** | `--text-dim` | Manter; é secundário |
| **Sombra** | `4px 0 32px rgba(0,0,0,0.35)` | Manter; boa profundidade |

### 3.4 Painel (container principal)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Borda** | `--border-strong` | Manter |
| **Sombra** | `0 4px 24px rgba(0,0,0,0.2)` | Aumentar para `--shadow-float` |
| **Reflexo** | Nenhum | Adicionar `--shadow-inset` para “vidro na frente” |

### 3.5 Modal

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **h2** | Sem token explícito | `--text-bright`, `font-weight: 600` |
| **Labels** | `--text-dim` | Manter |
| **Inputs** | `--text` | Manter; texto inserido deve ser claro |
| **Borda** | `--border-strong` | Adicionar `--border-glow` sutil ou `--glow-subtle` |
| **Sombra** | `0 12px 48px rgba(0,0,0,0.5)` | Manter `--shadow-modal` |
| **Botão primário (btn-add)** | `--accent` no hover | Adicionar `--glow-accent` no hover |

### 3.6 Vista-tabs / Cronograma-vista-btn

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Inativo** | `--text-dim` | Manter |
| **Ativo** | `--accent`, box-shadow 1px accent | **Manter** + `--glow-accent` mais forte |
| **Borda do container** | `--border-strong` | Manter |

### 3.7 Vista-nav-btn (‹ ›)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Inativo** | `--text-dim` | Manter |
| **Hover** | `--accent`, bg opacity-6 | Adicionar `--glow-accent` sutil |
| **Borda** | `--border-strong` | Em hover, borda com `--border-glow` |

### 3.8 Vista-titulo

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Cor** | `--accent` | Manter; é âncora visual |
| **Peso** | 600 | Manter |
| **Brilho** | Nenhum | Opcional: `text-shadow: 0 0 12px rgba(132,204,22,0.2)` |

### 3.9 Info / Vista-info (avisos, dicas)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Texto** | `--text-dim` | Manter; é detalhe |
| **Borda-esquerda** | `--accent` 3px | Manter; reforça “dica” |
| **Background** | opacity-1 | Manter; quase transparente |

### 3.10 Vista-lista-table

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **th** | `--text-dim` | Manter; headers são secundários |
| **td** | Herda `--text` | Manter |
| **tr:hover** | bg opacity-1 | Adicionar borda esquerda sutil ou glow no hover |

### 3.11 Etapas-kanban-col / etapa-bloco

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **h4 col** | `--text-dim` | Manter |
| **Card** | border-left etapa, bg opacity-4 | **Texto do card:** `--text`; **Hover:** borda ou glow sutil |
| **etapa-bloco** | border-left, bg opacity-4 | Manter; borda da etapa já dá hierarquia |

### 3.12 Mini-cal

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Dia vazio** | `--text-dim`, bg opacity-0 | Manter |
| **has-tarefa** | `--text`, bg opacity-1 | Manter |
| **hoje** | `--text`, bg opacity-6, border accent | **Texto:** `--text-bright`; **Glow:** `--glow-accent` leve |
| **mini-cal-add (+)**: hover | accent | Adicionar glow sutil |

### 3.13 Context-menu

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Borda** | `--border-strong` | Adicionar `--border-glow` sutil |
| **Sombra** | `0 12px 40px rgba(0,0,0,0.5)` | Manter |
| **Item hover** | bg opacity-5 | Manter; texto já é `--text` |

### 3.14 Semana-cell / Semana-day-header

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Day header** | `--text-dim` no .dia-numero | Manter |
| **Turno header** | `--accent` | Manter |
| **Cell normal** | bg opacity-2 | Manter; é suporte |

### 3.15 Turno-coluna

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Texto (Manhã/Tarde/Noite)** | `--accent` | Manter |
| **Box-shadow inset** | `rgba(132,204,22,0.08)` | Manter; dá leve brilho interno |
| **Bordas entre turnos** | `rgba(132,204,22,0.6)` | Manter |

### 3.16 Multidia-stripe

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Título** | `--text` | Manter ou `--text-bright` |
| **Meta** | `--text-dim` | Manter |
| **Nav-btn** | `--text-dim` → `--accent` no hover | Adicionar glow sutil no hover |
| **Hover da col** | box-shadow opacity-6 | Trocar por `--border-glow` ou `--glow-accent` sutil |

### 3.17 Slots [data-turno]

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **fc-slot-turno-inicio** | border-top accent, box-shadow inset | Manter; já há “luz” no início do turno |
| **fc-slot-hora-linha** | `--text-dim`, opacity 0.45 | Manter; é utilitário |

### 3.18 FullCalendar (eventos)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Evento** | Cores de etapa | Manter |
| **Dot verde** | `#84cc16` | Adicionar `box-shadow: 0 0 4px rgba(132,204,22,0.5)` |
| **fc-toolbar-title** | `--accent` | Manter; é âncora |

### 3.19 Botões de ação (+ Adicionar, fc-day-add-btn, etc.)

| Aspecto | Atual | Recomendação |
|---------|-------|--------------|
| **Estado normal** | `--accent-muted`, `--accent` | Manter |
| **Hover** | `--accent` sólido | Adicionar `--glow-accent` |
| **Ícone +** | Manter visibilidade | Garantir `--text-bright` ou branco no hover |

---

## 4. Resumo de Implementação

### 4.1 Novos tokens em `:root`

```css
--text-bright: #f4f5f7;
--border-glow: rgba(132,204,22,0.4);
--glow-accent: 0 0 12px rgba(132,204,22,0.35), 0 0 24px rgba(132,204,22,0.15);
--glow-accent-strong: 0 0 16px rgba(132,204,22,0.5), 0 0 32px rgba(132,204,22,0.2);
--glow-subtle: 0 0 8px rgba(255,255,255,0.08);
--shadow-float: 0 4px 24px rgba(0,0,0,0.25);
--shadow-modal: 0 12px 48px rgba(0,0,0,0.5);
--shadow-inset: inset 0 1px 0 rgba(255,255,255,0.04);
```

### 4.2 Onde aplicar glow

- Tab ativa
- Aba ativa (nav-sidebar)
- Vista-btn ativa / cronograma-vista-btn ativa
- Vista-nav-btn no hover
- Modal (borda/contorno)
- Mini-cal-dia.hoje
- Botão btn-add no hover
- Context-menu
- Multidia-stripe-col no hover
- Dot verde dos eventos FC

### 4.3 Onde usar --text-bright

- Header h1
- Modal h2
- Tab ativa
- Aba ativa
- Vista-titulo (opcional)
- Mini-cal-dia.hoje
- Multidia-stripe-title (opcional)

### 4.4 Onde usar --shadow-inset (reflexo de vidro)

- Painel
- Modal
- Vista-conteudo
- Nav-sidebar
- Etapas-kanban-col
- Context-menu

---

## 5. Ordem de Prioridade

1. **Alta:** Tab/aba ativa com glow + texto bright  
2. **Alta:** Modal com reflexo e glow na borda  
3. **Média:** Botões primários com glow no hover  
4. **Média:** Vista-nav-btn com glow no hover  
5. **Média:** Mini-cal-dia.hoje com glow  
6. **Baixa:** Reflexos inset em painéis e modais  
7. **Baixa:** Dot verde com glow  

---

*Documento de análise para a sessão de redesign — hierarquia por texto, borda, brilho e luz, mantendo o efeito vidro.*
