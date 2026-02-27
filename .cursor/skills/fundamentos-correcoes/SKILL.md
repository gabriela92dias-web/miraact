---
name: fundamentos-correcoes
description: Orienta correções e alterações por princípios de alcance mínimo, fronteiras e preservação do que já funciona. Usar ao corrigir bugs, ajustar comportamento ou quando o usuário pedir mudanças mínimas, não quebrar o que está aprovado, ou evitar retrocesso.
---

# Fundamentos para correções

## Princípios

1. **Alcance mínimo** — Alterar só o que causa o problema. Não refatorar nem “melhorar” handlers, vistas ou fluxos não envolvidos.
2. **Respeitar fronteiras** — Cada mecanismo tem uma responsabilidade. Não consertar A mudando a lógica de B que já funciona; corrigir no lugar certo.
3. **Preservar o que funciona** — Não alterar comportamento aprovado ou estável para contornar um bug. Identificar a causa no fluxo afetado.
4. **Uma preocupação por alteração** — Ao corrigir um problema, não aproveitar para ajustar outro (ex.: nota, resize, outra vista). Mudanças separadas reduzem risco de retrocesso.

## Antes de alterar

- A alteração toca **só** no fluxo/vista/componente que está sendo corrigido?
- O problema está sendo resolvido na **causa** (no código que falha) e não em outro trecho que “compensa”?

## Se o usuário disser que algo quebrou

- Não alterar handlers ou vistas que já estavam aprovados para “consertar” o novo problema.
- Procurar a causa no que foi mudado por último ou no fluxo que o usuário está usando.
