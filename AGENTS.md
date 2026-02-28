# AGENTS.md

## Cursor Cloud specific instructions

### Overview

**Febre de Arte 2026** is a pure client-side (vanilla HTML/CSS/JS) event planning application. There is no backend, no build system, and no `package.json` in the original repo. All JS/CSS libraries (FullCalendar, Moment.js, DHTMLX Gantt) are loaded from CDNs at runtime.

### Core files

| File | Purpose |
|------|---------|
| `integracao-funcional.html` | Main entry point |
| `app.js` | All application logic |
| `estilos.css` | All styles |
| `Kanban.html` | Separate Kanban board page |

### Running the app

Serve files with any static HTTP server on port 8080:

```
npx serve -l 8080 .
```

Then open `http://localhost:8080/integracao-funcional.html` in Chrome.

### Linting

```
npx html-validate integracao-funcional.html
npx htmlhint integracao-funcional.html
npx htmlhint Kanban.html
```

Configs: `.htmlvalidate.json`, `.htmlhintrc`. Note: `html-validate` reports pre-existing errors (aria labels, implicit button types) that are part of the approved scope and should not be "fixed" without explicit request.

### Important caveats

- **Approved scope protection**: `app.js`, `estilos.css`, and `integracao-funcional.html` have an approved scope (see `ESCOPO_APROVADO.md`). Do not modify behavior/structure/styles in these files unless explicitly requested. Backup copies are in `_ESCOPO_APROVADO_/`.
- **Internet required**: CDN-loaded libraries will not work offline.
- **Data persistence**: All data is stored in browser `localStorage`; there is no database.
- **No automated test suite**: There are no unit/integration tests. Verification is manual via the browser.
