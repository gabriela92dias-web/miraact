# Sugestão: dependências entre tarefas do cronograma

**Objetivo:** Adicionar a noção “esta tarefa depende de outras tarefas do cronograma” (predecessoras), com alterações mínimas e sem reescrever o que está aprovado.

---

## 1. Estrutura de dados

### Onde guardar

- **Em `ganttData[taskId]`** (já persistido com `salvar()`): um novo campo **array de IDs**.
- Nome sugerido: **`predecessoras`** (lista de IDs de tarefas que devem terminar antes desta).

### Formato

```js
// Exemplo: "Identidade visual" depende de "Definir tema"
ganttData['identidade-visual'] = {
  responsavel: '...',
  status: '...',
  predecessoras: ['def-tema'],   // ← novo campo
  // ... resto igual
};
```

### Inicialização

- Na função que garante o objeto em `ganttData` (onde hoje se faz `dependenciasExternas: ''`), **acrescentar** uma linha:
  - `predecessoras: ganttData[taskId].predecessoras || []`
- Assim: tarefas antigas ficam com `predecessoras: []`; novas com array; ao carregar do `localStorage` o valor é mantido.

### Regras de consistência (recomendadas)

- **Só aceitar IDs que existam em `TAREFAS`** (tarefas realmente no cronograma).
- **Não permitir dependência de si mesma** (excluir `taskId` da lista ao editar).
- **Opcional (fase 2):** detetar ciclos (A→B→A) ao adicionar e avisar ou bloquear.

---

## 2. Onde mostrar no relatório (modal da tarefa)

### Local

- **Secção “Detalhes”** do modal de relatório (onde já estão Prazo, Riscos, Dependências externas, Observações).
- **Novo bloco** imediatamente **abaixo** de “Dependências externas” ou entre “Riscos” e “Dependências externas”:
  - Título: **“Depende de (tarefas do cronograma)”**.

### Conteúdo

1. **Lista das predecessoras atuais**
   - Para cada ID em `predecessoras`: mostrar o **título** da tarefa (usando `TAREFAS.find(t => t.id === id)?.titulo`).
   - Cada item com um botão/link **“Remover”** (ou ícone ×) que tira esse ID de `predecessoras`, chama `salvar()` e atualiza a lista.

2. **Adicionar predecessora**
   - Um **`<select>`** (dropdown) com todas as tarefas do cronograma **exceto**:
     - a tarefa atual (`tarefaRelatorioAberta`),
     - as que já estão em `predecessoras`.
   - Opção vazia tipo “— Adicionar dependência —”.
   - Ao escolher uma tarefa: fazer `predecessoras.push(id)`, `salvar()`, atualizar a lista e o dropdown (remover a opção escolhida).

### Comportamento

- Ao abrir o modal (`abrirModalRelatorio(taskId)`), além de preencher os campos atuais, preencher esta nova lista a partir de `obterGantt(taskId).predecessoras`.
- Manter o padrão atual: cada alteração chama `salvar()` e, se for preciso atualizar outras vistas, `atualizarVistas()`.

### Resumo no relatório

- Uma linha de texto tipo: **“Depende de: [Tarefa A], [Tarefa B]”** (ou “Nenhuma”) já resolve; os links/botões “Remover” e o select “Adicionar” completam a edição.

---

## 3. Onde mostrar no Gantt (vista anual)

O timeline usa **vis-timeline** com `items` e `groups`; não há “edges” nativos. Duas camadas de sugestão:

### 3.1. Mínimo (só informação)

- **Tooltip da barra:** cada item do timeline já tem `title`. Ao construir o item em `renderTimeline()`:
  - Se `obterGantt(t.id).predecessoras?.length > 0`:
    - Definir `title` com texto tipo: **“Depende de: [título 1], [título 2]”** (títulos das tarefas em `predecessoras`).
  - Senão: manter `title` vazio ou com o que já existir (ex.: datas).
- **Custo:** uma linha ao construir cada item; nenhuma alteração na estrutura do vis-timeline.

### 3.2. Opcional (setas no Gantt)

- Desenhar **linhas/setas** “fim da predecessora → início desta tarefa” por cima do timeline.
- **Implementação possível:**
  - Uma **camada SVG** (ou div com bordas) por cima de `#timeline-container`, com `pointer-events: none`.
  - Em `renderTimeline()`, depois do timeline estar desenhado, calcular posições dos itens (ex.: `timelineInstance.getEventProperties()` ou posições dos nós no DOM) e desenhar segmentos de linha entre:
    - fim da barra da predecessora (por grupo e data)
    - início da barra da tarefa dependente.
  - Atualizar essas linhas quando o utilizador mudar zoom ou janela (eventos do vis) ou quando `atualizarVistas()` chamar `renderTimeline()`.
- Pode ficar para uma **fase 2**, depois do relatório e do tooltip estáveis.

---

## 4. Ficheiros a alterar (resumo)

| Ficheiro | Alteração |
|----------|-----------|
| **app.js** | (1) Inicialização de `predecessoras` em `ganttData`; (2) no relatório: ler/escrever `predecessoras`, UI “Depende de (tarefas)”; (3) em `renderTimeline()`: preencher `title` do item com texto das predecessoras. |
| **integracao-funcional.html** | Na secção “Detalhes” do modal de relatório: adicionar o bloco HTML “Depende de (tarefas do cronograma)” (container da lista + select + botão/label). |
| **estilos.css** | (Opcional) Estilos para a lista de predecessoras (chips, botão Remover, select) para manter o aspecto do resto do modal. |

---

## 5. Ordem de implementação sugerida

1. **Dados:** em `app.js`, acrescentar `predecessoras: []` na inicialização de `ganttData` e garantir que `salvar()`/carregar já persistem objetos com arrays (normalmente já funciona com `JSON.stringify`).
2. **Relatório:** em `integracao-funcional.html` adicionar o bloco; em `app.js` em `abrirModalRelatorio()` preencher a lista e ligar os handlers de “Adicionar” e “Remover”.
3. **Gantt:** em `renderTimeline()`, ao construir cada item, definir `title` com “Depende de: …” quando houver predecessoras.
4. **(Opcional)** Estilos em `estilos.css` e, numa fase posterior, linhas SVG no Gantt.

---

## 6. O que não alterar (proteção do escopo)

- Lógica de drag, resize, notas, vistas Mês/Semana/Dia/Lista.
- Estrutura geral do modal (só acrescentar secção/campos).
- Comportamento do vis-timeline (só preencher `title` e, mais tarde, desenhar overlay).
- Campo “Dependências externas” (texto livre) permanece como está; “Depende de (tarefas)” é apenas um bloco novo na mesma secção.

Assim, as dependências entre tarefas ficam com estrutura de dados clara, visíveis no relatório e no Gantt (pelo menos por tooltip), sem alterar o que está aprovado para além do necessário.
