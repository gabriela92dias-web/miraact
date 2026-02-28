# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

Static single-page web app (HTML + CSS + vanilla JS) for event planning — "Febre de Arte 2026". No build system, no backend, no `package.json`. Entry point: `integracao-funcional.html`.

### Serving the application

Run a static HTTP server from the workspace root:

```
serve -l 3000
```

Then open `http://localhost:3000/integracao-funcional.html` in Chrome.

CDN-hosted libraries (FullCalendar, Moment.js, DHTMLX Gantt) require internet access.

### Linting

```
htmlhint integracao-funcional.html
html-validate integracao-funcional.html
```

Both tools are installed globally via npm. `htmlhint` should pass cleanly; `html-validate` reports pre-existing warnings (aria-label, button type).

### Important caveats

- **Scope protection**: `app.js`, `estilos.css`, and `integracao-funcional.html` are protected by the `escopo-aprovado-protegido` rule. Do not modify approved behaviour unless the user explicitly asks. Backup copies live in `_ESCOPO_APROVADO_/`.
- **Data persistence**: The app stores data in `localStorage` (key `febre-arte-2026`). Clearing browser data resets all tasks.
- **No automated test suite**: There are no unit/integration tests in this repo. Validation is done via manual browser testing and HTML linting.
- **Secondary pages**: `Kanban.html` is a self-contained Kanban board (backup/legacy). `Kanban_TRAVADO_BACKUP.html` is a frozen backup.
