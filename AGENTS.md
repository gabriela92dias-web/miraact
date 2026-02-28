# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Febre de Arte 2026** is a fully client-side event planning application (zero backend). All data lives in `localStorage`. The app is served as static files — no build step, no bundler, no `package.json`.

### Key files

| File | Role |
|---|---|
| `integracao-funcional.html` | Main entry point |
| `app.js` | All application logic |
| `estilos.css` | All styles |
| `Kanban.html` | Alternative Kanban board (self-contained) |

### Serving the app

Start a static HTTP server from the repo root (CDN scripts require HTTP, not `file://`):

```bash
python3 -m http.server 8080 &
```

Then open `http://localhost:8080/integracao-funcional.html` in Chrome.

### Linting

Two HTML linters are configured via `.htmlvalidate.json` and `.htmlhintrc`:

```bash
html-validate integracao-funcional.html
htmlhint integracao-funcional.html
htmlhint Kanban.html
```

`html-validate` has some pre-existing warnings (accessibility rules); `htmlhint` passes clean. There is no JS/CSS linter configured in the repo.

### Important caveats

- **Protected scope**: the files `app.js`, `estilos.css`, and `integracao-funcional.html` are under an approved-scope policy. Do NOT modify them unless the user explicitly requests it. See `ESCOPO_APROVADO.md` and the cursor rule `escopo-aprovado-protegido.mdc`.
- **Backup**: `_ESCOPO_APROVADO_/` contains a snapshot of the approved files for rollback.
- **No automated tests**: there are no test frameworks or test suites in this project.
- **CDN dependencies**: FullCalendar, DHTMLX Gantt, Moment.js, and Google Fonts are loaded from CDNs at runtime — internet access is required.
- **Language**: the user communicates in Portuguese. Always respond in Portuguese.
