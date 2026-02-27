# Escopo aprovado — referência

**Data de aprovação:** fevereiro 2026  
**Objetivo:** Trabalhar em novo material sem pôr em risco o que já está a funcionar na página.

---

## O que está protegido

Toda a funcionalidade atual da aplicação que está a correr como pretendido, em especial:

| Área | Ficheiros principais | Notas |
|------|------------------------|-------|
| Lógica e vistas | `app.js` | Tarefas, Gantt, vistas Mês/Semana/Dia/Anual/Lista, drag, resize, notas, persistência |
| Estilos e layout | `estilos.css` | Notas, botões, centralização, barras semanal, resize handles, tema |
| Página | `integracao-funcional.html` | Estrutura, scripts e estilos carregados |

- **Vista semanal:** grelha por turnos (Manhã/Tarde/Noite), barras multidia, drag com preview e nota global, resize pelo handle esquerdo (início) e direito (fim), sem destaque de célula no drag.
- **Vista mensal / dia:** FullCalendar, eventos, drag, resize, notas.
- **Vista anual:** timeline, itens arrastáveis, notas.
- **Notas de feedback:** `.resize-note` (padrão único para arraste em todas as vistas), centralização e alinhamento.
- **Botões e UI:** abas, filtros, modais, navegação — comportamento e aparência atuais.

---

## Backup para restauro

A pasta **`_ESCOPO_APROVADO_/`** contém uma cópia dos ficheiros no estado aprovado:

- `app.js`
- `estilos.css`
- `integracao-funcional.html`

**Para restaurar:** copiar estes ficheiros de `_ESCOPO_APROVADO_/` para a raiz do projeto (substituindo os atuais).

---

## Como continuar a trabalhar

1. **Novo material / novas funcionalidades:** Preferir ficheiros novos ou secções novas; evitar tocar no código aprovado sem necessidade.
2. **Correções pontuais:** Fazer apenas as alterações mínimas necessárias para o bug ou ajuste pedido.
3. **Mudar o que está aprovado:** Só quando pedires explicitamente (ex.: “alterar o drag da semana”, “mudar o escopo aprovado”).

A regra do Cursor **escopo-aprovado-protegido** aplica-se sempre e recorda ao assistente que não deve alterar este escopo sem o teu pedido explícito.
