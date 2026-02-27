const BIBLIOTECA_TAREFAS = [
    { id: 'def-tema', txt: 'Retomar tema ou criar nova identidade; alinhar com o momento atual', preReq: true, prereqDe: null, paralelo: false, tempoEspeculado: '1 semana', grupo: 'planejamento' },
    { id: 'reservar-local', txt: 'Renovar reserva ou buscar novo local; conferir contrato e prazos', preReq: false, prereqDe: null, paralelo: false, tempoEspeculado: '2 semanas', grupo: 'planejamento' },
    { id: 'convidar-palestrantes', txt: 'Atualizar lista; renovar convites e buscar novos nomes', preReq: false, prereqDe: 'def-tema', paralelo: false, tempoEspeculado: '3 semanas', grupo: 'planejamento' },
    { id: 'identidade-visual', txt: 'Atualizar identidade; refazer arte para novas datas e palestrantes', preReq: false, prereqDe: 'def-tema', paralelo: false, tempoEspeculado: '2 semanas', grupo: 'producao' },
    { id: 'divulgar-palestrantes', txt: 'Publicar palestrantes e programação em etapas', preReq: false, prereqDe: 'grade-horarios', paralelo: false, tempoEspeculado: '3 semanas', grupo: 'producao' },
    { id: 'valor-inscricao', txt: 'Decidir preço; abrir/liberar inscrições no prazo certo', preReq: false, prereqDe: 'plataforma-inscricao', paralelo: false, tempoEspeculado: '1 semana', grupo: 'producao' },
    { id: 'execucao-evento', txt: 'Execução do evento (credenciamento, palestrantes, timing, imprevistos)', preReq: false, prereqDe: 'checklist-dia', paralelo: false, tempoEspeculado: '1 semana', grupo: 'execucao' },
    { id: 'fechar-contas', txt: 'Fazer fechamento; guardar comprovantes e relatórios', preReq: false, prereqDe: 'execucao-evento', paralelo: false, tempoEspeculado: '2 semanas', grupo: 'pos-producao' }
];
let TAREFAS = [];
let ganttData = {};
let custos = {};
let caixa = [];
let historico = [];
let redoStack = [];
/* Zoom Gantt = roda do mouse (sem botões). Deslizar horizontal = Espaço + arrastar. */
document.addEventListener('wheel', function(e) {
    var timelineEl = document.getElementById('timeline-container');
    if (!timelineEl || !timelineEl.contains(e.target)) return;
    if (typeof gantt === 'undefined') return;
    e.preventDefault();
    if (gantt.ext && gantt.ext.zoom) {
        if (e.deltaY > 0) ganttZoomDelta(-1); else ganttZoomDelta(1);
        if (typeof atualizarGanttZoomHint === 'function') requestAnimationFrame(atualizarGanttZoomHint);
    }
}, { passive: false });
var spaceHeldForPan = false;
var timelinePanActive = false;
var timelinePanStartX = 0;
var timelinePanStartScrollX = 0;
var timelinePanAccumulatedDx = 0;
var timelinePanHasScroll = false;

document.addEventListener('keydown', function(e) {
    if (e.key === ' ' || e.code === 'Space') {
        var emInput = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target || {}).tagName) || (e.target || {}).isContentEditable;
        if (!emInput) {
            e.preventDefault();
            spaceHeldForPan = true;
            var panArea = document.getElementById('timeline-pan-area');
            if (panArea) panArea.classList.add('space-pan-ready');
        }
        return;
    }
    if (e.ctrlKey && (e.key === 'z' || e.key === 'Z')) {
        var emInput = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName) || (e.target||{}).isContentEditable;
        if (!emInput) { e.preventDefault(); if (e.shiftKey) refazer(); else desfazer(); }
        return;
    }
    if (e.ctrlKey && (e.key === 'y' || e.key === 'Y')) {
        var emInput = /^(INPUT|TEXTAREA|SELECT)$/.test((e.target||{}).tagName) || (e.target||{}).isContentEditable;
        if (!emInput) { e.preventDefault(); refazer(); }
    }
});
document.addEventListener('keyup', function(e) {
    if (e.key === ' ' || e.code === 'Space') {
        spaceHeldForPan = false;
        timelinePanActive = false;
        var panArea = document.getElementById('timeline-pan-area');
        if (panArea) panArea.classList.remove('space-pan-ready', 'space-pan-active');
        return;
    }
});

function initTimelinePanArea() {
    var panArea = document.getElementById('timeline-pan-area');
    if (!panArea || panArea._panInited) return;
    panArea._panInited = true;
    panArea.addEventListener('mouseenter', function() {
        if (spaceHeldForPan) panArea.classList.add('space-pan-ready');
    });
    panArea.addEventListener('mouseleave', function() {
        if (!timelinePanActive) panArea.classList.remove('space-pan-ready', 'space-pan-active');
    });
    panArea.addEventListener('mousedown', function(e) {
        if (e.button !== 0 || !spaceHeldForPan || typeof gantt === 'undefined') return;
        e.preventDefault();
        var state = gantt.getScrollState ? gantt.getScrollState() : null;
        timelinePanActive = true;
        timelinePanStartX = e.clientX;
        timelinePanStartScrollX = state ? (state.x || 0) : 0;
        timelinePanAccumulatedDx = 0;
        timelinePanHasScroll = state && state.width > state.inner_width;
        panArea.classList.add('space-pan-active');
    });
}
initTimelinePanArea();
document.addEventListener('mousemove', function(e) {
    if (!timelinePanActive || typeof gantt === 'undefined') return;
    var dx = timelinePanStartX - e.clientX;
    if (timelinePanHasScroll) {
        var state = gantt.getScrollState ? gantt.getScrollState() : null;
        if (state) {
            var newX = Math.max(0, Math.min(timelinePanStartScrollX + dx, (state.width || 0) - (state.inner_width || 0)));
            gantt.scrollTo(newX, null);
        }
    } else {
        timelinePanAccumulatedDx += dx;
        timelinePanStartX = e.clientX;
        var threshold = 60;
        if (timelinePanAccumulatedDx >= threshold) {
            ganttNavPeriodoAnterior();
            timelinePanAccumulatedDx = 0;
            timelinePanStartX = e.clientX;
        } else if (timelinePanAccumulatedDx <= -threshold) {
            ganttNavPeriodoProximo();
            timelinePanAccumulatedDx = 0;
            timelinePanStartX = e.clientX;
        }
    }
    if (typeof atualizarGanttZoomHint === 'function') requestAnimationFrame(atualizarGanttZoomHint);
});
document.addEventListener('mouseup', function(e) {
    if (e.button === 0 && timelinePanActive) {
        timelinePanActive = false;
        var pa = document.getElementById('timeline-pan-area');
        if (pa) pa.classList.remove('space-pan-active');
    }
});
const STATUS_LISTA = ['nao-iniciada','em-andamento','concluida','pausada','cancelada'];
const STATUS_LABELS = { 'nao-iniciada':'Não iniciada', 'em-andamento':'Em andamento', 'concluida':'Concluída', 'pausada':'Pausada', 'cancelada':'Cancelada' };
const ETAPA_LABELS = { planejamento: 'Planejamento', producao: 'Produção', execucao: 'Execução', 'pos-producao': 'Pós-produção' };
const TURNOS = [{ id: 'manha', label: 'Manhã', inicio: 5, fim: 12 }, { id: 'tarde', label: 'Tarde', inicio: 12, fim: 18 }, { id: 'noite', label: 'Noite', inicio: 18, fim: 22 }];
const HORA_ACUMULACAO = 5; // tarefas sem hora acumulam a partir das 5h
function turnoIndexParaTarefa(tarefaId) {
    const g = obterGantt(tarefaId);
    const dt = (g.dataInicioReal || '').toString();
    const h = dt.length >= 13 ? parseFloat(dt.slice(11, 13)) + parseFloat(dt.slice(14, 16) || '0') / 60 : 5;
    if (h < 12) return 0;
    if (h < 18) return 1;
    return 2;
}
function parseLocalDate(str) { const p = (str||'').split('-').map(Number); if (p.length !== 3) return new Date(str); return new Date(p[0], p[1]-1, p[2]); }
function formatLocalDate(d) { return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
/** Normaliza string de data para YYYY-MM-DD (comparações e exibição na semana). */
function dataSoData(str) { if (!str) return ''; const s = (str + '').trim().split('T')[0].slice(0, 10); return s.length === 10 ? s : ''; }
/**
 * Classifica tarefa multidia na vista semanal: 'acumulo' = barra só no acúmulo; 'grade' = barra na grade (turnos).
 * Regra: preenche dom–sáb E dura pelo menos 7 dias no calendário (diasSpan >= 6) → só acúmulo; senão → grade.
 */
function classificarTarefaSemana(t, segStr, sabStr) {
    const iniStr = dataSoData(t.inicio);
    const fimStr = dataSoData(t.fim || t.inicio);
    if (!iniStr || !fimStr) return 'grade';
    const ini = parseLocalDate(iniStr);
    const fim = parseLocalDate(fimStr);
    const diasSpan = Math.round((fim - ini) / (24 * 60 * 60 * 1000));
    const preencheSemanaInteira = iniStr <= segStr && fimStr >= sabStr;
    const ehAcumulo = preencheSemanaInteira && diasSpan >= 6;
    return ehAcumulo ? 'acumulo' : 'grade';
}
let resizeNoteTimeout = null;
let resizeNoteMouseX = 0, resizeNoteMouseY = 0;
document.addEventListener('mousemove', function(e) {
    resizeNoteMouseX = e.clientX;
    resizeNoteMouseY = e.clientY;
});
function criarElementoNotaResize() {
    if (document.getElementById('resize-note')) return;
    const el = document.createElement('div');
    el.id = 'resize-note';
    el.className = 'resize-note';
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<span class="resize-note-texto"></span><div class="resize-note-datas" aria-hidden="true"></div>';
    document.body.appendChild(el);
}
var NOTA_GAP = 6;
var timelineAnualItemIdDragging = null;
var semanaDragAnchorEl = null;
var resizeNoteAnchorEl = null;
function posicionarNotaNoCursor(notaEl, coord) {
    if (!notaEl) return;
    if (notaEl.parentNode !== document.body) document.body.appendChild(notaEl);
    var x = (coord && typeof coord.cursorX === 'number') ? coord.cursorX : resizeNoteMouseX;
    var y = (coord && typeof coord.cursorY === 'number') ? coord.cursorY : resizeNoteMouseY;
    var ox = NOTA_GAP, oy = NOTA_GAP;
    var w = notaEl.offsetWidth || 80, h = notaEl.offsetHeight || 22;
    if (x + ox + w > window.innerWidth - 4) ox = -w - NOTA_GAP;
    if (y + oy + h > window.innerHeight - 4) oy = -h - NOTA_GAP;
    if (y + oy < 4) oy = 4;
    if (x + ox < 4) ox = 4;
    notaEl.style.setProperty('position', 'fixed', 'important');
    notaEl.style.setProperty('bottom', 'auto', 'important');
    notaEl.style.setProperty('left', (x + ox) + 'px', 'important');
    notaEl.style.setProperty('top', (y + oy) + 'px', 'important');
    notaEl.style.setProperty('transform', 'none', 'important');
}
function posicionarNotaNoElemento(notaEl, anchorEl) {
    if (!notaEl || !anchorEl || !anchorEl.getBoundingClientRect) return;
    if (notaEl.parentNode !== document.body) document.body.appendChild(notaEl);
    var r = anchorEl.getBoundingClientRect();
    var w = notaEl.offsetWidth || 100;
    var h = notaEl.offsetHeight || 24;
    var left = r.left + (r.width / 2) - (w / 2);
    var top = r.bottom + NOTA_GAP;
    if (top + h > window.innerHeight - 8) top = r.top - h - NOTA_GAP;
    if (left < 8) left = 8;
    if (left + w > window.innerWidth - 8) left = window.innerWidth - w - 8;
    if (top < 8) top = 8;
    notaEl.style.setProperty('position', 'fixed', 'important');
    notaEl.style.setProperty('bottom', 'auto', 'important');
    notaEl.style.setProperty('left', left + 'px', 'important');
    notaEl.style.setProperty('top', top + 'px', 'important');
    notaEl.style.setProperty('transform', 'none', 'important');
}
function elementoAncoraNota() {
    if (semanaDragAnchorEl && document.body.contains(semanaDragAnchorEl)) return semanaDragAnchorEl;
    var container = document.getElementById('timeline-container');
    if (container && timelineAnualItemIdDragging) {
        var idStr = String(timelineAnualItemIdDragging);
        var byId = container.querySelector && (container.querySelector('.vis-item[data-id="' + idStr + '"]') || container.querySelector('.vis-item[data-vis-id="' + idStr + '"]'));
        if (byId) return byId;
        var sel = container.querySelector && container.querySelector('.vis-item.vis-selected');
        if (sel) return sel;
    }
    var el = document.elementFromPoint(resizeNoteMouseX, resizeNoteMouseY);
    if (!el) return null;
    return el.closest && (el.closest('.vis-item') || el.closest('.semana-multidia-bg-col') || el.closest('.semana-tarefa') || el.closest('.fc-event'));
}
function atualizarPosicaoNotaResize() {
    const el = document.getElementById('resize-note');
    if (!el || !el.classList.contains('ativo')) return;
    if (!document.body.classList.contains('semana-dragging')) {
        resizeNoteAnchorEl = null;
        el.classList.remove('resize-note--follow');
        el.style.left = ''; el.style.top = ''; el.style.transform = '';
        return;
    }
    el.classList.add('resize-note--follow');
    var anchor = resizeNoteAnchorEl && document.body.contains(resizeNoteAnchorEl) ? resizeNoteAnchorEl : elementoAncoraNota();
    if (anchor) {
        resizeNoteAnchorEl = anchor;
        posicionarNotaNoElemento(el, anchor);
    } else {
        posicionarNotaNoCursor(el);
    }
}
function mostrarNotaResize(texto, datasOpcional, opcoes) {
    criarElementoNotaResize();
    const el = document.getElementById('resize-note');
    if (!el) return;
    if (resizeNoteTimeout) clearTimeout(resizeNoteTimeout);
    resizeNoteTimeout = null;
    var textoEl = el.querySelector('.resize-note-texto');
    var datasEl = el.querySelector('.resize-note-datas');
    if (textoEl) textoEl.textContent = texto || '';
    if (datasEl) {
        datasEl.textContent = datasOpcional || '';
        datasEl.style.display = datasOpcional ? '' : 'none';
        datasEl.setAttribute('aria-hidden', datasOpcional ? 'false' : 'true');
    }
    el.classList.add('ativo');
    if (el.parentNode !== document.body) document.body.appendChild(el);
    el.classList.remove('resize-note--in-panel');
    var coord = (opcoes && (opcoes.cursorX != null || opcoes.cursorY != null)) ? { cursorX: opcoes.cursorX, cursorY: opcoes.cursorY } : null;
    var anchorEl = (opcoes && opcoes.anchorElement) || null;
    if (!anchorEl && opcoes && (opcoes.anchorTimelineItemId || opcoes.anchor === 'anual')) {
        var c = document.getElementById('timeline-container');
        if (c) {
            var idStr = String(opcoes.anchorTimelineItemId || timelineAnualItemIdDragging || '');
            anchorEl = c.querySelector('.vis-item[data-id="' + idStr + '"]') || c.querySelector('.vis-item[data-vis-id="' + idStr + '"]') || c.querySelector('.vis-item.vis-selected');
            if (!anchorEl && c.querySelectorAll) {
                var list = c.querySelectorAll('.vis-item');
                for (var i = 0; i < list.length; i++) {
                    var it = list[i];
                    if (it.getAttribute && (it.getAttribute('data-id') === idStr || it.getAttribute('data-vis-id') === idStr)) { anchorEl = it; break; }
                }
            }
        }
    }
    if (!anchorEl && document.body.classList.contains('semana-dragging')) anchorEl = elementoAncoraNota();
    var ehDuranteArraste = texto && String(texto).indexOf('Arraste para') === 0;
    if (ehDuranteArraste && anchorEl && anchorEl.getBoundingClientRect) {
        resizeNoteAnchorEl = anchorEl;
        el.classList.add('resize-note--follow');
        posicionarNotaNoElemento(el, anchorEl);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { posicionarNotaNoElemento(el, resizeNoteAnchorEl); });
        });
        if (document.body.classList.contains('semana-dragging')) requestAnimationFrame(atualizarPosicaoNotaResize);
    } else {
        resizeNoteAnchorEl = null;
        el.classList.add('resize-note--follow');
        el.style.setProperty('position', 'fixed', 'important');
        el.style.setProperty('bottom', 'auto', 'important');
        el.style.setProperty('left', '', 'important');
        el.style.setProperty('top', '', 'important');
        el.style.setProperty('transform', 'none', 'important');
        posicionarNotaNoCursor(el, coord);
        requestAnimationFrame(function() {
            requestAnimationFrame(function() { posicionarNotaNoCursor(el, coord); });
        });
    }
}
var resizeNoteRaf = null;
document.addEventListener('mousemove', function() {
    const el = document.getElementById('resize-note');
    if (!el || !el.classList.contains('ativo')) return;
    if (!resizeNoteRaf) {
        resizeNoteRaf = requestAnimationFrame(function() {
            resizeNoteRaf = null;
            atualizarPosicaoNotaResize();
        });
    }
}, { passive: true });
document.addEventListener('dragover', function(ev) {
    if (document.getElementById('resize-note') && document.getElementById('resize-note').classList.contains('ativo')) {
        resizeNoteMouseX = ev.clientX;
        resizeNoteMouseY = ev.clientY;
    } else if (ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.length) {
        resizeNoteMouseX = ev.clientX;
        resizeNoteMouseY = ev.clientY;
    }
    var el = document.getElementById('resize-note');
    if (resizeNoteAnchorEl && el && el.classList.contains('ativo') && document.body.contains(resizeNoteAnchorEl)) {
        if (!resizeNoteRaf) {
            resizeNoteRaf = requestAnimationFrame(function() {
                resizeNoteRaf = null;
                posicionarNotaNoElemento(el, resizeNoteAnchorEl);
            });
        }
    }
}, { passive: false });
function esconderNotaResize() {
    if (resizeNoteTimeout) clearTimeout(resizeNoteTimeout);
    resizeNoteTimeout = null;
    resizeNoteAnchorEl = null;
    const el = document.getElementById('resize-note');
    if (el) {
        el.classList.remove('ativo');
        el.classList.remove('resize-note--follow', 'resize-note--in-panel');
        el.style.left = '';
        el.style.top = '';
        el.style.transform = '';
        el.style.bottom = '';
        el.style.position = '';
        if (el.parentNode !== document.body) document.body.appendChild(el);
    }
}
function esconderNotaResizeApos(ms) {
    if (resizeNoteTimeout) clearTimeout(resizeNoteTimeout);
    resizeNoteTimeout = setTimeout(esconderNotaResize, ms);
}
function formatarDatasNota(inicioStr, fimStr) {
    if (!inicioStr || !fimStr) return '';
    const fmt = (s) => s ? s.split('-').reverse().join('/') : '—';
    return fmt(inicioStr) + ' – ' + fmt(fimStr);
}
function formatarDropInfoParaNota(dropInfo) {
    if (!dropInfo || !dropInfo.start) return '';
    const startStr = dropInfo.startStr ? dropInfo.startStr.split('T')[0] : formatLocalDate(dropInfo.start);
    let endStr = startStr;
    if (dropInfo.end) {
        const endDate = new Date(dropInfo.end);
        if (dropInfo.allDay) endDate.setDate(endDate.getDate() - 1);
        endStr = formatLocalDate(endDate);
    }
    return formatarDatasNota(startStr, endStr);
}
let filtros = { busca: '', etapa: '', status: '', responsavel: '' };
function filtroAtivo(campo) { const v = (filtros[campo] || '').toString().trim(); return v.length > 0; }
let tarefaRelatorioAberta = null;
let vistaCronograma = 'mes';
var ganttEtapaFiltro = '';
let miniCalMes = new Date().getFullYear() === 2026 ? new Date().getMonth() : 0;
var dhtmlxGanttInited = false;
let dataAtiva = '2026-01-06';
let anualAtual = 2026;
let semanaAtual = (() => { const d = new Date(2026, 0, 6); d.setDate(d.getDate() - d.getDay()); return d; })();
let vistaAgenda = 'dia'; // 'dia' | 'semana'
function definirDataAtiva(ds) {
    const d = (ds || '').toString().split('T')[0].slice(0, 10);
    if (d && d.length === 10) dataAtiva = d;
}

function irParaAgendaDiaria(dataStr) {
    const ds = (dataStr || '').split('T')[0];
    if (!ds) return;
    definirDataAtiva(ds);
    document.querySelector('.aba[data-painel="calendario"]')?.click();
    if (vistaCronograma !== 'dia') {
        vistaCronograma = 'dia';
        document.querySelectorAll('.cronograma-vista-btn').forEach(b => b.classList.toggle('ativa', b.dataset.vista === 'dia'));
        document.getElementById('cronograma-calendario').style.display = 'block';
        const tc = document.getElementById('turno-coluna-cronograma');
        if (tc) tc.style.display = 'flex';
        document.getElementById('cronograma-semana').style.display = 'none';
        const elAnual = document.getElementById('cronograma-anual'); if (elAnual) elAnual.style.display = 'none';
        document.getElementById('cronograma-lista').style.display = 'none';
        document.getElementById('cronograma-etapas').style.display = 'none';
        if (calendar) calendar.changeView('timeGridDay');
        atualizarCronogramaNav();
    }
    setTimeout(() => {
        if (calendar) calendar.gotoDate(dataAtiva);
        renderMultidiaBar('cronograma-multidia-bar', 'cronograma-multidia-stripe', dataAtiva, 'cronograma');
    }, 50);
}
function obterTarefasMultiDiaParaDia(dataStr) {
    return TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        const g = obterGantt(t.id);
        if (filtroAtivo('status') && (g.status || 'nao-iniciada') !== filtros.status) return false;
        if (filtroAtivo('responsavel') && (g.responsavel || '').toLowerCase() !== (filtros.responsavel || '').toLowerCase()) return false;
        if (filtroAtivo('busca') && !(t.titulo || '').toLowerCase().includes((filtros.busca || '').trim().toLowerCase())) return false;
        const fim = t.fim || t.inicio;
        if (t.inicio > dataStr || fim < dataStr) return false;
        const ini = parseLocalDate(t.inicio);
        const f = parseLocalDate(fim);
        return (f - ini) / (24*60*60*1000) >= 1;
    });
}
function obterTarefasTimedNoDia(dataStr) {
    return TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        const g = obterGantt(t.id);
        if (filtroAtivo('status') && (g.status || 'nao-iniciada') !== filtros.status) return false;
        if (filtroAtivo('responsavel') && (g.responsavel || '').toLowerCase() !== (filtros.responsavel || '').toLowerCase()) return false;
        if (filtroAtivo('busca') && !(t.titulo || '').toLowerCase().includes((filtros.busca || '').trim().toLowerCase())) return false;
        const fim = t.fim || t.inicio;
        if (t.inicio > dataStr || fim < dataStr) return false;
        const ini = parseLocalDate(t.inicio);
        const f = parseLocalDate(fim);
        if ((f - ini) / (24*60*60*1000) >= 1) return false;
        return true;
    });
}
function renderMultidiaStripe(stripeId, dataStr) { /* Usado internamente por renderMultidiaBar */ }
function renderMultidiaBar(containerId, stripeId, dataStr, cal) {
    const stripeEl = document.getElementById(stripeId);
    const gapId = stripeId.replace('-stripe','-gap');
    const gapEl = document.getElementById(gapId);
    if (!stripeEl) return;
    const tarefas = obterTarefasMultiDiaParaDia(dataStr);
    if (tarefas.length === 0) { stripeEl.innerHTML = ''; stripeEl.style.display = 'none'; stripeEl.removeAttribute('data-has-timed'); if (gapEl) gapEl.innerHTML = ''; return; }
    stripeEl.style.display = 'block';
    if (gapEl) {
        gapEl.classList.add('multidia-gap', 'vista-diaria');
        gapEl.classList.toggle('multidia-gap-acumulo', tarefas.length >= 2);
        const formatDataDisplay = (ds) => ds ? ds.split('-').reverse().join('/') : '—';
        const header = `<div class="multidia-gap-count">${tarefas.length === 1 ? '1 tarefa' : tarefas.length + ' tarefas'}</div>`;
        gapEl.innerHTML = header + tarefas.map(t => {
            const g = obterGantt(t.id);
            const titulo = (t.titulo || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const etapaLabel = (ETAPA_LABELS[t.etapa] || t.etapa || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const statusLabel = (STATUS_LABELS[g.status || 'nao-iniciada'] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const responsavel = (g.responsavel || '').trim() || '—';
            const periodo = formatDataDisplay(t.inicio) + ' – ' + formatDataDisplay(t.fim || t.inicio);
            const qtdLabel = tarefas.length === 1 ? '1 tarefa' : `${tarefas.length} tarefas`;
            const qtdHtml = `<span class="multidia-gap-qtd">${qtdLabel}</span> • `;
            const metaStr = ((etapaLabel ? etapaLabel + ' ' : '') + periodo + ' ' + responsavel + (statusLabel ? ' – ' + statusLabel : '')).replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const repeatBlock = `<span class="multidia-gap-leg-item"><span class="multidia-gap-leg-title">${titulo}</span><span class="multidia-gap-leg-meta">${qtdHtml}${metaStr}</span></span>`;
            const repeatBlocks = repeatBlock.repeat(8);
            return `<div class="multidia-gap-legend" ondblclick="abrirModalRelatorio('${t.id}')" title="${(t.titulo||'').replace(/"/g,'&quot;')}"><div class="multidia-gap-scroll">${repeatBlocks}</div></div>`;
        }).join('');
    }
    const hasTimedTasks = obterTarefasTimedNoDia(dataStr).length > 0;
    stripeEl.setAttribute('data-has-timed', hasTimedTasks ? 'true' : 'false');
    stripeEl.setAttribute('data-n-tarefas', String(tarefas.length));
    const n = tarefas.length;
    /* 1 multiday = fundo inteiro; 2+ = divisão proporcional (50/50, 33/33/33). Alpha 0.12 = ~8 camadas distinguíveis */
    const widthPctPerTask = n <= 1 ? 100 : 100 / n;
    const formatDataDisplay = (ds) => ds ? ds.split('-').reverse().join('/') : '—';
    stripeEl.innerHTML = tarefas.map((t, i) => {
        const ini = t.inicio; const fim = t.fim || t.inicio;
        const temAnt = ini < dataStr; const temDep = fim > dataStr;
        const titulo = (t.titulo || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const g = obterGantt(t.id);
        const etapaLabel = (ETAPA_LABELS[t.etapa] || t.etapa || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const statusLabel = (STATUS_LABELS[g.status || 'nao-iniciada'] || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        const responsavel = (g.responsavel || '').trim() || '—';
        const periodo = formatDataDisplay(ini) + ' – ' + formatDataDisplay(fim);
        const metaStr = (etapaLabel ? etapaLabel + ' ' : '') + periodo + ' ' + responsavel + (statusLabel ? ' – ' + statusLabel : '');
        const leftPct = n <= 1 ? 0 : (100 / n) * i;
        const widthPct = widthPctPerTask;
        const z = i + 1;
        let html = `<div class="multidia-stripe-col" style="left:${leftPct}%;width:${widthPct}%;z-index:${z}" ondblclick="abrirModalRelatorio('${t.id}')" title="${titulo}">`;
        if (temAnt || temDep) {
            html += '<div class="multidia-stripe-nav">';
            html += `<button type="button" class="multidia-stripe-nav-btn ${temAnt?'':'disabled'}" ${temAnt ? `onclick="event.stopPropagation();navegarMultidia('${obterDiaAnterior(dataStr)}','${containerId}','${cal}')"` : ''}>‹</button>`;
            html += `<button type="button" class="multidia-stripe-nav-btn ${temDep?'':'disabled'}" ${temDep ? `onclick="event.stopPropagation();navegarMultidia('${obterDiaSeguinte(dataStr)}','${containerId}','${cal}')"` : ''}>›</button>`;
            html += '</div>';
        }
        html += '</div>';
        return html;
    }).join('');
}
function obterDiaAnterior(ds) { const d = parseLocalDate(ds); d.setDate(d.getDate() - 1); return formatLocalDate(d); }
function obterDiaSeguinte(ds) { const d = parseLocalDate(ds); d.setDate(d.getDate() + 1); return formatLocalDate(d); }
function navegarMultidia(dataStr, containerId, cal) {
    const calObj = cal === 'agenda' ? calendarAgenda : calendar;
    if (calObj) calObj.gotoDate(dataStr);
}
function dataFromTimelinePosition(clientX) {
    return dataCentroGantt();
}
function dataCentroGantt() {
    return anualAtual + '-07-01';
}

function tempoParaSemanas(s) {
    if (!s || typeof s !== 'string') return 2;
    const n = s.toLowerCase();
    const m = n.match(/(\d+)/);
    const num = m ? parseInt(m[1], 10) : 1;
    if (n.includes('semana')) return Math.min(12, num);
    if (n.includes('mês') || n.includes('mes')) return Math.min(12, num * 4);
    return Math.min(12, num);
}
/** Tipos de dependência entre tarefas (como em diagramas de Gantt profissionais). Ver FlexiProject / PMI. */
const DEP_TIPOS = [
    { valor: 'FS', label: 'Fim→Início (FS)', desc: 'B só começa quando A termina' },
    { valor: 'SS', label: 'Início→Início (SS)', desc: 'B pode começar quando A começa' },
    { valor: 'FF', label: 'Fim→Fim (FF)', desc: 'B termina quando A termina' },
    { valor: 'SF', label: 'Início→Fim (SF)', desc: 'B termina depois de A começar' }
];
function normalizarPredecessoras(arr) {
    if (!Array.isArray(arr)) return [];
    return arr.map(p => typeof p === 'string' ? { id: p, tipo: 'FS' } : { id: p.id || p, tipo: (p.tipo && ['FS','SS','FF','SF'].includes(p.tipo)) ? p.tipo : 'FS' });
}
function obterGantt(taskId) {
    if (!ganttData[taskId]) ganttData[taskId] = { responsavel: '', status: 'nao-iniciada', dataInicioReal: '', duracaoHoras: 1, prazoPrevisto: '', riscos: '', dependenciasExternas: '', observacoes: '', prioridade: 'media', predecessoras: [], milestone: false, parentId: null };
    if (!Array.isArray(ganttData[taskId].predecessoras)) ganttData[taskId].predecessoras = [];
    ganttData[taskId].predecessoras = normalizarPredecessoras(ganttData[taskId].predecessoras);
    return ganttData[taskId];
}
function tarefaNoCronograma(id) { return TAREFAS.some(t => t.id === id); }
function adicionarAoCronograma(taskId, inicioOpcional, dataInicioRealOpcional, duracaoHorasOpcional) {
    if (tarefaNoCronograma(taskId)) return;
    const lib = BIBLIOTECA_TAREFAS.find(t => t.id === taskId);
    if (!lib) return;
    const semanas = tempoParaSemanas(lib.tempoEspeculado);
    const dInicio = inicioOpcional ? parseLocalDate(inicioOpcional) : new Date(2026, 0, 6);
    const dFim = new Date(dInicio);
    dFim.setDate(dFim.getDate() + semanas * 7);
    TAREFAS.push({
        id: lib.id,
        titulo: lib.txt,
        etapa: lib.grupo || 'planejamento',
        inicio: formatLocalDate(dInicio),
        fim: formatLocalDate(dFim)
    });
    const g = obterGantt(taskId);
    if (dataInicioRealOpcional) { g.dataInicioReal = dataInicioRealOpcional; g.duracaoHoras = duracaoHorasOpcional || 1; }
    salvar();
    atualizarVistas();
}
function addHistorico(taskId, campo, valorAntigo, valorNovo) {
    redoStack = [];
    historico.unshift({ taskId, campo, valorAntigo, valorNovo, data: new Date().toISOString().slice(0, 19) });
    if (historico.length > 100) historico.pop();
}
function addHistoricoBulk(entries) {
    if (!entries || entries.length === 0) return;
    redoStack = [];
    historico.unshift({ bulk: true, entries });
    if (historico.length > 100) historico.pop();
}
function aplicarValorCampo(taskId, campo, valor) {
    const g = obterGantt(taskId);
    if (campo in g) { g[campo] = valor; return; }
    const t = TAREFAS.find(x => x.id === taskId);
    if (t && campo in t) t[campo] = valor;
}
function desfazer() {
    if (historico.length === 0) return;
    const h = historico.shift();
    if (h.bulk) { h.entries.forEach(e => aplicarValorCampo(e.taskId, e.campo, e.valorAntigo)); }
    else { aplicarValorCampo(h.taskId, h.campo, h.valorAntigo); }
    redoStack.unshift(h);
    salvar(); atualizarVistas();
}
function refazer() {
    if (redoStack.length === 0) return;
    const h = redoStack.shift();
    if (h.bulk) { h.entries.forEach(e => aplicarValorCampo(e.taskId, e.campo, e.valorNovo)); }
    else { aplicarValorCampo(h.taskId, h.campo, h.valorNovo); }
    historico.unshift(h);
    salvar(); atualizarVistas();
}
function salvar() {
    try { localStorage.setItem('febre-arte-2026', JSON.stringify({ tarefas: TAREFAS, gantt: ganttData, custos, caixa, historico })); } catch (e) {}
}
function carregar() {
    try {
        const d = JSON.parse(localStorage.getItem('febre-arte-2026') || '{}');
        if (d.tarefas && d.tarefas.length) TAREFAS = d.tarefas;
        if (d.gantt) ganttData = d.gantt;
        if (d.custos) custos = d.custos;
        if (d.caixa) caixa = d.caixa;
        if (d.historico) historico = d.historico;
    } catch (e) {}
}
function atualizarVistas() {
    try { if (calendar && typeof calendar.refetchEvents === 'function') calendar.refetchEvents(); } catch (e) {}
    try { if (calendarAgenda && typeof calendarAgenda.refetchEvents === 'function') calendarAgenda.refetchEvents(); } catch (e) {}
    if (document.getElementById('painel-calendario')?.classList.contains('ativo') && vistaCronograma === 'anual') renderGantt();
    renderBiblioteca?.();
    renderListaEtapas?.();
    renderLista?.();
    renderEtapas?.();
    if (vistaCronograma === 'semana') renderSemana();
    if (document.getElementById('painel-agenda')?.classList.contains('ativo') && vistaAgenda === 'semana') renderSemanaAgenda();
    atualizarFiltroResponsavel?.();
    renderMiniCalendario?.();
}
function atualizarFiltroResponsavel() {
    const sel = document.getElementById('filtro-responsavel');
    if (!sel) return;
    const resp = [...new Set(TAREFAS.map(t => obterGantt(t.id).responsavel).filter(Boolean))].sort();
    const atual = sel.value;
    sel.innerHTML = '<option value="">Responsável</option>' + resp.map(r => `<option value="${r}" ${r===atual?'selected':''}>${r}</option>`).join('');
}
function renderListaEtapas() {
    const el = document.getElementById('lista-etapas');
    if (!el) return;
    const ordem = ['planejamento','producao','execucao','pos-producao'];
    el.innerHTML = ordem.map(et => {
        const arr = TAREFAS.filter(t => t.etapa === et);
        return `<div class="etapa-bloco ${et}"><div style="font-weight:600;font-size:0.75rem;margin-bottom:4px">${ETAPA_LABELS[et]}</div><div style="font-size:0.8rem;color:var(--text-dim)">${arr.length} tarefa(s)</div>${arr.slice(0,3).map(t=>`<div style="font-size:0.75rem;margin-top:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${t.titulo}">${t.titulo}</div>`).join('')}</div>`;
    }).join('');
}
const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_LONG = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DIA_NOMES_COMPLETOS = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
function formatarTituloSemana(d) {
    const primeiroDia = d.getDate();
    const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const semanaNum = Math.ceil(primeiroDia / 7);
    const totalSemanas = Math.ceil(ultimoDia / 7);
    return 'Semana ' + semanaNum + '/' + totalSemanas + ' – ' + MESES_LONG[d.getMonth()] + ' ' + d.getFullYear();
}
function formatarTituloMes(mes, ano) { return MESES_LONG[mes] + ' de ' + ano; }
function formatarTituloAnual(ano) { return 'Ano ' + ano; }
function renderMiniCalendario() {
    const el = document.getElementById('mini-calendario-home');
    if (!el) return;
    const ano = 2026;
    const d = new Date(ano, miniCalMes, 1);
    const diasMes = new Date(ano, miniCalMes + 1, 0).getDate();
    const primeiroDia = d.getDay();
    const hoje = new Date();
    const hojeStr = ano === hoje.getFullYear() && miniCalMes === hoje.getMonth() ? hoje.getDate() : null;
    let html = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(dia=>`<div style="text-align:center;font-size:0.55rem;color:var(--text-dim)">${dia}</div>`).join('');
    for (let i = 0; i < primeiroDia; i++) html += '<div class="mini-cal-dia"></div>';
    for (let dia = 1; dia <= diasMes; dia++) {
        const dt = ano + '-' + String(miniCalMes+1).padStart(2,'0') + '-' + String(dia).padStart(2,'0');
        const hasTask = TAREFAS.some(t => (t.inicio <= dt && t.fim >= dt) || t.inicio === dt || t.fim === dt);
        html += `<div class="mini-cal-dia ${hasTask?'has-tarefa':''} ${dia===hojeStr?'hoje':''}" data-date="${dt}" ondblclick="irParaAgendaDiaria('${dt}')"><span class="mini-cal-add" onclick="event.stopPropagation();abrirModalAdicionarTarefa('${dt}')" title="Adicionar tarefa">+</span>${dia}</div>`;
    }
    el.innerHTML = html;
    document.getElementById('mini-cal-mes-ano').textContent = formatarTituloMes(miniCalMes, ano);
}
function renderLista() {
    const el = document.getElementById('cronograma-lista');
    if (!el) return;
    const filtradas = TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        const g = obterGantt(t.id);
        if (filtroAtivo('status') && (g.status||'nao-iniciada') !== filtros.status) return false;
        if (filtroAtivo('responsavel') && (g.responsavel||'').toLowerCase() !== (filtros.responsavel||'').toLowerCase()) return false;
        if (filtroAtivo('busca') && !(t.titulo||'').toLowerCase().includes((filtros.busca||'').trim().toLowerCase())) return false;
        return true;
    });
    el.innerHTML = `<table class="vista-lista-table"><thead><tr><th>Tarefa</th><th>Etapa</th><th>Responsável</th><th>Status</th><th>Início</th><th>Fim</th></tr></thead><tbody>${filtradas.map(t=>{const g=obterGantt(t.id);return `<tr ondblclick="abrirModalRelatorio('${t.id}')" title=""><td>${t.titulo}</td><td>${ETAPA_LABELS[t.etapa]||t.etapa}</td><td>${g.responsavel||'—'}</td><td>${STATUS_LABELS[g.status||'nao-iniciada']}</td><td>${t.inicio}</td><td>${t.fim}</td></tr>`}).join('')}</tbody></table>`;
}
function renderEtapas() {
    const el = document.getElementById('cronograma-etapas');
    if (!el) return;
    const ordem = ['planejamento','producao','execucao','pos-producao'];
    const filtradas = TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        if (filtroAtivo('busca') && !(t.titulo||'').toLowerCase().includes((filtros.busca||'').trim().toLowerCase())) return false;
        if (filtroAtivo('status')) { const g = obterGantt(t.id); if ((g.status||'nao-iniciada') !== filtros.status) return false; }
        if (filtroAtivo('responsavel')) { const g = obterGantt(t.id); if ((g.responsavel||'').toLowerCase() !== (filtros.responsavel||'').toLowerCase()) return false; }
        return true;
    });
    el.innerHTML = ordem.map(et => {
        const cards = filtradas.filter(t => t.etapa === et).map(t => `<div class="etapas-kanban-card ${t.etapa}" ondblclick="abrirModalRelatorio('${t.id}');event.stopPropagation();" title="">${t.titulo}<br><small style="color:var(--text-dim);font-size:0.75rem">${obterGantt(t.id).responsavel || '—'} Â· ${t.inicio} – ${t.fim}</small></div>`).join('');
        return `<div class="etapas-kanban-col"><h4 style="display:flex;justify-content:space-between;align-items:center">${ETAPA_LABELS[et]}<button type="button" class="etapas-col-add" onclick="event.stopPropagation();abrirModalAdicionarTarefa()" title="Adicionar">+</button></h4>${cards}</div>`;
    }).join('');
}
function obterTarefasMultiDia(semanaInicio, semanaFim) {
    const segStr = formatLocalDate(semanaInicio);
    const sabStr = formatLocalDate(semanaFim);
    return TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        const g = obterGantt(t.id);
        if (filtroAtivo('status') && (g.status || 'nao-iniciada') !== filtros.status) return false;
        if (filtroAtivo('responsavel') && (g.responsavel || '').toLowerCase() !== (filtros.responsavel || '').toLowerCase()) return false;
        if (filtroAtivo('busca') && !(t.titulo || '').toLowerCase().includes((filtros.busca || '').trim().toLowerCase())) return false;
        const iniStr = dataSoData(t.inicio);
        const fimStr = dataSoData(t.fim || t.inicio);
        if (!iniStr || !fimStr || iniStr > sabStr || fimStr < segStr) return false;
        const ini = parseLocalDate(iniStr);
        const f = parseLocalDate(fimStr);
        return (f - ini) / (24*60*60*1000) >= 1;
    });
}
function obterTarefasMultiDiaDentroSemana(semanaInicio, semanaFim) {
    const segStr = formatLocalDate(semanaInicio);
    const sabStr = formatLocalDate(semanaFim);
    return obterTarefasMultiDia(semanaInicio, semanaFim).filter(t => {
        const iniStr = dataSoData(t.inicio);
        const fimStr = dataSoData(t.fim || t.inicio);
        return iniStr >= segStr && fimStr <= sabStr;
    });
}
function obterTarefasMultiDiaUltrapassamSemana(semanaInicio, semanaFim) {
    const segStr = formatLocalDate(semanaInicio);
    const sabStr = formatLocalDate(semanaFim);
    return obterTarefasMultiDia(semanaInicio, semanaFim).filter(t => {
        const iniStr = dataSoData(t.inicio);
        const fimStr = dataSoData(t.fim || t.inicio);
        return iniStr < segStr || fimStr > sabStr;
    });
}
function obterTarefasPorTurno(dataStr, turnoId) {
    const turno = TURNOS.find(t => t.id === turnoId);
    if (!turno) return [];
    const filtradas = TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        const g = obterGantt(t.id);
        if (filtroAtivo('status') && (g.status || 'nao-iniciada') !== filtros.status) return false;
        if (filtroAtivo('responsavel') && (g.responsavel || '').toLowerCase() !== (filtros.responsavel || '').toLowerCase()) return false;
        if (filtroAtivo('busca') && !(t.titulo || '').toLowerCase().includes((filtros.busca || '').trim().toLowerCase())) return false;
        const iniStr = dataSoData(t.inicio);
        const fimStr = dataSoData(t.fim || t.inicio);
        const noDia = (iniStr && fimStr && iniStr <= dataStr && fimStr >= dataStr) || iniStr === dataStr;
        if (!noDia) return false;
        const ini = parseLocalDate(iniStr || t.inicio);
        const f = parseLocalDate(fimStr || t.fim || t.inicio);
        const multidia = (f - ini) / (24*60*60*1000) >= 1;
        if (multidia) return false;
        const dataIni = dataInicioExibicao(t, dataStr);
        const h = parseFloat(dataIni.slice(11, 13)) + parseFloat(dataIni.slice(14, 16)) / 60;
        const dur = g.duracaoHoras || 1;
        const fimH = h + dur;
        return fimH > turno.inicio && h < turno.fim;
    });
    return filtradas.sort((a, b) => {
        const multia = (parseLocalDate(a.fim || a.inicio) - parseLocalDate(a.inicio)) / (24*60*60*1000) >= 1;
        const multib = (parseLocalDate(b.fim || b.inicio) - parseLocalDate(b.inicio)) / (24*60*60*1000) >= 1;
        if (multia && !multib) return -1;
        if (!multia && multib) return 1;
        if (multia && multib) return (a.titulo || '').localeCompare(b.titulo || '');
        const ha = parseFloat(dataInicioExibicao(a, dataStr).slice(11, 13)) + parseFloat(dataInicioExibicao(a, dataStr).slice(14, 16)) / 60;
        const hb = parseFloat(dataInicioExibicao(b, dataStr).slice(11, 13)) + parseFloat(dataInicioExibicao(b, dataStr).slice(14, 16)) / 60;
        return ha - hb;
    });
}
function renderSemana() {
    const el = document.getElementById('semana-grid');
    if (!el) return;
    const seg = new Date(semanaAtual);
    const dias = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(seg);
        d.setDate(seg.getDate() + i);
        dias.push(d);
    }
    const segStr = formatLocalDate(dias[0]);
    const sabStr = formatLocalDate(dias[6]);
    const multidiasDentro = obterTarefasMultiDiaDentroSemana(dias[0], dias[6]).slice(0, 30);
    const multidiasUltrapassam = obterTarefasMultiDiaUltrapassamSemana(dias[0], dias[6]).slice(0, 30);
    const multidiasLongas = multidiasUltrapassam.filter(t => classificarTarefaSemana(t, segStr, sabStr) === 'acumulo');
    const idsLongasBarra = new Set(multidiasLongas.map(t => t.id));
    const multidiasCurtasNaGrade = multidiasUltrapassam.filter(t => classificarTarefaSemana(t, segStr, sabStr) === 'grade');
    const todasParaFaixa = [...multidiasDentro, ...multidiasCurtasNaGrade];
    let html = '<div class="semana-grid" style="grid-template-rows:auto repeat(3, minmax(4.5rem, 1fr)) auto">';
    html += '<div class="semana-cell semana-day-header" style="grid-column:1;grid-row:1"></div>';
    const DIA_ABREV = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    dias.forEach((d, i) => {
        const ds = formatLocalDate(d);
        html += `<div class="semana-cell semana-day-header" style="grid-column:${i + 2};grid-row:1" onclick="definirDataAtiva('${ds}')" ondblclick="irParaAgendaDiaria('${ds}')"><span>${DIA_ABREV[d.getDay()]}</span><span class="dia-numero">${d.getDate()}</span></div>`;
    });
    if (todasParaFaixa.length) {
        html += '<div class="semana-multidia-wrap" style="grid-column:2/-1;grid-row:2/5;position:relative">';
        html += '<div class="semana-multidia-bg-layer" style="position:absolute;inset:0;overflow:hidden;z-index:2">';
        todasParaFaixa.forEach((t, i) => {
            const turnIdx = turnoIndexParaTarefa(t.id);
            const topPct = (turnIdx / 3) * 100;
            const heightPct = 100 / 3;
            let ini = dataSoData(t.inicio) || t.inicio; let fim = dataSoData(t.fim || t.inicio) || (t.fim || t.inicio);
            if (ini < segStr) ini = segStr;
            if (fim > sabStr) fim = sabStr;
            let idxStart = 0; let idxEnd = 6;
            for (let j = 0; j < 7; j++) { if (formatLocalDate(dias[j]) === ini) { idxStart = j; break; } }
            for (let j = 6; j >= 0; j--) { if (formatLocalDate(dias[j]) === fim) { idxEnd = j; break; } }
            const leftPct = (idxStart / 7) * 100 + 0.2;
            const widthPct = ((idxEnd - idxStart + 1) / 7) * 100 - 0.4;
            const tituloEsc = (t.titulo || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            html += '<div class="semana-multidia-bg-col etapa-' + (t.etapa || 'planejamento') + '" data-task-id="' + t.id + '" style="left:' + leftPct + '%;width:' + widthPct + '%;top:' + topPct + '%;height:' + heightPct + '%" draggable="true" ondragstart="semanaTarefaDragStart(event,\'' + t.id + '\')" ondragend="semanaDragEnd()" ondragover="event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect=\'move\'" ondrop="semanaDropFromCoords(event)" ondblclick="abrirModalRelatorio(\'' + t.id + '\')" title="' + tituloEsc + '"><span class="semana-multidia-resize-handle semana-resize-handle-left" data-side="inicio" draggable="false" title="Arrastar para alterar início"></span><span class="fc-daygrid-dot-verde"></span><span class="semana-multidia-bar-title">' + tituloEsc + '</span><span class="semana-multidia-resize-handle" data-side="fim" draggable="false" title="Arrastar para alterar duração"></span></div>';
        });
        html += '</div>';
        html += '<div class="semana-resize-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:3"></div>';
        html += '</div>';
    }
    TURNOS.forEach((turno, turnoIdx) => {
        const gridRow = turnoIdx + 2;
        html += `<div class="semana-cell turno-header" style="grid-column:1;grid-row:${gridRow}">${turno.label}</div>`;
        html += '<div class="semana-manha-wrap semana-manha-wrap-z" style="grid-column:2/-1;grid-row:' + gridRow + '">';
            html += '<div class="semana-manha-cells">';
            dias.forEach(d => {
                const ds = formatLocalDate(d);
                const tarefas = obterTarefasPorTurno(ds, turno.id).filter(t => !idsLongasBarra.has(t.id));
                const durTurno = turno.fim - turno.inicio;
                html += `<div class="semana-cell semana-cell-drop" style="position:relative" data-date="${ds}" data-turno="${turno.id}" onclick="definirDataAtiva('${ds}')" ondblclick="irParaAgendaDiaria('${ds}')" ondragover="semanaCellDragOver(event)" ondrop="semanaTarefaDrop(event,'${ds}','${turno.id}')">`;
                html += `<button type="button" class="semana-cell-add" onclick="event.stopPropagation();abrirModalAdicionarTarefa('${ds}','${turno.id}')" title="Adicionar em ${turno.label}">+</button>`;
                tarefas.forEach(t => {
                    const g = obterGantt(t.id);
                    const multidia = (parseLocalDate(t.fim || t.inicio) - parseLocalDate(t.inicio)) / (24*60*60*1000) >= 1;
                    const dataIni = multidia ? ds + 'T' + String(turno.inicio).padStart(2,'0') + ':00:00' : dataInicioExibicao(t, ds);
                    const h = parseFloat(dataIni.slice(11, 13)) + parseFloat(dataIni.slice(14, 16)) / 60;
                    const dur = multidia ? 1 : (g.duracaoHoras || 1);
                    const topPct = Math.max(0, (h - turno.inicio) / durTurno) * 100;
                    const altPct = Math.min(100 - topPct, (dur / durTurno) * 100);
                    const tituloDisplay = multidia ? (t.titulo + ' · vários dias') : (t.titulo + (dur !== 1 ? ' (' + dur + 'h)' : ''));
                    const tituloEscT = (tituloDisplay || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                    html += `<div class="semana-tarefa semana-tarefa-bar etapa-${t.etapa || 'planejamento'}" style="top:${topPct}%;height:${Math.max(20, altPct)}%" draggable="true" ondragstart="semanaTarefaDragStart(event,'${t.id}')" ondragend="semanaDragEnd()" ondblclick="event.stopPropagation();abrirModalRelatorio('${t.id}')" title="${tituloEscT}"><span class="fc-daygrid-dot-verde"></span><span class="semana-tarefa-title">${tituloEscT}</span></div>`;
                });
                html += '</div>';
            });
            html += '</div></div>';
    });
    const nLongas = multidiasLongas.length;
    const mostraAcumulo = nLongas >= 2;
    const classeAcumuloBar = mostraAcumulo ? ' semana-anim-bar-acumulo' : '';
    html += '<div class="semana-cell semana-anim-header" style="grid-column:1;grid-row:5"></div>';
    html += '<div class="semana-anim-bar' + classeAcumuloBar + '" style="grid-column:2/-1;grid-row:5">';
    if (nLongas >= 1) {
        html += '<div class="semana-anim-informativo">';
        html += '<div class="semana-anim-informativo-count">' + nLongas + (nLongas === 1 ? ' tarefa' : ' tarefas') + '</div>';
        html += '</div>';
    }
    if (multidiasLongas.length) {
        const formatDataDisplay = (ds) => ds ? ds.split('-').reverse().join('/') : '—';
        const items = multidiasLongas.flatMap(t => {
            const g = obterGantt(t.id);
            const titulo = (t.titulo || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const periodo = formatDataDisplay(t.inicio) + ' – ' + formatDataDisplay(t.fim || t.inicio);
            const responsavel = (g.responsavel || '').trim() || '—';
            const etapaLabel = (ETAPA_LABELS[t.etapa] || t.etapa || '');
            const meta = [etapaLabel, periodo, responsavel].filter(Boolean).join(' · ');
            const et = t.etapa || 'planejamento';
            return `<span class="leg-item leg-item-bar etapa-${et}" draggable="true" ondragstart="semanaTarefaDragStart(event,'${t.id}')" ondragend="semanaDragEnd()" ondblclick="abrirModalRelatorio('${t.id}')" title="${titulo} – Arraste para realocar"><span class="fc-daygrid-dot-verde"></span><span class="leg-title">${titulo}</span><span class="leg-meta">${meta}</span></span>`;
        });
        const repeatBlock = items.join('');
        const repeatBlocks = repeatBlock + repeatBlock + repeatBlock;
        html += '<div class="semana-anim-repeat">' + repeatBlocks + '</div>';
    }
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
    requestAnimationFrame(function() { requestAnimationFrame(function() { populateSemanaResizeOverlay(el); }); });
    bindSemanaResizeHandles(el);
}
function populateSemanaResizeOverlay(container) {
    /* Não adicionamos hit areas invisíveis: a barra fica toda livre para arrastar (mover).
     * Esticar (resize) pelo handle esquerdo (data-side="inicio") ou direito (data-side="fim"). */
}
function bindSemanaResizeHandles(container) {
    if (!container || container.dataset.semanaResizeBound === '1') return;
    container.dataset.semanaResizeBound = '1';
    container.addEventListener('mousedown', function semanaBarDragMouse(ev) {
        if (ev.target.closest && ev.target.closest('.semana-multidia-resize-handle')) return;
        var bar = ev.target.closest && ev.target.closest('.semana-multidia-bg-col');
        if (!bar || !bar.dataset || !bar.dataset.taskId) return;
        ev.preventDefault();
        ev.stopPropagation();
        var taskId = bar.dataset.taskId;
        bar.draggable = false;
        document.body.classList.add('semana-dragging');
        window._semanaDragTaskId = taskId;
        window._semanaDrag = true;
        esconderNotaResize();
        semanaMultidiaDragPreviewCreate(bar, taskId);
        bar.style.visibility = 'hidden';
        window._semanaDragBarRef = bar;
        function onMove(ev) {
            var wrap = container.querySelector('.semana-multidia-wrap');
            if (wrap) {
                var rect = wrap.getBoundingClientRect();
                var fakeEv = { clientX: ev.clientX, clientY: ev.clientY, target: ev.target };
                window._semanaDragPreviewLastEv = fakeEv;
                if (!window._semanaDragPreviewRaf) {
                    window._semanaDragPreviewRaf = requestAnimationFrame(function() {
                        window._semanaDragPreviewRaf = null;
                        if (window._semanaDragPreviewLastEv) semanaMultidiaDragPreviewUpdate(window._semanaDragPreviewLastEv);
                    });
                }
            }
            var els = document.elementsFromPoint(ev.clientX, ev.clientY);
            container.querySelectorAll('.semana-cell-drop-over').forEach(function(c) { c.classList.remove('semana-cell-drop-over'); });
            /* Durante drag de barra multiday não destacar célula: alvo = projeção da barra (preview) */
        }
        function onUp(ev) {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            document.body.classList.remove('semana-dragging');
            semanaClearDropOver();
            var els = document.elementsFromPoint(ev.clientX, ev.clientY);
            var cell = els.find(function(el) { return el.classList && el.classList.contains('semana-cell-drop'); });
            var fakeDt = { getData: function() { return taskId; }, types: ['text/plain'] };
            var fakeEv = { clientX: ev.clientX, clientY: ev.clientY, dataTransfer: fakeDt, preventDefault: function() {}, stopPropagation: function() {} };
            if (cell && cell.dataset.date && cell.dataset.turno) {
                semanaTarefaDrop(fakeEv, cell.dataset.date, cell.dataset.turno);
            } else {
                semanaDropFromCoords(fakeEv, container);
            }
            semanaMultidiaDragPreviewClear();
            window._semanaDrag = false;
            window._semanaDragTaskId = null;
            if (bar && bar.parentNode) { bar.style.visibility = ''; bar.draggable = true; }
            window._semanaDragBarRef = null;
        }
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp, { once: true });
    }, true);
    container.addEventListener('dragover', function semanaDragoverCell(ev) {
        if (!ev.dataTransfer || !ev.dataTransfer.types.length) return;
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'move';
        const els = document.elementsFromPoint(ev.clientX, ev.clientY);
        const cell = els.find(function(el) { return el.classList && el.classList.contains('semana-cell-drop'); });
        const overWrap = ev.target.closest('.semana-multidia-wrap');
        if (window._semanaDragTaskId && (overWrap || cell)) {
            window._semanaDragPreviewLastEv = ev;
            if (!window._semanaDragPreviewRaf) {
                window._semanaDragPreviewRaf = requestAnimationFrame(function() {
                    window._semanaDragPreviewRaf = null;
                    if (window._semanaDragPreviewLastEv) semanaMultidiaDragPreviewUpdate(window._semanaDragPreviewLastEv);
                });
            }
        }
        container.querySelectorAll('.semana-cell-drop-over').forEach(function(c) { c.classList.remove('semana-cell-drop-over'); });
        if (!window._semanaDragPreview && cell) cell.classList.add('semana-cell-drop-over');
    }, true);
    container.addEventListener('drop', function semanaDropCell(ev) {
        const els = document.elementsFromPoint(ev.clientX, ev.clientY);
        const cell = els.find(function(el) { return el.classList && el.classList.contains('semana-cell-drop'); });
        container.querySelectorAll('.semana-cell-drop-over').forEach(function(c) { c.classList.remove('semana-cell-drop-over'); });
        if (cell && cell.dataset.date && cell.dataset.turno) {
            ev.preventDefault(); ev.stopPropagation(); semanaTarefaDrop(ev, cell.dataset.date, cell.dataset.turno);
        } else if (ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.includes('text/plain') && window._semanaDragTaskId) {
            ev.preventDefault(); ev.stopPropagation();
            semanaDropFromCoords(ev);
        }
    }, true);
    container.addEventListener('mousedown', function semanaResizeDelegation(ev) {
        var onBarOrTask = ev.target && ev.target.closest && (ev.target.closest('.semana-multidia-bg-col') || ev.target.closest('.semana-tarefa') || ev.target.closest('.leg-item'));
        var onResizeHandle = ev.target && ev.target.closest && ev.target.closest('.semana-multidia-resize-handle');
        if (onBarOrTask && !onResizeHandle) return;
        var handle = ev.target && ev.target.closest && (ev.target.closest('.semana-multidia-resize-handle') || ev.target.closest('.semana-resize-handle-hit'));
        var taskId = null, side = 'fim';
        if (handle) {
            taskId = (handle.closest && handle.closest('.semana-multidia-bg-col') && handle.closest('.semana-multidia-bg-col').dataset.taskId) || (handle.dataset && handle.dataset.taskId);
            side = (handle.dataset && handle.dataset.side) || 'fim';
        }
        if (!taskId) return;
        ev.preventDefault();
        ev.stopPropagation();
        document.body.classList.add('semana-dragging');
        resizeNoteMouseX = ev.clientX;
        resizeNoteMouseY = ev.clientY;
        var layer = container.querySelector && container.querySelector('.semana-multidia-bg-layer');
        const barEl = ev.target.closest('.semana-multidia-bg-col') || (taskId && layer && layer.querySelector('.semana-multidia-bg-col[data-task-id="' + taskId + '"]'));
        const t = taskId && TAREFAS.find(x => x.id === taskId);
        if (!t) return;
        const grid = container.closest('#semana-grid, #semana-grid-agenda') || container;
        if (!grid) return;
        const gridEl = grid.querySelector && grid.querySelector('.semana-grid') || grid;
        const rect = gridEl.getBoundingClientRect();
        var firstCol = gridEl && gridEl.querySelector && gridEl.querySelector('.semana-cell.turno-header');
        const firstColW = (firstCol && firstCol.getBoundingClientRect && firstCol.getBoundingClientRect().width) || 84;
        const dayWidth = (rect.width - firstColW) / 7;
        const seg = new Date(semanaAtual);
        const dias = [];
        for (let i = 0; i < 7; i++) { const d = new Date(seg); d.setDate(seg.getDate() + i); dias.push(d); }
        const segStr = formatLocalDate(dias[0]);
        const sabStr = formatLocalDate(dias[6]);
        function dateFromX(clientX) {
            const dayIndex = Math.max(0, Math.min(6, Math.floor((clientX - (rect.left + firstColW)) / dayWidth)));
            return formatLocalDate(dias[dayIndex]);
        }
        function pctFromDates(iniStr, fimStr) {
            let idxStart = 0, idxEnd = 6;
            for (let j = 0; j < 7; j++) { if (formatLocalDate(dias[j]) === iniStr) { idxStart = j; break; } }
            for (let j = 6; j >= 0; j--) { if (formatLocalDate(dias[j]) === fimStr) { idxEnd = j; break; } }
            const leftPct = (idxStart / 7) * 100 + 0.2;
            const widthPct = ((idxEnd - idxStart + 1) / 7) * 100 - 0.4;
            return { leftPct, widthPct };
        }
        const inicioAtual = dataSoData(t.inicio) || t.inicio;
        const fimAtual = dataSoData(t.fim || t.inicio) || (t.fim || t.inicio);
        var semanaResizeRaf = null;
        var semanaResizeLastPreview = null;
        function atualizarNotaResizeSemana(msg, inicioStr, fimStr) {
            semanaResizeLastPreview = { msg: msg, inicio: inicioStr, fim: fimStr };
            if (semanaResizeRaf) return;
            semanaResizeRaf = requestAnimationFrame(function() {
                semanaResizeRaf = null;
                if (semanaResizeLastPreview) mostrarNotaResize(semanaResizeLastPreview.msg, formatarDatasNota(semanaResizeLastPreview.inicio, semanaResizeLastPreview.fim), { anchor: 'semana' });
            });
        }
        if (side === 'inicio') {
            let previewInicio = inicioAtual;
            mostrarNotaResize('Arraste para alterar duração. Solte para aplicar.', formatarDatasNota(previewInicio, fimAtual), { anchor: 'semana' });
            function onMove(ev) {
                let str = dateFromX(ev.clientX);
                if (str > fimAtual) str = fimAtual;
                if (str < segStr) str = segStr;
                previewInicio = str;
                if (barEl) { const p = pctFromDates(previewInicio, fimAtual); barEl.style.left = p.leftPct + '%'; barEl.style.width = p.widthPct + '%'; }
                atualizarNotaResizeSemana('Arraste para alterar duração. Solte para aplicar.', previewInicio, fimAtual);
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.classList.remove('semana-dragging');
                if (semanaResizeRaf) { cancelAnimationFrame(semanaResizeRaf); semanaResizeRaf = null; }
                semanaResizeLastPreview = null;
                if (previewInicio && previewInicio <= fimAtual && previewInicio !== inicioAtual) {
                    const antInicio = t.inicio;
                    t.inicio = previewInicio;
                    if (!t.fim || dataSoData(t.fim) < t.inicio) t.fim = t.inicio;
                    addHistoricoBulk([{ taskId: t.id, campo: 'inicio', valorAntigo: antInicio, valorNovo: t.inicio }]);
                    salvar();
                    atualizarVistas();
                    if (vistaCronograma === 'semana') setTimeout(function() { renderSemana(); }, 0);
                    if (document.getElementById('painel-agenda') && document.getElementById('painel-agenda').classList.contains('ativo') && vistaAgenda === 'semana') setTimeout(function() { renderSemanaAgenda(); }, 0);
                } else if (barEl) {
                    const p = pctFromDates(inicioAtual, fimAtual);
                    barEl.style.left = p.leftPct + '%';
                    barEl.style.width = p.widthPct + '%';
                }
                mostrarNotaResize('Novas datas:', formatarDatasNota(t.inicio, t.fim || t.inicio), { anchorElement: barEl || undefined });
                esconderNotaResizeApos(1800);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        } else {
            let previewFim = fimAtual;
            mostrarNotaResize('Arraste para alterar duração. Solte para aplicar.', formatarDatasNota(inicioAtual, previewFim), { anchor: 'semana' });
            function onMove(ev) {
                let str = dateFromX(ev.clientX);
                if (str < inicioAtual) str = inicioAtual;
                if (str > sabStr) str = sabStr;
                previewFim = str;
                if (barEl) { const p = pctFromDates(inicioAtual, previewFim); barEl.style.left = p.leftPct + '%'; barEl.style.width = p.widthPct + '%'; }
                atualizarNotaResizeSemana('Arraste para alterar duração. Solte para aplicar.', inicioAtual, previewFim);
            }
            function onUp() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                document.body.classList.remove('semana-dragging');
                if (semanaResizeRaf) { cancelAnimationFrame(semanaResizeRaf); semanaResizeRaf = null; }
                semanaResizeLastPreview = null;
                if (previewFim && previewFim >= inicioAtual && previewFim !== fimAtual) {
                    const antFim = t.fim || t.inicio;
                    t.fim = previewFim;
                    if (dataSoData(t.inicio) > t.fim) t.inicio = t.fim;
                    addHistoricoBulk([{ taskId: t.id, campo: 'fim', valorAntigo: antFim, valorNovo: t.fim }]);
                    salvar();
                    atualizarVistas();
                    if (vistaCronograma === 'semana') setTimeout(function() { renderSemana(); }, 0);
                    if (document.getElementById('painel-agenda') && document.getElementById('painel-agenda').classList.contains('ativo') && vistaAgenda === 'semana') setTimeout(function() { renderSemanaAgenda(); }, 0);
                } else if (barEl) {
                    const p = pctFromDates(inicioAtual, fimAtual);
                    barEl.style.left = p.leftPct + '%';
                    barEl.style.width = p.widthPct + '%';
                }
                mostrarNotaResize('Novas datas:', formatarDatasNota(t.inicio, t.fim || t.inicio), { anchorElement: barEl || undefined });
                esconderNotaResizeApos(1800);
            }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
        }
    }, false);
}
function semanaTarefaDragStart(ev, tarefaId) {
    if (ev.target.closest?.('.semana-multidia-resize-handle') || ev.target.closest?.('.semana-resize-handle-hit')) { ev.preventDefault(); return; }
    ev.dataTransfer.setData('text/plain', tarefaId);
    ev.dataTransfer.effectAllowed = 'move';
    var bar = ev.target.closest?.('.semana-multidia-bg-col');
    resizeNoteMouseX = ev.clientX;
    resizeNoteMouseY = ev.clientY;
    document.body.classList.add('semana-dragging');
    window._semanaDrag = true;
    window._semanaDragTaskId = tarefaId;
    const t = TAREFAS.find(x => x.id === tarefaId);
    var anchorBar = ev.target.closest && (ev.target.closest('.semana-multidia-bg-col') || ev.target.closest('.leg-item') || ev.target.closest('.semana-tarefa') || ev.target);
    if (bar && bar.classList && bar.classList.contains('semana-multidia-bg-col')) {
        esconderNotaResize();
        semanaMultidiaDragPreviewCreate(bar, tarefaId);
        bar.style.visibility = 'hidden';
        semanaDragAnchorEl = null;
    } else {
        semanaDragAnchorEl = anchorBar || null;
        if (t) mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDatasNota(t.inicio, t.fim || t.inicio), { anchorElement: anchorBar || undefined });
    }
    const el = ev.target.classList.contains('leg-item') ? ev.target : ev.target.closest?.('.leg-item');
    if (el) {
        const clone = el.cloneNode(true);
        clone.style.position = 'fixed';
        clone.style.top = '-9999px';
        clone.style.left = '-9999px';
        clone.style.width = (el.offsetWidth || 160) + 'px';
        clone.style.pointerEvents = 'none';
        clone.style.opacity = '0.95';
        clone.style.zIndex = '9999';
        document.body.appendChild(clone);
        const rect = el.getBoundingClientRect();
        ev.dataTransfer.setDragImage(clone, Math.min(24, rect.width / 2), rect.height / 2);
        setTimeout(function() { if (clone.parentNode) document.body.removeChild(clone); }, 0);
        return;
    }
    if (bar && bar.classList && bar.classList.contains('semana-multidia-bg-col')) {
    }
}
function semanaMultidiaBandDrop(ev) {
    ev.preventDefault();
    const el = ev.currentTarget;
    const rect = el.getBoundingClientRect();
    const relX = ev.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, relX / (rect.width || 1)));
    const idx = Math.min(6, Math.max(0, Math.floor(pct * 7)));
    const d = new Date(semanaAtual);
    d.setDate(semanaAtual.getDate() + idx);
    const dataStr = formatLocalDate(d);
    semanaTarefaDrop(ev, dataStr, 'manha');
}
function semanaClearDropOver() {
    document.querySelectorAll('.semana-cell-drop-over').forEach(c => c.classList.remove('semana-cell-drop-over'));
}
function semanaMultidiaDragPreviewCreate(barEl, taskId) {
    const layer = barEl.closest('.semana-multidia-bg-layer');
    if (!layer) return;
    const t = TAREFAS.find(x => x.id === taskId);
    if (!t) return;
    window._semanaDragGhostTop = barEl.style.top || '0%';
    window._semanaDragGhostHeight = barEl.style.height || '33.33%';
    var leftPct = parseFloat(barEl.style.left) || 0;
    var widthPct = parseFloat(barEl.style.width) || 20;
    var wrap = document.createElement('div');
    wrap.className = 'semana-drag-preview-wrap';
    wrap.setAttribute('data-task-id', taskId);
    wrap.style.cssText = 'position:absolute;left:' + leftPct + '%;width:' + widthPct + '%;top:' + (barEl.style.top || '0%') + ';height:' + (barEl.style.height || '33.33%') + ';display:flex;flex-direction:column;pointer-events:none;z-index:10;overflow:visible';
    var ghostBar = barEl.cloneNode(true);
    ghostBar.classList.add('semana-drag-preview');
    ghostBar.removeAttribute('draggable');
    ghostBar.removeAttribute('style');
    ghostBar.style.cssText = 'height:100%;min-height:0;opacity:0.92;pointer-events:none;overflow:hidden;box-sizing:border-box;flex:1 1 auto;';
    wrap.appendChild(ghostBar);
    layer.appendChild(wrap);
    window._semanaDragPreview = wrap;
    window._semanaDragBarRef = barEl;
    mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDatasNota(t.inicio, t.fim || t.inicio) || '', { anchorElement: wrap });
}
function semanaMultidiaDragPreviewUpdate(ev) {
    const previewWrap = window._semanaDragPreview;
    const taskId = window._semanaDragTaskId;
    if (!previewWrap || !taskId) return;
    const wrap = (previewWrap.parentNode && previewWrap.parentNode.closest && previewWrap.parentNode.closest('.semana-multidia-wrap')) || ev.target.closest('.semana-multidia-wrap');
    if (!wrap) return;
    var wrapRect = wrap.getBoundingClientRect();
    if (wrapRect.width <= 0) return;
    const seg = new Date(semanaAtual);
    const dias = [];
    for (let i = 0; i < 7; i++) { const d = new Date(seg); d.setDate(seg.getDate() + i); dias.push(d); }
    const sabStr = formatLocalDate(dias[6]);
    const t = TAREFAS.find(x => x.id === taskId);
    if (!t) return;
    const iniStr = dataSoData(t.inicio) || t.inicio;
    const fimStr = dataSoData(t.fim || t.inicio) || (t.fim || t.inicio);
    var previewInicio, previewFim, turnIdx;
    var els = document.elementsFromPoint(ev.clientX, ev.clientY);
    var cell = els.find(function(el) { return el.classList && el.classList.contains('semana-cell-drop'); });
    if (cell && cell.dataset && cell.dataset.date && cell.dataset.turno) {
        previewInicio = cell.dataset.date;
        var numDiasInclusive = Math.round((parseLocalDate(fimStr) - parseLocalDate(iniStr)) / (24 * 60 * 60 * 1000)) + 1;
        if (numDiasInclusive > 1) {
            var previewFimDate = new Date(parseLocalDate(previewInicio));
            previewFimDate.setDate(previewFimDate.getDate() + numDiasInclusive - 1);
            previewFim = formatLocalDate(previewFimDate);
            if (previewFim > sabStr) previewFim = sabStr;
        } else {
            previewFim = previewInicio;
        }
        var ti = TURNOS.findIndex(function(r) { return r.id === cell.dataset.turno; });
        turnIdx = ti >= 0 ? ti : 0;
    } else {
        var dayWidth = wrapRect.width / 7;
        var dayIndex = Math.max(0, Math.min(6, Math.floor((ev.clientX - wrapRect.left) / dayWidth)));
        var turnIndex = wrapRect.height > 0 ? Math.max(0, Math.min(2, Math.floor((ev.clientY - wrapRect.top) / (wrapRect.height / 3)))) : 0;
        turnIdx = turnIndex;
        previewInicio = formatLocalDate(dias[dayIndex]);
        previewFim = previewInicio;
        var numDiasInclusive = Math.round((parseLocalDate(fimStr) - parseLocalDate(iniStr)) / (24 * 60 * 60 * 1000)) + 1;
        if (numDiasInclusive > 1) {
            var previewFimDate = new Date(dias[dayIndex]);
            previewFimDate.setDate(previewFimDate.getDate() + numDiasInclusive - 1);
            previewFim = formatLocalDate(previewFimDate);
            if (previewFim > sabStr) previewFim = sabStr;
        }
    }
    var idxStart = 0, idxEnd = 6;
    for (let j = 0; j < 7; j++) { if (formatLocalDate(dias[j]) === previewInicio) { idxStart = j; break; } }
    for (let j = 6; j >= 0; j--) { if (formatLocalDate(dias[j]) === previewFim) { idxEnd = j; break; } }
    const leftPct = (idxStart / 7) * 100 + 0.2;
    const widthPct = ((idxEnd - idxStart + 1) / 7) * 100 - 0.4;
    const topPct = (turnIdx / 3) * 100;
    const heightPct = 100 / 3;
    previewWrap.style.top = topPct + '%';
    previewWrap.style.height = heightPct + '%';
    previewWrap.style.left = leftPct + '%';
    previewWrap.style.width = Math.min(100 - leftPct, widthPct) + '%';
    var noteEl = document.getElementById('resize-note');
    if (noteEl && noteEl.classList.contains('ativo')) {
        var datasEl = noteEl.querySelector('.resize-note-datas');
        if (datasEl) { datasEl.textContent = formatarDatasNota(previewInicio, previewFim) || ''; datasEl.style.display = ''; }
    }
}
function semanaMultidiaDragPreviewClear() {
    if (window._semanaDragPreviewRaf) { cancelAnimationFrame(window._semanaDragPreviewRaf); window._semanaDragPreviewRaf = null; }
    if (window._semanaDragPreview && window._semanaDragPreview.parentNode) window._semanaDragPreview.parentNode.removeChild(window._semanaDragPreview);
    window._semanaDragPreview = null;
    if (window._semanaDragBarRef) { window._semanaDragBarRef.style.visibility = ''; window._semanaDragBarRef = null; }
    esconderNotaResize();
    window._semanaDragTaskId = null;
    window._semanaDragGhostTop = null;
    window._semanaDragGhostHeight = null;
    window._semanaDragPreviewLastEv = null;
    if (window._semanaDragImageEl && window._semanaDragImageEl.parentNode) { window._semanaDragImageEl.parentNode.removeChild(window._semanaDragImageEl); }
    window._semanaDragImageEl = null;
}
function semanaCellDragOver(ev) {
    ev.preventDefault();
    ev.dataTransfer.dropEffect = 'move';
    semanaClearDropOver();
    if (!window._semanaDragPreview && ev.currentTarget && ev.currentTarget.classList && ev.currentTarget.classList.contains('semana-cell-drop')) {
        ev.currentTarget.classList.add('semana-cell-drop-over');
        const ds = ev.currentTarget.dataset.date;
        if (ds) mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDatasNota(ds, ds), { anchorElement: undefined });
    }
}
function semanaDropFromCoords(ev, containerOverride) {
    ev.preventDefault();
    ev.stopPropagation();
    semanaClearDropOver();
    if (!ev.dataTransfer || !ev.dataTransfer.types || !ev.dataTransfer.types.includes('text/plain')) return;
    const container = containerOverride || (ev.currentTarget && ev.currentTarget.closest && ev.currentTarget.closest('#semana-grid, #semana-grid-agenda'));
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const firstColW = 84;
    const dayAreaLeft = rect.left + firstColW;
    const dayAreaWidth = rect.width - firstColW;
    if (dayAreaWidth <= 0) return;
    const dayIndex = Math.max(0, Math.min(6, Math.floor((ev.clientX - dayAreaLeft) / (dayAreaWidth / 7))));
    const rowHeight = rect.height / 5;
    const rowIndex = Math.floor((ev.clientY - rect.top) / rowHeight);
    const turnIndex = rowIndex >= 1 && rowIndex <= 3 ? rowIndex - 1 : 0;
    const seg = new Date(semanaAtual);
    const d = new Date(seg);
    d.setDate(seg.getDate() + dayIndex);
    const dataStr = formatLocalDate(d);
    const turnoId = (TURNOS[turnIndex] || TURNOS[0]).id;
    semanaTarefaDrop(ev, dataStr, turnoId);
}
function semanaTarefaDrop(ev, dataStr, turnoId) {
    ev.preventDefault();
    semanaClearDropOver();
    const id = ev.dataTransfer.getData('text/plain');
    const t = TAREFAS.find(x => x.id === id);
    const g = obterGantt(id);
    if (!t || !g) return;
    const turno = TURNOS.find(r => r.id === turnoId);
    if (!turno) return;
    const antInicio = t.inicio; const antFim = t.fim || t.inicio; const antDataInicioReal = g.dataInicioReal;
    const iniStr = dataSoData(antInicio);
    const fimStr = dataSoData(antFim);
    const iniDate = parseLocalDate(iniStr || antInicio);
    const fimDate = parseLocalDate(fimStr || antFim);
    const diasSpan = (fimDate - iniDate) / (24 * 60 * 60 * 1000);
    const multidia = diasSpan >= 1;
    t.inicio = dataStr;
    if (multidia) {
        const novoFimDate = new Date(parseLocalDate(dataStr));
        novoFimDate.setDate(novoFimDate.getDate() + Math.round(diasSpan));
        t.fim = formatLocalDate(novoFimDate);
    } else {
        t.fim = dataStr;
    }
    g.dataInicioReal = dataStr + 'T' + String(turno.inicio).padStart(2,'0') + ':00:00';
    addHistoricoBulk([{ taskId: id, campo: 'inicio', valorAntigo: antInicio, valorNovo: dataStr }, { taskId: id, campo: 'fim', valorAntigo: antFim, valorNovo: t.fim }, { taskId: id, campo: 'dataInicioReal', valorAntigo: antDataInicioReal, valorNovo: g.dataInicioReal }]);
    salvar();
    atualizarVistas();
    semanaMultidiaDragPreviewClear();
    window._semanaDrag = false;
    semanaDragAnchorEl = null;
    var anchorBarDrop = document.getElementById('cronograma-semana') && document.getElementById('cronograma-semana').querySelector('.semana-multidia-bg-col[data-task-id="' + t.id + '"]') || (document.getElementById('agenda-semana-wrap') && document.getElementById('agenda-semana-wrap').querySelector('.semana-multidia-bg-col[data-task-id="' + t.id + '"]'));
    setTimeout(function() { mostrarNotaResize('Novas datas:', formatarDatasNota(t.inicio, t.fim || t.inicio), { anchorElement: anchorBarDrop || undefined }); esconderNotaResizeApos(1800); }, 0);
}
function semanaDragEnd() {
    document.body.classList.remove('semana-dragging');
    semanaDragAnchorEl = null;
    if (window._semanaDrag) { window._semanaDrag = false; esconderNotaResize(); }
    semanaMultidiaDragPreviewClear();
}
function semanaAnterior() { semanaAtual.setDate(semanaAtual.getDate() - 7); renderSemana(); if (vistaAgenda === 'semana') renderSemanaAgenda(); }
function proximaSemana() { semanaAtual.setDate(semanaAtual.getDate() + 7); renderSemana(); if (vistaAgenda === 'semana') renderSemanaAgenda(); }
function aplicarDataAtivaCronograma(dataStr) {
    const ds = (dataStr || dataAtiva || '').toString().split('T')[0];
    if (!ds) return;
    if (vistaCronograma === 'mes' || vistaCronograma === 'dia') {
        if (calendar) calendar.gotoDate(ds);
        return;
    }
    if (vistaCronograma === 'semana') {
        const d = parseLocalDate(ds);
        semanaAtual.setTime(d.getTime());
        semanaAtual.setDate(semanaAtual.getDate() - semanaAtual.getDay());
        renderSemana();
        return;
    }
    if (vistaCronograma === 'anual') {
        const ano = parseInt(ds.slice(0, 4), 10);
        if (!isNaN(ano)) { anualAtual = ano; if (typeof gantt !== 'undefined') renderGantt(); }
    }
}
function anualAnterior() { anualAtual--; renderGantt(); }
    function anualProximo() { anualAtual++; renderGantt(); }
function renderSemanaAgenda() {
    const el = document.getElementById('semana-grid-agenda');
    if (!el) return;
    const seg = new Date(semanaAtual);
    const dias = [];
    for (let i = 0; i < 7; i++) { const d = new Date(seg); d.setDate(seg.getDate() + i); dias.push(d); }
    const segStrAg = formatLocalDate(dias[0]);
    const sabStrAg = formatLocalDate(dias[6]);
    const multidiasAgDentro = obterTarefasMultiDiaDentroSemana(dias[0], dias[6]).slice(0, 30);
    const multidiasAgUltrapassam = obterTarefasMultiDiaUltrapassamSemana(dias[0], dias[6]).slice(0, 30);
    const multidiasAgLongas = multidiasAgUltrapassam.filter(t => classificarTarefaSemana(t, segStrAg, sabStrAg) === 'acumulo');
    const idsLongasBarraAg = new Set(multidiasAgLongas.map(t => t.id));
    const multidiasAgCurtasNaGrade = multidiasAgUltrapassam.filter(t => classificarTarefaSemana(t, segStrAg, sabStrAg) === 'grade');
    const todasParaFaixaAg = [...multidiasAgDentro, ...multidiasAgCurtasNaGrade];
    let html = '<div class="semana-grid" style="grid-template-rows:auto repeat(3, minmax(4.5rem, 1fr)) auto">';
    html += '<div class="semana-cell semana-day-header" style="grid-column:1;grid-row:1"></div>';
    const DIA_ABREV_AG = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    dias.forEach((d, i) => { const ds = formatLocalDate(d); html += `<div class="semana-cell semana-day-header" style="grid-column:${i + 2};grid-row:1" onclick="definirDataAtiva('${ds}')" ondblclick="irParaAgendaDiaria('${ds}')"><span>${DIA_ABREV_AG[d.getDay()]}</span><span class="dia-numero">${d.getDate()}</span></div>`; });
    if (todasParaFaixaAg.length) {
        html += '<div class="semana-multidia-wrap" style="grid-column:2/-1;grid-row:2/5;position:relative">';
        html += '<div class="semana-multidia-bg-layer" style="position:absolute;inset:0;overflow:hidden;z-index:2">';
        todasParaFaixaAg.forEach((t, i) => {
            const turnIdxAg = turnoIndexParaTarefa(t.id);
            const topPctAg = (turnIdxAg / 3) * 100;
            const heightPctAg = 100 / 3;
            let ini = dataSoData(t.inicio) || t.inicio; let fim = dataSoData(t.fim || t.inicio) || (t.fim || t.inicio);
            if (ini < segStrAg) ini = segStrAg;
            if (fim > sabStrAg) fim = sabStrAg;
            let idxStart = 0; let idxEnd = 6;
            for (let j = 0; j < 7; j++) { if (formatLocalDate(dias[j]) === ini) { idxStart = j; break; } }
            for (let j = 6; j >= 0; j--) { if (formatLocalDate(dias[j]) === fim) { idxEnd = j; break; } }
            const leftPct = (idxStart / 7) * 100 + 0.2;
            const widthPct = ((idxEnd - idxStart + 1) / 7) * 100 - 0.4;
            const tituloEscAg = (t.titulo || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            html += '<div class="semana-multidia-bg-col etapa-' + (t.etapa || 'planejamento') + '" data-task-id="' + t.id + '" style="left:' + leftPct + '%;width:' + widthPct + '%;top:' + topPctAg + '%;height:' + heightPctAg + '%" draggable="true" ondragstart="semanaTarefaDragStart(event,\'' + t.id + '\')" ondragend="semanaDragEnd()" ondragover="event.preventDefault();event.stopPropagation();event.dataTransfer.dropEffect=\'move\'" ondrop="semanaDropFromCoords(event)" ondblclick="abrirModalRelatorio(\'' + t.id + '\')" title="' + tituloEscAg + '"><span class="semana-multidia-resize-handle semana-resize-handle-left" data-side="inicio" draggable="false" title="Arrastar para alterar início"></span><span class="fc-daygrid-dot-verde"></span><span class="semana-multidia-bar-title">' + tituloEscAg + '</span><span class="semana-multidia-resize-handle" data-side="fim" draggable="false" title="Arrastar para alterar duração"></span></div>';
        });
        html += '</div>';
        html += '<div class="semana-resize-overlay" style="position:absolute;inset:0;pointer-events:none;z-index:3"></div>';
        html += '</div>';
    }
    TURNOS.forEach((turno, turnoIdx) => {
        const gridRow = turnoIdx + 2;
        html += `<div class="semana-cell turno-header" style="grid-column:1;grid-row:${gridRow}">${turno.label}</div>`;
        html += '<div class="semana-manha-wrap semana-manha-wrap-z" style="grid-column:2/-1;grid-row:' + gridRow + '">';
        html += '<div class="semana-manha-cells">';
        dias.forEach(d => {
            const ds = formatLocalDate(d);
            const tarefas = obterTarefasPorTurno(ds, turno.id).filter(t => !idsLongasBarraAg.has(t.id));
            const durTurno = turno.fim - turno.inicio;
            html += `<div class="semana-cell semana-cell-drop" style="position:relative" data-date="${ds}" data-turno="${turno.id}" onclick="definirDataAtiva('${ds}')" ondblclick="irParaAgendaDiaria('${ds}')" ondragover="semanaCellDragOver(event)" ondrop="semanaTarefaDrop(event,'${ds}','${turno.id}')">`;
            html += `<button type="button" class="semana-cell-add" onclick="event.stopPropagation();abrirModalAdicionarTarefa('${ds}','${turno.id}')" title="Adicionar em ${turno.label}">+</button>`;
            tarefas.forEach(t => {
                const g = obterGantt(t.id);
                const multidia = (parseLocalDate(t.fim || t.inicio) - parseLocalDate(t.inicio)) / (24*60*60*1000) >= 1;
                const dataIni = multidia ? ds + 'T' + String(turno.inicio).padStart(2,'0') + ':00:00' : dataInicioExibicao(t, ds);
                const h = parseFloat(dataIni.slice(11, 13)) + parseFloat(dataIni.slice(14, 16)) / 60;
                const dur = multidia ? 1 : (g.duracaoHoras || 1);
                const topPct = Math.max(0, (h - turno.inicio) / durTurno) * 100;
                const altPct = Math.min(100 - topPct, (dur / durTurno) * 100);
                const tituloDisplayAg = multidia ? (t.titulo + ' · vários dias') : (t.titulo + (dur !== 1 ? ' (' + dur + 'h)' : ''));
                const tituloEscAgT = (tituloDisplayAg || '').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                html += `<div class="semana-tarefa semana-tarefa-bar etapa-${t.etapa || 'planejamento'}" style="top:${topPct}%;height:${Math.max(20, altPct)}%" draggable="true" ondragstart="semanaTarefaDragStart(event,'${t.id}')" ondragend="semanaDragEnd()" ondblclick="event.stopPropagation();abrirModalRelatorio('${t.id}')" title="${tituloEscAgT}"><span class="fc-daygrid-dot-verde"></span><span class="semana-tarefa-title">${tituloEscAgT}</span></div>`;
            });
            html += '</div>';
        });
        html += '</div></div>';
    });
    const nLongasAg = multidiasAgLongas.length;
    const mostraAcumuloAg = nLongasAg >= 2;
    const classeAcumuloBarAg = mostraAcumuloAg ? ' semana-anim-bar-acumulo' : '';
    html += '<div class="semana-cell semana-anim-header" style="grid-column:1;grid-row:5"></div>';
    html += '<div class="semana-anim-bar' + classeAcumuloBarAg + '" style="grid-column:2/-1;grid-row:5">';
    if (nLongasAg >= 1) {
        html += '<div class="semana-anim-informativo">';
        html += '<div class="semana-anim-informativo-count">' + nLongasAg + (nLongasAg === 1 ? ' tarefa' : ' tarefas') + '</div>';
        html += '</div>';
    }
    if (multidiasAgLongas.length) {
        const formatDataDisplay = (ds) => ds ? ds.split('-').reverse().join('/') : '—';
        const items = multidiasAgLongas.flatMap(t => {
            const g = obterGantt(t.id);
            const titulo = (t.titulo || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const periodo = formatDataDisplay(t.inicio) + ' – ' + formatDataDisplay(t.fim || t.inicio);
            const responsavel = (g.responsavel || '').trim() || '—';
            const etapaLabel = (ETAPA_LABELS[t.etapa] || t.etapa || '');
            const meta = [etapaLabel, periodo, responsavel].filter(Boolean).join(' · ');
            const etAg = t.etapa || 'planejamento';
            return `<span class="leg-item leg-item-bar etapa-${etAg}" draggable="true" ondragstart="semanaTarefaDragStart(event,'${t.id}')" ondragend="semanaDragEnd()" ondblclick="abrirModalRelatorio('${t.id}')" title="${titulo}"><span class="fc-daygrid-dot-verde"></span><span class="leg-title">${titulo}</span><span class="leg-meta">${meta}</span></span>`;
        });
        const repeatBlock = items.join('');
        const repeatBlocks = repeatBlock + repeatBlock + repeatBlock;
        html += '<div class="semana-anim-repeat">' + repeatBlocks + '</div>';
    }
    html += '</div>';
    html += '</div>';
    el.innerHTML = html;
    requestAnimationFrame(function() { requestAnimationFrame(function() { populateSemanaResizeOverlay(el); }); });
    bindSemanaResizeHandles(el);
}
function mostrarVistaAgenda(tipo) {
    vistaAgenda = tipo;
    document.getElementById('agenda-vista-dia').classList.toggle('ativa', tipo === 'dia');
    document.getElementById('agenda-vista-semana').classList.toggle('ativa', tipo === 'semana');
    document.getElementById('agenda-diaria-wrap').style.display = tipo === 'dia' ? 'block' : 'none';
    document.getElementById('agenda-semana-wrap').style.display = tipo === 'semana' ? 'block' : 'none';
    document.getElementById('agenda-info').textContent = tipo === 'dia' ? 'Vista diária: horários 5h–22h. Arraste para definir hora, redimensione para duração.' : 'Vista semanal: 3 turnos (Manhã 5–12h, Tarde 12–18h, Noite 18–22h). + em cada turno adiciona. Duplo-clique em dia para agenda.';
    if (tipo === 'semana') renderSemanaAgenda();
    setTimeout(atualizarAgendaNav, 0);
}
function atualizarAgendaNav() {
    const titulo = document.getElementById('agenda-titulo');
    if (!titulo) return;
    if (vistaAgenda === 'dia' && calendarAgenda?.view) titulo.textContent = calendarAgenda.view.title || '';
    else if (vistaAgenda === 'semana') titulo.textContent = formatarTituloSemana(semanaAtual);
}

function turnoParaHora(h) {
    if (h >= 5 && h < 12) return 'manha';
    if (h >= 12 && h < 18) return 'tarde';
    if (h >= 18 && h < 22) return 'noite';
    return 'manha';
}
function horaInicioAcumulada(taskId, dataStr) {
    const doDia = TAREFAS.filter(x => {
        const g = obterGantt(x.id);
        const temHora = g.dataInicioReal && g.dataInicioReal.includes('T');
        const noDia = (x.inicio <= dataStr && (x.fim || x.inicio) >= dataStr) || x.inicio === dataStr;
        return noDia && (!temHora || g.dataInicioReal.startsWith(dataStr));
    }).sort((a, b) => a.id.localeCompare(b.id));
    const idx = doDia.findIndex(x => x.id === taskId);
    if (idx < 0) return HORA_ACUMULACAO;
    let acc = HORA_ACUMULACAO;
    for (let i = 0; i < idx; i++) {
        const g = obterGantt(doDia[i].id);
        if (g.dataInicioReal && g.dataInicioReal.includes('T')) {
            const h = parseInt(g.dataInicioReal.slice(11, 13), 10);
            const dur = g.duracaoHoras || 1;
            acc = h + dur;
        } else {
            acc += g.duracaoHoras || 1;
        }
    }
    return acc;
}
function dataInicioExibicao(t, dataStr) {
    const g = obterGantt(t.id);
    if (g.dataInicioReal && g.dataInicioReal.includes('T') && (g.duracaoHoras || 0) > 0) return g.dataInicioReal;
    const h = horaInicioAcumulada(t.id, dataStr);
    const hora = Math.min(22, Math.max(5, Math.floor(h)));
    const min = Math.round((h - hora) * 60);
    return dataStr + 'T' + String(hora).padStart(2, '0') + ':' + String(min).padStart(2, '0') + ':00';
}
function paraFullCalendar(fetchInfo) {
    const filtradas = TAREFAS.filter(t => {
        if (filtroAtivo('etapa') && t.etapa !== filtros.etapa) return false;
        const g = obterGantt(t.id);
        if (filtroAtivo('status') && (g.status || 'nao-iniciada') !== filtros.status) return false;
        if (filtroAtivo('responsavel') && (g.responsavel || '').toLowerCase() !== (filtros.responsavel || '').toLowerCase()) return false;
        if (filtroAtivo('busca') && !(t.titulo || '').toLowerCase().includes((filtros.busca || '').trim().toLowerCase())) return false;
        return true;
    });
    const isTimeGridDay = fetchInfo?.view?.type === 'timeGridDay';
    const dataStr = fetchInfo?.start ? formatLocalDate(fetchInfo.start) : null;
    return filtradas.flatMap(t => {
        const g = obterGantt(t.id);
        const tituloComResp = g.responsavel ? t.titulo + ' • ' + g.responsavel : t.titulo;
        const ini = parseLocalDate(t.inicio);
        const fim = parseLocalDate(t.fim || t.inicio);
        const diasSpan = (fim - ini) / (24*60*60*1000);
        const multidia = diasSpan >= 1;
        if (isTimeGridDay && dataStr && !multidia && t.inicio <= dataStr && (t.fim || t.inicio) >= dataStr) {
            const startISO = dataInicioExibicao(t, dataStr);
            const dur = g.duracaoHoras || 1;
            const startDate = new Date(startISO);
            const endDate = new Date(startDate.getTime() + dur * 60 * 60 * 1000);
            const endISO = endDate.getFullYear() + '-' + String(endDate.getMonth()+1).padStart(2,'0') + '-' + String(endDate.getDate()).padStart(2,'0') + 'T' + String(endDate.getHours()).padStart(2,'0') + ':' + String(endDate.getMinutes()).padStart(2,'0') + ':00';
            return [{ id: t.id, title: tituloComResp, start: startISO, end: endISO, allDay: false, classNames: ['etapa-' + (t.etapa || 'planejamento')], extendedProps: { tarefaId: t.id, etapa: t.etapa, responsavel: g.responsavel } }];
        }
        const endExclusive = new Date(fim);
        endExclusive.setDate(endExclusive.getDate() + 1);
        return [{ id: t.id, title: tituloComResp, start: formatLocalDate(ini), end: formatLocalDate(endExclusive), allDay: true, durationEditable: true, classNames: ['etapa-' + (t.etapa || 'planejamento')], extendedProps: { tarefaId: t.id, etapa: t.etapa, responsavel: g.responsavel } }];
    });
}
const CATEGORIAS_CUSTO = ['infraestrutura','divulgação','pessoal','palestrantes','operacao','outro'];
function abrirModalRelatorio(taskId) {
    const t = TAREFAS.find(x => x.id === taskId);
    if (!t) return;
    tarefaRelatorioAberta = taskId;
    document.getElementById('rel-titulo').textContent = t.titulo;
    const g = obterGantt(taskId);
    document.getElementById('rel-responsavel').value = g.responsavel || '';
    document.getElementById('rel-status').innerHTML = STATUS_LISTA.map(s => `<option value="${s}" ${(g.status||'nao-iniciada')===s?'selected':''}>${STATUS_LABELS[s]}</option>`).join('');
    document.getElementById('rel-prioridade').value = g.prioridade || 'media';
    var relMilestone = document.getElementById('rel-milestone');
    if (relMilestone) { relMilestone.checked = !!g.milestone; }
    document.getElementById('rel-inicio-real').value = (g.dataInicioReal || '').slice(0, 16);
    document.getElementById('rel-duracao-horas').value = g.duracaoHoras || 1;
    document.getElementById('rel-prazo').value = g.prazoPrevisto || '';
    document.getElementById('rel-riscos').value = g.riscos || '';
    document.getElementById('rel-dep-externas').value = g.dependenciasExternas || '';
    document.getElementById('rel-observacoes').value = g.observacoes || '';
    renderRelCustos();
    renderRelPredecessoras();
    document.getElementById('rel-responsavel').onchange = () => { const ant = g.responsavel; g.responsavel = document.getElementById('rel-responsavel').value; addHistorico(taskId, 'responsavel', ant || '', g.responsavel); salvar(); atualizarVistas(); };
    document.getElementById('rel-status').onchange = () => { const ant = g.status; g.status = document.getElementById('rel-status').value; addHistorico(taskId, 'status', ant || '', g.status); salvar(); atualizarVistas(); };
    document.getElementById('rel-prioridade').onchange = () => { g.prioridade = document.getElementById('rel-prioridade').value; salvar(); };
    if (relMilestone) relMilestone.onchange = () => { g.milestone = !!relMilestone.checked; salvar(); if (document.getElementById('painel-calendario')?.classList.contains('ativo') && vistaCronograma === 'anual') renderGantt(); };
    document.getElementById('rel-inicio-real').onchange = () => { g.dataInicioReal = document.getElementById('rel-inicio-real').value ? document.getElementById('rel-inicio-real').value + ':00' : ''; salvar(); atualizarVistas(); };
    document.getElementById('rel-duracao-horas').onchange = () => { g.duracaoHoras = parseFloat(document.getElementById('rel-duracao-horas').value) || 1; salvar(); atualizarVistas(); };
    document.getElementById('rel-prazo').onchange = () => { g.prazoPrevisto = document.getElementById('rel-prazo').value; salvar(); };
    document.getElementById('rel-riscos').onchange = () => { g.riscos = document.getElementById('rel-riscos').value; salvar(); };
    document.getElementById('rel-dep-externas').onchange = () => { g.dependenciasExternas = document.getElementById('rel-dep-externas').value; salvar(); };
    document.getElementById('rel-observacoes').onchange = () => { g.observacoes = document.getElementById('rel-observacoes').value; salvar(); };
    var selDep = document.getElementById('rel-predecessora-add');
    if (selDep) {
        selDep.onchange = function() { adicionarPredecessoraRelatorio(selDep.value); selDep.value = ''; };
    }
    document.getElementById('modal-relatorio').classList.add('ativo');
}
function renderRelPredecessoras() {
    const wrap = document.getElementById('rel-predecessoras');
    const sel = document.getElementById('rel-predecessora-add');
    if (!wrap || !tarefaRelatorioAberta) return;
    const g = obterGantt(tarefaRelatorioAberta);
    const preds = g.predecessoras || [];
    const predIds = preds.map(p => p.id);
    const outrasTarefas = TAREFAS.filter(t => t.id !== tarefaRelatorioAberta && !predIds.includes(t.id));
    if (sel) {
        sel.innerHTML = '<option value="">— Adicionar dependência —</option>' + outrasTarefas.map(t => '<option value="' + t.id + '">' + (t.titulo || t.id).replace(/</g, '&lt;') + '</option>').join('');
        sel.disabled = outrasTarefas.length === 0;
    }
    if (preds.length === 0) {
        wrap.innerHTML = '<p class="rel-dep-vazio">Nenhuma. Esta tarefa não depende de outras do cronograma.</p>';
        return;
    }
    const optsTipo = DEP_TIPOS.map(d => '<option value="' + d.valor + '" title="' + (d.desc || '').replace(/"/g, '&quot;') + '">' + d.label + '</option>').join('');
    wrap.innerHTML = '<div class="rel-dep-legend">' + DEP_TIPOS.map(d => '<span class="rel-dep-legend-item" title="' + (d.desc||'') + '"><b>' + d.valor + '</b> ' + d.desc + '</span>').join('') + '</div>' +
        '<div class="rel-dep-fluxo" aria-label="Tarefas das quais esta depende">' +
        preds.map((p, i) => {
            const pid = p.id;
            const tipo = p.tipo || 'FS';
            const t = TAREFAS.find(x => x.id === pid);
            const titulo = t ? (t.titulo || pid).replace(/</g, '&lt;').replace(/"/g, '&quot;') : pid;
            return '<span class="rel-dep-chip" data-task-id="' + pid + '">' +
                '<span class="rel-dep-chip-link" onclick="abrirModalRelatorio(\'' + pid + '\')" title="Abrir esta tarefa">' +
                '<span class="rel-dep-chip-icon" aria-hidden="true"></span>' +
                '<span class="rel-dep-chip-titulo">' + titulo + '</span></span>' +
                '<select class="rel-dep-chip-tipo" aria-label="Tipo de dependência" onchange="alterarTipoPredecessoraRelatorio(\'' + pid + '\', this.value)">' + optsTipo.replace('value="' + tipo + '"', 'value="' + tipo + '" selected') + '</select>' +
                '<button type="button" class="rel-dep-chip-remove" onclick="removerPredecessoraRelatorio(\'' + pid + '\')" title="Remover dependência" aria-label="Remover dependência">×</button></span>';
        }).join('<span class="rel-dep-seta" aria-hidden="true">→</span>') +
        '<span class="rel-dep-esta">Esta tarefa</span></div>';
}
function alterarTipoPredecessoraRelatorio(taskIdPredecessora, tipo) {
    if (!tarefaRelatorioAberta || !['FS','SS','FF','SF'].includes(tipo)) return;
    const g = obterGantt(tarefaRelatorioAberta);
    const p = (g.predecessoras || []).find(x => x.id === taskIdPredecessora);
    if (p) { p.tipo = tipo; salvar(); }
}
function removerPredecessoraRelatorio(taskIdPredecessora) {
    if (!tarefaRelatorioAberta) return;
    const g = obterGantt(tarefaRelatorioAberta);
    const pred = g.predecessoras || [];
    const idx = pred.findIndex(p => (p.id || p) === taskIdPredecessora);
    if (idx !== -1) { pred.splice(idx, 1); salvar(); renderRelPredecessoras(); }
}
function adicionarPredecessoraRelatorio(taskIdPredecessora) {
    if (!taskIdPredecessora || !tarefaRelatorioAberta) return;
    if (taskIdPredecessora === tarefaRelatorioAberta) return;
    const g = obterGantt(tarefaRelatorioAberta);
    if (!g.predecessoras) g.predecessoras = [];
    if (g.predecessoras.some(p => (p.id || p) === taskIdPredecessora)) return;
    g.predecessoras.push({ id: taskIdPredecessora, tipo: 'FS' });
    salvar();
    renderRelPredecessoras();
}
function renderRelCustos() {
    const el = document.getElementById('rel-custos');
    if (!el || !tarefaRelatorioAberta) return;
    const lista = custos[tarefaRelatorioAberta] || [];
    el.innerHTML = lista.map((c, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:8px;background:var(--glass-dark-subtle);border-radius:6px;margin-bottom:6px;font-size:0.85rem"><span>${c.descricao || '—'} — R$ ${(parseFloat(c.valor)||0).toFixed(2)} (${c.categoria||'outro'})</span><button type="button" onclick="removerCustoRelatorio('${tarefaRelatorioAberta}',${i})" style="background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:1rem">×</button></div>`).join('') || '<span style="font-size:0.8rem;color:var(--text-dim)">Nenhum custo</span>';
}
function adicionarCustoRelatorio() {
    if (!tarefaRelatorioAberta) return;
    const desc = document.getElementById('rel-custo-desc').value?.trim();
    const valor = parseFloat(document.getElementById('rel-custo-valor').value) || 0;
    if (!desc || valor <= 0) return;
    if (!custos[tarefaRelatorioAberta]) custos[tarefaRelatorioAberta] = [];
    custos[tarefaRelatorioAberta].push({ descricao: desc, valor, categoria: document.getElementById('rel-custo-cat').value || 'outro', status: 'nao-pago' });
    document.getElementById('rel-custo-desc').value = '';
    document.getElementById('rel-custo-valor').value = '';
    salvar();
    renderRelCustos();
}
function removerCustoRelatorio(taskId, idx) {
    if (custos[taskId] && custos[taskId][idx]) { custos[taskId].splice(idx, 1); salvar(); renderRelCustos(); }
}
function fecharModalRelatorio() {
    document.getElementById('modal-relatorio').classList.remove('ativo');
    tarefaRelatorioAberta = null;
}
let addTarefaContext = { turnoId: null, dataHoraInicio: null, parentId: null };
let contextMenuData = { data: null, taskId: null };
function showContextMenu(x, y, dataInicio, taskId) {
    contextMenuData = { data: dataInicio || null, taskId: taskId || null };
    var menu = document.getElementById('context-menu');
    var btnAdd = menu.querySelector('[data-action="add-task"]');
    var btnSubtask = menu.querySelector('[data-action="add-subtask"]');
    var btnDetails = menu.querySelector('[data-action="open-details"]');
    if (taskId && String(taskId).indexOf('grupo_') !== 0) {
        if (btnAdd) btnAdd.style.display = 'none';
        if (btnSubtask) btnSubtask.style.display = 'block';
        if (btnDetails) btnDetails.style.display = 'block';
    } else {
        if (btnAdd) btnAdd.style.display = 'block';
        if (btnSubtask) btnSubtask.style.display = 'none';
        if (btnDetails) btnDetails.style.display = 'none';
    }
    menu.style.display = 'block';
    menu.style.left = Math.min(x, window.innerWidth - 220) + 'px';
    menu.style.top = Math.min(y, window.innerHeight - 50) + 'px';
}
function hideContextMenu() {
    document.getElementById('context-menu').style.display = 'none';
}
function abrirModalAdicionarComData(dataStr) {
    hideContextMenu();
    abrirModalAdicionarTarefa(dataStr || new Date().toISOString().slice(0, 10));
}
function abrirModalAdicionarTarefa(dataInicio, turnoId, dataHoraInicio, parentIdPredefinido) {
    addTarefaContext.turnoId = turnoId || null;
    addTarefaContext.dataHoraInicio = dataHoraInicio || null;
    addTarefaContext.parentId = parentIdPredefinido || null;
    var titulo = document.getElementById('add-tarefa-titulo');
    if (titulo) titulo.textContent = addTarefaContext.parentId ? 'Adicionar subtarefa' : 'Adicionar tarefa';
    const sel = document.getElementById('add-tarefa-select');
    const disponiveis = BIBLIOTECA_TAREFAS.filter(t => !tarefaNoCronograma(t.id));
    const aviso = document.getElementById('add-tarefa-aviso');
    const btnConfirmar = document.getElementById('btn-add-tarefa-confirmar');
    if (disponiveis.length === 0) {
        sel.innerHTML = '<option value="">— Nenhuma tarefa disponível —</option>';
        sel.disabled = true;
        aviso.style.display = 'inline';
        btnConfirmar.disabled = true;
    } else {
        sel.innerHTML = '<option value="">— Selecione uma tarefa —</option>' + disponiveis.map(t => `<option value="${t.id}">${t.txt}</option>`).join('');
        sel.disabled = false;
        aviso.style.display = 'none';
        btnConfirmar.disabled = false;
    }
    const dataVal = dataInicio || formatLocalDate(new Date());
    document.getElementById('add-tarefa-data').value = dataVal;
    var parentSelect = document.getElementById('add-tarefa-parent');
    parentSelect.innerHTML = '<option value="">— Nova tarefa (sem subtarefas) —</option>' + TAREFAS.map(function(t) { return '<option value="' + t.id + '">' + (t.titulo || t.id) + '</option>'; }).join('');
    if (addTarefaContext.parentId && TAREFAS.some(function(t) { return t.id === addTarefaContext.parentId; })) {
        parentSelect.value = addTarefaContext.parentId;
        parentSelect.disabled = true;
    } else {
        parentSelect.value = '';
        parentSelect.disabled = false;
    }
    document.getElementById('modal-adicionar-tarefa').classList.add('ativo');
}
function fecharModalAdicionarTarefa() { document.getElementById('modal-adicionar-tarefa').classList.remove('ativo'); }
function criarTarefaDoModal() {
    const id = document.getElementById('add-tarefa-select').value;
    const data = document.getElementById('add-tarefa-data').value;
    if (!id || !data) return;
    let dataInicioReal = null, duracao = 1;
    if (addTarefaContext.dataHoraInicio) {
        const dhi = addTarefaContext.dataHoraInicio;
        dataInicioReal = dhi.length >= 19 ? dhi : dhi + ':00';
    } else if (addTarefaContext.turnoId) {
        const turno = TURNOS.find(t => t.id === addTarefaContext.turnoId);
        if (turno) dataInicioReal = data + 'T' + String(turno.inicio).padStart(2, '0') + ':00:00';
    }
    adicionarAoCronograma(id, data, dataInicioReal, duracao);
    var parentId = document.getElementById('add-tarefa-parent').value || addTarefaContext.parentId || null;
    if (parentId) obterGantt(id).parentId = parentId;
    addTarefaContext.turnoId = null;
    addTarefaContext.dataHoraInicio = null;
    addTarefaContext.parentId = null;
    fecharModalAdicionarTarefa();
    setTimeout(function() {
        atualizarVistas();
        calendar?.refetchEvents?.();
        calendarAgenda?.refetchEvents?.();
    }, 0);
}
function exportarListaTarefas() {
    const linhas = ['Tarefa;Etapa;Responsável;Status;Início;Fim'];
    TAREFAS.forEach(t => { const g = obterGantt(t.id); linhas.push([t.titulo, t.etapa, g.responsavel, g.status||'nao-iniciada', t.inicio, t.fim].join(';')); });
    const a = document.createElement('a'); a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(linhas.join('\n')); a.download = 'tarefas-febre-arte-2026.csv'; a.click();
}
function exportarGanttPDF() {
    document.querySelector('.aba[data-painel="calendario"]')?.click();
    vistaCronograma = 'anual';
    document.querySelectorAll('.cronograma-vista-btn').forEach(b => { b.classList.toggle('ativa', b.dataset.vista === 'anual'); });
    document.getElementById('cronograma-calendario').style.display = 'none';
    document.getElementById('cronograma-semana').style.display = 'none';
    const a = document.getElementById('cronograma-anual'); if (a) a.style.display = 'block';
    document.getElementById('cronograma-lista').style.display = 'none';
    document.getElementById('cronograma-etapas').style.display = 'none';
    if (typeof gantt !== 'undefined') renderGantt();
    setTimeout(() => window.print(), 300);
}

let calendarAgenda = null;

document.getElementById('nav-sidebar-toggle')?.addEventListener('click', () => document.getElementById('nav-sidebar').classList.toggle('minimizada'));
document.querySelectorAll('.aba').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.aba').forEach(b => b.classList.remove('ativa'));
        document.querySelectorAll('.painel').forEach(p => p.classList.remove('ativo'));
        btn.classList.add('ativa');
        const painel = btn.dataset.painel;
        document.getElementById('painel-' + painel)?.classList.add('ativo');
        document.getElementById('layout-main')?.classList.toggle('etapas-visivel', painel === 'home');
        if (painel === 'calendario') { if (vistaCronograma === 'anual' && typeof gantt !== 'undefined') renderGantt(); atualizarCronogramaNav(); }
        if (painel === 'agenda') { if (!calendarAgenda) initAgenda(); else { calendarAgenda.refetchEvents(); if (vistaAgenda === 'dia' && calendarAgenda.view?.activeStart) { const ds = formatLocalDate(calendarAgenda.view.activeStart); renderMultidiaBar('agenda-multidia-bar', 'agenda-multidia-stripe', ds, 'agenda'); } } mostrarVistaAgenda(vistaAgenda); atualizarAgendaNav(); }
        if (painel === 'calendario' && vistaCronograma === 'dia') { renderMultidiaBar('cronograma-multidia-bar', 'cronograma-multidia-stripe', dataAtiva, 'cronograma'); }
        if (painel === 'biblioteca') renderBiblioteca();
        if (painel === 'home') { renderHome(); renderMiniCalendario(); }
        renderListaEtapas();
    });
});
document.querySelectorAll('.cronograma-vista-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.cronograma-vista-btn').forEach(b => b.classList.remove('ativa'));
        btn.classList.add('ativa');
        vistaCronograma = btn.dataset.vista;
        const mostrandoCal = vistaCronograma === 'mes' || vistaCronograma === 'dia';
        document.getElementById('cronograma-calendario').style.display = mostrandoCal ? 'block' : 'none';
        const tc = document.getElementById('turno-coluna-cronograma');
        if (tc) tc.style.display = vistaCronograma === 'dia' ? 'flex' : 'none';
        document.getElementById('cronograma-semana').style.display = vistaCronograma === 'semana' ? 'block' : 'none';
        const elAnual = document.getElementById('cronograma-anual');
        if (elAnual) elAnual.style.display = vistaCronograma === 'anual' ? 'flex' : 'none';
        document.getElementById('cronograma-lista').style.display = vistaCronograma === 'lista' ? 'block' : 'none';
        document.getElementById('cronograma-etapas').style.display = vistaCronograma === 'etapas' ? 'block' : 'none';
        if (mostrandoCal && calendar) {
            calendar.changeView(vistaCronograma === 'mes' ? 'dayGridMonth' : 'timeGridDay');
            calendar.gotoDate(dataAtiva);
        }
        if (vistaCronograma === 'lista') renderLista();
        if (vistaCronograma === 'etapas') renderEtapas();
        if (vistaCronograma === 'semana') aplicarDataAtivaCronograma(dataAtiva);
        else if (vistaCronograma === 'anual') {
            aplicarDataAtivaCronograma(dataAtiva);
            if (typeof gantt !== 'undefined') renderGantt();
        }
        var lm = document.getElementById('layout-main');
        if (lm) lm.classList.toggle('etapas-visivel', document.getElementById('painel-home')?.classList.contains('ativo'));
        setTimeout(atualizarCronogramaNav, 0);
    });
});
function atualizarCronogramaNav() {
    const nav = document.getElementById('cronograma-nav');
    const titulo = document.getElementById('cronograma-titulo');
    if (!nav || !titulo) return;
    const temNav = ['mes','dia','semana','anual'].includes(vistaCronograma);
    nav.style.display = temNav ? 'flex' : 'none';
    if (!temNav) return;
    if (vistaCronograma === 'semana') { titulo.textContent = formatarTituloSemana(semanaAtual); }
    else if (vistaCronograma === 'anual') { titulo.textContent = formatarTituloAnual(anualAtual); }
    else if (calendar && (vistaCronograma === 'mes' || vistaCronograma === 'dia')) {
        const v = calendar.view;
        if (v) titulo.textContent = v.title || '';
    }
}
document.getElementById('mini-cal-prev')?.addEventListener('click', () => { miniCalMes = Math.max(0, miniCalMes - 1); renderMiniCalendario(); });
document.getElementById('mini-cal-next')?.addEventListener('click', () => { miniCalMes = Math.min(11, miniCalMes + 1); renderMiniCalendario(); });
document.getElementById('cron-nav-prev')?.addEventListener('click', () => {
    if (vistaCronograma === 'mes' || vistaCronograma === 'dia') {
        calendar?.prev();
        if (vistaCronograma === 'dia') { const d = parseLocalDate(dataAtiva); d.setDate(d.getDate() - 1); dataAtiva = formatLocalDate(d); }
        else if (vistaCronograma === 'mes') { const d = parseLocalDate(dataAtiva); d.setMonth(d.getMonth() - 1); dataAtiva = formatLocalDate(d); }
    } else if (vistaCronograma === 'semana') { semanaAnterior(); const d = parseLocalDate(dataAtiva); d.setDate(d.getDate() - 7); dataAtiva = formatLocalDate(d); }
    else if (vistaCronograma === 'anual') { anualAnterior(); dataAtiva = anualAtual + '-07-01'; }
    atualizarCronogramaNav();
});
document.getElementById('cron-nav-next')?.addEventListener('click', () => {
    if (vistaCronograma === 'mes' || vistaCronograma === 'dia') {
        calendar?.next();
        if (vistaCronograma === 'dia') { const d = parseLocalDate(dataAtiva); d.setDate(d.getDate() + 1); dataAtiva = formatLocalDate(d); }
        else if (vistaCronograma === 'mes') { const d = parseLocalDate(dataAtiva); d.setMonth(d.getMonth() + 1); dataAtiva = formatLocalDate(d); }
    } else if (vistaCronograma === 'semana') { proximaSemana(); const d = parseLocalDate(dataAtiva); d.setDate(d.getDate() + 7); dataAtiva = formatLocalDate(d); }
    else if (vistaCronograma === 'anual') { anualProximo(); dataAtiva = anualAtual + '-07-01'; }
    atualizarCronogramaNav();
});
document.getElementById('agenda-nav-prev')?.addEventListener('click', () => {
    if (vistaAgenda === 'dia') calendarAgenda?.prev();
    else if (vistaAgenda === 'semana') semanaAnterior();
    atualizarAgendaNav();
});
document.getElementById('agenda-nav-next')?.addEventListener('click', () => {
    if (vistaAgenda === 'dia') calendarAgenda?.next();
    else if (vistaAgenda === 'semana') proximaSemana();
    atualizarAgendaNav();
});

document.getElementById('context-menu')?.querySelector('[data-action="add-task"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const data = contextMenuData.data;
    hideContextMenu();
    abrirModalAdicionarTarefa(data || formatLocalDate(new Date()));
});
document.getElementById('context-menu')?.querySelector('[data-action="add-subtask"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    var taskId = contextMenuData.taskId;
    hideContextMenu();
    if (taskId) {
        var t = TAREFAS.find(function(x) { return x.id === taskId; });
        abrirModalAdicionarTarefa(t ? t.inicio : null, null, null, taskId);
    }
});
document.getElementById('context-menu')?.querySelector('[data-action="open-details"]')?.addEventListener('click', (e) => {
    e.stopPropagation();
    var taskId = contextMenuData.taskId;
    hideContextMenu();
    if (taskId) abrirModalRelatorio(taskId);
});
document.addEventListener('click', hideContextMenu);
document.addEventListener('contextmenu', (e) => {
    const menu = document.getElementById('context-menu');
    if (!e.target.closest('#context-menu')) hideContextMenu();
});

function setupContextMenuAgenda(el, getDateFromTarget) {
    if (!el) return;
    el.addEventListener('contextmenu', (e) => {
        const date = getDateFromTarget(e.target);
        if (date) { e.preventDefault(); showContextMenu(e.clientX, e.clientY, date); }
    });
}
function setupContextMenuTimeline(el) {
    if (!el) return;
    el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        var taskId = null;
        if (typeof gantt !== 'undefined' && gantt.locate) {
            try { taskId = gantt.locate(e); } catch (err) {}
            if (taskId && String(taskId).indexOf('grupo_') === 0) taskId = null;
        }
        if (!taskId && e.target.closest('.vis-item')) return;
        var date = dataFromTimelinePosition(e.clientX);
        showContextMenu(e.clientX, e.clientY, date, taskId);
    });
}
setupContextMenuAgenda(document.getElementById('mini-calendario-home'), (target) => target.closest?.('.mini-cal-dia[data-date]')?.getAttribute?.('data-date'));
setupContextMenuAgenda(document.getElementById('cronograma-etapas'), () => new Date().toISOString().slice(0, 10));
setupContextMenuAgenda(document.getElementById('cronograma-lista'), () => new Date().toISOString().slice(0, 10));
setupContextMenuTimeline(document.getElementById('timeline-container'));
setupContextMenuAgenda(document.getElementById('calendario'), (target) => target.closest?.('[data-date]')?.getAttribute?.('data-date'));
setupContextMenuAgenda(document.getElementById('agenda-diaria'), (target) => {
    const cell = target.closest?.('[data-date]');
    if (cell) return cell.getAttribute('data-date');
    if (calendarAgenda?.view?.activeStart) return calendarAgenda.view.activeStart.toISOString().slice(0, 10);
    return new Date().toISOString().slice(0, 10);
});
setupContextMenuAgenda(document.getElementById('home-conteudo'), () => new Date().toISOString().slice(0, 10));

function renderBiblioteca() {
    const el = document.getElementById('lista-biblioteca');
    if (!el) return;
    const busca = (document.getElementById('filtro-bib-busca')?.value || '').toLowerCase();
    const ordem = ['planejamento','producao','execucao','pos-producao'];
    const grupos = {};
    BIBLIOTECA_TAREFAS.forEach(t => {
        const g = t.grupo || 'planejamento';
        if (!grupos[g]) grupos[g] = [];
        if (!busca || (t.txt || '').toLowerCase().includes(busca)) grupos[g].push(t);
    });
    el.innerHTML = ordem.map(gr => {
        const itens = (grupos[gr] || []).map(t => {
            const ja = tarefaNoCronograma(t.id);
            return `<div class="bib-item etapa-${gr}" style="display:flex;justify-content:space-between;align-items:center;padding:10px 14px;background:var(--glass-dark-subtle);border-radius:8px;margin-bottom:6px;border-left:3px solid ${gr==='planejamento'?'#4b5563':gr==='producao'?'#6b7280':gr==='execucao'?'#9ca3af':'#b4b8bc'}">
                <span style="opacity:${ja?0.7:1}">${t.txt}</span>
                <button onclick="adicionarAoCronograma('${t.id}')" ${ja?'disabled':''} style="padding:4px 12px;font-size:0.8rem;background:${ja?'#25272a':'#84cc16'};color:${ja?'#8b9199':'#1a1a1a'};border:none;border-radius:6px;cursor:${ja?'not-allowed':'pointer'}">${ja?'No cronograma':'+ Adicionar'}</button>
            </div>`;
        }).join('');
        return itens ? `<div style="margin-bottom:16px"><div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-dim);margin-bottom:8px">${ETAPA_LABELS[gr]}</div>${itens}</div>` : '';
    }).join('');
}
document.getElementById('filtro-bib-busca')?.addEventListener('input', renderBiblioteca);

document.getElementById('filtro-busca')?.addEventListener('input', function() { filtros.busca = (this.value || '').trim(); atualizarVistas(); });
document.getElementById('filtro-etapa')?.addEventListener('change', function() { filtros.etapa = (this.value || '').trim(); atualizarVistas(); });
document.getElementById('filtro-status')?.addEventListener('change', function() { filtros.status = (this.value || '').trim(); atualizarVistas(); });
document.getElementById('filtro-responsavel')?.addEventListener('change', function() { filtros.responsavel = (this.value || '').trim(); atualizarVistas(); });

function renderHome() {
    const el = document.getElementById('home-conteudo');
    if (!el) return;
    const concluidas = TAREFAS.filter(t => (obterGantt(t.id).status || '') === 'concluida').length;
    const total = TAREFAS.length;
    const progresso = total ? Math.round(100 * concluidas / total) : 0;
    el.innerHTML = `
        <div class="home-card" style="background:var(--glass-dark);border-radius:10px;padding:16px;border:1px solid var(--border);backdrop-filter:blur(24px)">
            <div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px">Progresso</div>
            <div style="font-size:1.5rem;font-weight:600">${concluidas}/${total}</div>
            <div style="height:6px;background:var(--glass-dark-subtle);border-radius:3px;margin-top:8px;overflow:hidden"><div style="height:100%;width:${progresso}%;background:#84cc16;border-radius:3px"></div></div>
        </div>
        <div class="home-card" style="background:var(--glass-dark);border-radius:10px;padding:16px;border:1px solid var(--border);backdrop-filter:blur(24px)">
            <div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px">Tarefas no cronograma</div>
            <div style="font-size:1.5rem;font-weight:600">${TAREFAS.length}</div>
        </div>
        <div class="home-card" style="background:var(--glass-dark);border-radius:10px;padding:16px;border:1px solid var(--border);backdrop-filter:blur(24px)">
            <div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-dim);margin-bottom:4px">Orçamento</div>
            <div style="font-size:1.2rem;font-weight:600">R$ ${(Object.values(custos).flat().reduce((s,c)=>s+(parseFloat(c.valor)||0),0)).toFixed(2)}</div>
            <div style="font-size:0.75rem;color:var(--text-dim);margin-top:4px">Total custos</div>
        </div>
        <div class="home-card" style="background:var(--glass-dark);border-radius:10px;padding:16px;border:1px solid var(--border);grid-column:1/-1;backdrop-filter:blur(24px)">
            <div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px">Agenda resumida</div>
            <div style="font-size:0.85rem;max-height:200px;overflow-y:auto">${TAREFAS.slice(0,8).map(t => `<div style="padding:6px 0;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;cursor:pointer" ondblclick="abrirModalRelatorio('${t.id}')" title=""><span>${t.titulo}</span><span style="color:var(--text-dim);font-size:0.8rem">${t.inicio} – ${t.fim}</span></div>`).join('') || '<span style="color:var(--text-dim)">Nenhuma tarefa no cronograma</span>'}</div>
        </div>
        <div class="home-card" style="background:var(--glass-dark);border-radius:10px;padding:16px;border:1px solid var(--border);grid-column:1/-1;backdrop-filter:blur(24px)">
            <div style="font-size:0.7rem;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px">Últimas alterações</div>
            <div style="font-size:0.8rem;max-height:120px;overflow-y:auto">${historico.slice(0,5).map(h=>`<div style="padding:4px 0;color:var(--text-dim)">${h.data} — ${(TAREFAS.find(t=>t.id===h.taskId)?.titulo||h.taskId)}: ${h.campo} ${h.valorAntigo||'—'} â†’ ${h.valorNovo||'—'}</div>`).join('') || '<span style="color:var(--text-dim)">Nenhuma alteração</span>'}</div>
        </div>
    `;
}

// Helpers para turnos na vista Dia (grade de horas)
function turnoParaSlot(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    const turno = TURNOS.find(t => h >= t.inicio && h < t.fim);
    if (!turno) return null;
    const isInicioTurno = h === turno.inicio && m === 0;
    return { turno, isInicioTurno };
}
function slotLabelContentTurno(arg) {
    return { html: '' };
}
function slotLaneContentTurno(arg) {
    const r = turnoParaSlot(arg.date);
    if (!r) return null;
    const h = arg.date.getHours();
    const m = arg.date.getMinutes();
    const hora = m === 0 ? (String(h).padStart(2,'0') + ':00') : '–';
    return { html: `<span class="fc-slot-hora-linha">${hora}</span>` };
}
function slotLaneDidMountTurno(arg) {
    const r = turnoParaSlot(arg.date);
    if (r) {
        arg.el.setAttribute('data-turno', r.turno.id);
        if (r.isInicioTurno) arg.el.classList.add('fc-slot-turno-inicio');
    }
}

// FullCalendar
const calEl = document.getElementById('calendario');
const calendar = new FullCalendar.Calendar(calEl, {
    initialView: 'dayGridMonth',
    initialDate: '2026-01-06',
    headerToolbar: false,
    locale: 'pt-br',
    views: { dayGridMonth: { titleFormat: { year: 'numeric', month: 'long' }, displayEventTime: false, eventDurationEditable: true, eventResizableFromStart: true }, timeGridDay: { titleFormat: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }, eventDurationEditable: false } },
    slotMinTime: '05:00:00',
    slotMaxTime: '22:00:00',
    slotLabelContent: slotLabelContentTurno,
    slotLaneContent: slotLaneContentTurno,
    slotLaneDidMount: slotLaneDidMountTurno,
    allDaySlot: false,
    editable: true,
    droppable: true,
    eventOverlap: true,
    dayCellDidMount: function(info) {
        const ds = (info.dateStr || '').split('T')[0];
        info.el.setAttribute('data-date', ds);
        const nMultidia = obterTarefasMultiDiaParaDia(ds).length;
        if (nMultidia >= 2) info.el.classList.add('fc-daygrid-day-acumulo');
        if (nMultidia === 1) info.el.classList.add('fc-daygrid-day-multidia');
        const btn = document.createElement('button');
        btn.className = 'fc-day-add-btn';
        btn.innerHTML = '+';
        btn.type = 'button';
        btn.title = 'Adicionar tarefa';
        const dateForSlot = info.date ? formatLocalDate(info.date) + 'T' + String(info.date.getHours()).padStart(2,'0') + ':' + String(info.date.getMinutes()).padStart(2,'0') : null;
        btn.onclick = (e) => { e.stopPropagation(); abrirModalAdicionarTarefa(ds, null, dateForSlot); };
        info.el.style.position = 'relative';
        info.el.appendChild(btn);
    },
    events: function(info, successCallback) { successCallback(paraFullCalendar(info)); },
    eventAllow: function(dropInfo) {
        mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDropInfoParaNota(dropInfo));
        return true;
    },
    eventContent: function(arg) {
        if (arg.view.type === 'dayGridMonth') return null;
    },
    eventDidMount: function(info) {
        if (info.view.type === 'timeGridDay' && info.event.allDay && info.event.endStr) {
            const start = info.event.startStr?.split('T')[0];
            const end = new Date(info.event.endStr.split('T')[0]);
            end.setDate(end.getDate() - 1);
            const endStr = formatLocalDate(end);
            if (start && endStr && start !== endStr) info.el.style.display = 'none';
        }
        if (info.view.type === 'dayGridMonth') {
            const main = info.el.querySelector && info.el.querySelector('.fc-event-main');
            if (main) {
                const t = (info.event.title || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
                main.innerHTML = '<div class="fc-daygrid-event-custom"><span class="fc-daygrid-dot-verde"></span><span class="fc-daygrid-title-custom">' + t + '</span></div>';
            }
        }
    },
    eventClick: function(info) { info.jsEvent.preventDefault(); if (info.jsEvent.detail === 2) abrirModalRelatorio(info.event.extendedProps?.tarefaId || info.event.id); },
    dateClick: function(info) { definirDataAtiva(info.dateStr); if (info.jsEvent.detail === 2) irParaAgendaDiaria(info.dateStr); },
    datesSet: function(info) {
        if (info.view.type === 'dayGridMonth' && info.view.activeStart && info.view.activeEnd) {
            try { calendar.setOption('eventConstraint', { start: info.view.activeStart, end: info.view.activeEnd }); } catch (e) {}
        } else {
            try { calendar.setOption('eventConstraint', null); } catch (e) {}
        }
        atualizarCronogramaNav();
        const bar = document.getElementById('cronograma-multidia-bar'); const stripe = document.getElementById('cronograma-multidia-stripe'); const g = document.getElementById('cronograma-multidia-gap'); const isDia = info.view.type === 'timeGridDay';
        if (g) { if (isDia) g.classList.add('vista-diaria'); else { g.classList.remove('vista-diaria'); g.innerHTML = ''; } }
        if (isDia) { renderMultidiaBar('cronograma-multidia-bar', 'cronograma-multidia-stripe', dataAtiva, 'cronograma'); } else { if (bar) { bar.innerHTML = ''; bar.style.display = 'none'; } if (stripe) { stripe.innerHTML = ''; stripe.style.display = 'none'; } }
    },
    eventDragStart: function(info) {
        document.body.classList.add('semana-dragging');
        if (info.jsEvent) { resizeNoteMouseX = info.jsEvent.clientX; resizeNoteMouseY = info.jsEvent.clientY; }
        const e = info.event;
        let inicio = e.startStr ? e.startStr.split('T')[0] : '';
        let fim = inicio;
        if (e.endStr && e.allDay) { const d = new Date(e.endStr.split('T')[0]); d.setDate(d.getDate() - 1); fim = formatLocalDate(d); } else if (e.endStr) fim = e.endStr.split('T')[0];
        mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDatasNota(inicio, fim), { anchorElement: info.el });
    },
    eventDragStop: function() { document.body.classList.remove('semana-dragging'); esconderNotaResize(); },
    eventDrop: function(info) {
        const tid = info.event.extendedProps?.tarefaId || info.event.id;
        const t = TAREFAS.find(x => x.id === tid);
        if (t) {
            const antInicio = t.inicio; const antFim = t.fim;
            t.inicio = info.event.startStr.split('T')[0];
            if (info.event.allDay && info.event.endStr) {
                const d = new Date(info.event.endStr.split('T')[0]);
                d.setDate(d.getDate() - 1);
                t.fim = formatLocalDate(d);
            } else {
                t.fim = info.event.endStr ? info.event.endStr.split('T')[0] : t.inicio;
            }
            addHistoricoBulk([{ taskId: tid, campo: 'inicio', valorAntigo: antInicio, valorNovo: t.inicio }, { taskId: tid, campo: 'fim', valorAntigo: antFim, valorNovo: t.fim }]);
            salvar();
            atualizarVistas();
            var cursor = info.jsEvent ? { cursorX: info.jsEvent.clientX, cursorY: info.jsEvent.clientY } : null;
            mostrarNotaResize('Novas datas:', formatarDatasNota(t.inicio, t.fim || t.inicio), cursor ? { cursorX: cursor.cursorX, cursorY: cursor.cursorY } : {});
            esconderNotaResizeApos(1800);
        }
    },
    eventResizeStart: function(info) {
        document.body.classList.add('semana-dragging');
        if (info.jsEvent) { resizeNoteMouseX = info.jsEvent.clientX; resizeNoteMouseY = info.jsEvent.clientY; }
        const e = info.event;
        let inicio = e.startStr ? e.startStr.split('T')[0] : '';
        let fim = inicio;
        if (e.endStr && e.allDay) { const d = new Date(e.endStr.split('T')[0]); d.setDate(d.getDate() - 1); fim = formatLocalDate(d); } else if (e.endStr) fim = e.endStr.split('T')[0];
        mostrarNotaResize('Arraste para alterar duração. Solte para aplicar.', formatarDatasNota(inicio, fim), { anchorElement: info.el });
    },
    eventResizeStop: function() { document.body.classList.remove('semana-dragging'); esconderNotaResize(); },
    eventResize: function(info) {
        const tid = info.event.extendedProps?.tarefaId || info.event.id;
        const t = TAREFAS.find(x => x.id === tid);
        if (t) {
            const antInicio = t.inicio; const antFim = t.fim;
            t.inicio = info.event.startStr.split('T')[0];
            if (info.event.allDay && info.event.endStr) {
                const d = new Date(info.event.endStr.split('T')[0]);
                d.setDate(d.getDate() - 1);
                t.fim = formatLocalDate(d);
            } else {
                t.fim = info.event.endStr ? info.event.endStr.split('T')[0] : t.inicio;
            }
            addHistoricoBulk([{ taskId: tid, campo: 'inicio', valorAntigo: antInicio, valorNovo: t.inicio }, { taskId: tid, campo: 'fim', valorAntigo: antFim, valorNovo: t.fim }]);
            salvar();
            atualizarVistas();
            try { if (calendar && calendar.refetchEvents) calendar.refetchEvents(); } catch (e) {}
            setTimeout(function() { try { if (calendar && calendar.refetchEvents) calendar.refetchEvents(); } catch (e) {} }, 50);
            var cursor = info.jsEvent ? { cursorX: info.jsEvent.clientX, cursorY: info.jsEvent.clientY } : null;
            mostrarNotaResize('Novas datas:', formatarDatasNota(t.inicio, t.fim), cursor ? { cursorX: cursor.cursorX, cursorY: cursor.cursorY } : {});
            esconderNotaResizeApos(1800);
        } else esconderNotaResize();
    }
});

calendar.render();

function initAgenda() {
    const el = document.getElementById('agenda-diaria');
    if (!el || calendarAgenda) return;
    calendarAgenda = new FullCalendar.Calendar(el, {
        initialView: 'timeGridDay',
        initialDate: '2026-01-06',
        headerToolbar: false,
        locale: 'pt-br',
        views: { timeGridDay: { titleFormat: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } } },
        slotMinTime: '05:00:00',
        slotMaxTime: '22:00:00',
        slotDuration: '00:30:00',
        slotLabelInterval: '01:00:00',
        slotLabelContent: slotLabelContentTurno,
        slotLaneContent: slotLaneContentTurno,
        slotLaneDidMount: slotLaneDidMountTurno,
        allDaySlot: false,
        editable: true,
        eventDurationEditable: false,
        eventOverlap: true,
        dayCellDidMount: function(info) {
            const ds = info.date ? formatLocalDate(info.date) : (info.dateStr || '').split('T')[0];
            const dateForSlot = info.date ? formatLocalDate(info.date) + 'T' + String(info.date.getHours()).padStart(2,'0') + ':' + String(info.date.getMinutes()).padStart(2,'0') : null;
            info.el.setAttribute('data-date', ds);
            const btn = document.createElement('button');
            btn.className = 'fc-day-add-btn';
            btn.innerHTML = '+';
            btn.type = 'button';
            btn.title = 'Adicionar tarefa';
            btn.onclick = (e) => { e.stopPropagation(); abrirModalAdicionarTarefa(ds, null, dateForSlot); };
            info.el.style.position = 'relative';
            info.el.appendChild(btn);
        },
        events: function(info, successCallback) { successCallback(paraFullCalendar(info)); },
        eventAllow: function(dropInfo) {
            mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDropInfoParaNota(dropInfo));
            return true;
        },
        eventDidMount: function(info) {
            if (info.view.type === 'timeGridDay' && info.event.allDay && info.event.endStr) {
                const start = info.event.startStr?.split('T')[0];
                const end = new Date(info.event.endStr.split('T')[0]);
                end.setDate(end.getDate() - 1);
                const endStr = formatLocalDate(end);
                if (start && endStr && start !== endStr) info.el.style.display = 'none';
            }
        },
        eventClick: function(info) { info.jsEvent.preventDefault(); if (info.jsEvent.detail === 2) abrirModalRelatorio(info.event.extendedProps?.tarefaId || info.event.id); },
        dateClick: function(info) { if (info.jsEvent.detail === 2) irParaAgendaDiaria(info.dateStr); },
        datesSet: function(info) { atualizarAgendaNav(); const g = document.getElementById('agenda-multidia-gap'); const isDia = info.view?.type === 'timeGridDay'; if (g) { if (isDia) g.classList.add('vista-diaria'); else { g.classList.remove('vista-diaria'); g.innerHTML = ''; } } if (isDia && info.view?.activeStart) { const ds = formatLocalDate(info.view.activeStart); renderMultidiaBar('agenda-multidia-bar', 'agenda-multidia-stripe', ds, 'agenda'); } },
        eventDragStart: function(info) {
            document.body.classList.add('semana-dragging');
            if (info.jsEvent) { resizeNoteMouseX = info.jsEvent.clientX; resizeNoteMouseY = info.jsEvent.clientY; }
            const e = info.event;
            let inicio = e.startStr ? e.startStr.split('T')[0] : '';
            let fim = inicio;
            if (e.endStr && e.allDay) { const d = new Date(e.endStr.split('T')[0]); d.setDate(d.getDate() - 1); fim = formatLocalDate(d); } else if (e.endStr) fim = e.endStr.split('T')[0];
            mostrarNotaResize('Arraste para mover. Solte para aplicar.', formatarDatasNota(inicio, fim), { anchorElement: info.el });
        },
        eventDragStop: function() { document.body.classList.remove('semana-dragging'); esconderNotaResize(); },
        eventDrop: function(info) {
            const tid = info.event.extendedProps?.tarefaId || info.event.id;
            const t = TAREFAS.find(x => x.id === tid);
            if (t) {
                const g = obterGantt(t.id);
                const antInicio = t.inicio; const antFim = t.fim;
                const antDataInicioReal = g.dataInicioReal; const antDuracaoHoras = g.duracaoHoras;
                t.inicio = t.fim = info.event.startStr.split('T')[0];
                if (!info.event.allDay) {
                    g.dataInicioReal = info.event.start.toISOString().slice(0, 19);
                    g.duracaoHoras = (info.event.end - info.event.start) / (60 * 60 * 1000);
                }
                const ent = [{ taskId: tid, campo: 'inicio', valorAntigo: antInicio, valorNovo: t.inicio }, { taskId: tid, campo: 'fim', valorAntigo: antFim, valorNovo: t.fim }];
                if (!info.event.allDay) { ent.push({ taskId: tid, campo: 'dataInicioReal', valorAntigo: antDataInicioReal, valorNovo: g.dataInicioReal }); ent.push({ taskId: tid, campo: 'duracaoHoras', valorAntigo: antDuracaoHoras, valorNovo: g.duracaoHoras }); }
                addHistoricoBulk(ent);
                salvar();
                mostrarNotaResize('Novas datas:', formatarDatasNota(t.inicio, t.fim || t.inicio), { anchorElement: info.el });
                esconderNotaResizeApos(1800);
            }
        },
        eventResize: function() { esconderNotaResize(); }
    });
    calendarAgenda.render();
}

/** Mapeia tipo de dependência nosso (FS/SS/FF/SF) para tipo numérico DHTMLX (0,1,2,3). */
function dhtmlxLinkTypeFromTipo(tipo) {
    return { FS: 0, SS: 1, FF: 2, SF: 3 }[tipo] || 0;
}
function dhtmlxTipoFromLinkType(n) {
    return ['FS', 'SS', 'FF', 'SF'][n] || 'FS';
}

/** Alterna visibilidade da sidebar de etapas. */
function toggleTimelineEtapasSidebar() {
    var sidebar = document.getElementById('timeline-etapas-sidebar');
    var toggle = document.getElementById('timeline-etapas-toggle');
    if (!sidebar || !toggle) return;
    var oculta = sidebar.classList.toggle('oculta');
    toggle.textContent = oculta ? '▶' : '◀';
    toggle.title = oculta ? 'Mostrar etapas' : 'Ocultar etapas';
}

var ganttColsSidebarOculta = false;
var GANTT_COLS_FULL = [
    { name: 'text', label: 'Tarefa', width: 200, min_width: 160, tree: true },
    { name: 'add', label: '', width: 44 }
];
var GANTT_COLS_REDUZIDO = [{ name: 'text', label: '', width: 1, tree: true }];
var GANTT_GRID_WIDTH_FULL = 244;
var GANTT_GRID_WIDTH_MIN = 0;
/** Alterna visibilidade da coluna Tarefa — libera espaço para o calendário. */
function toggleGanttColsSidebar() {
    if (typeof gantt === 'undefined') return;
    ganttColsSidebarOculta = !ganttColsSidebarOculta;
    try {
        gantt.config.grid_width = ganttColsSidebarOculta ? GANTT_GRID_WIDTH_MIN : GANTT_GRID_WIDTH_FULL;
        if (typeof gantt.hideColumn === 'function' && typeof gantt.showColumn === 'function') {
            ['text', 'add'].forEach(function(name) {
                if (ganttColsSidebarOculta) gantt.hideColumn(name); else gantt.showColumn(name);
            });
        } else {
            gantt.config.columns = ganttColsSidebarOculta ? GANTT_COLS_REDUZIDO : GANTT_COLS_FULL;
        }
        gantt.render();
    } catch (e) {
        gantt.config.columns = ganttColsSidebarOculta ? GANTT_COLS_REDUZIDO : GANTT_COLS_FULL;
        gantt.config.grid_width = ganttColsSidebarOculta ? GANTT_GRID_WIDTH_MIN : GANTT_GRID_WIDTH_FULL;
        gantt.render();
    }
    var btn = document.getElementById('gantt-cols-toggle');
    if (btn) {
        btn.textContent = ganttColsSidebarOculta ? '▶' : '◀';
        btn.title = ganttColsSidebarOculta ? 'Mostrar coluna Tarefa' : 'Ocultar coluna para liberar espaço do calendário';
    }
}

/** Filtra o Gantt por etapa (sidebar). etapa '' = todas. */
function filtrarGanttPorEtapa(etapa) {
    ganttEtapaFiltro = etapa || '';
    document.querySelectorAll('.timeline-etapa-btn').forEach(function(b) {
        b.classList.toggle('ativa', (b.getAttribute('data-etapa') || '') === ganttEtapaFiltro);
    });
    if (typeof renderGantt === 'function') renderGantt();
}

/** Vista anual: DHTMLX Gantt (GPL) — recursos (coluna Responsável), milestones. Etapas na sidebar. */
function renderGantt() {
    var container = document.getElementById('timeline-container');
    if (!container) return;
    if (typeof gantt === 'undefined') {
        container.innerHTML = '<div class="gantt-placeholder" style="padding:2rem;text-align:center;color:var(--text-dim);">Diagrama Gantt não disponível. Verifique a ligação ao script (DHTMLX Gantt).</div>';
        atualizarCronogramaNav();
        return;
    }
    /* Filtro por etapa: inclui tarefas principais da etapa + suas subtarefas (subtarefas herdam da tarefa principal) */
    var tarefasParaGantt = ganttEtapaFiltro
        ? TAREFAS.filter(function(t) {
            var et = t.etapa || 'planejamento';
            if (et === ganttEtapaFiltro) return true;
            var pid = obterGantt(t.id).parentId;
            if (pid) {
                var p = TAREFAS.find(function(x) { return x.id === pid; });
                return p && ((p.etapa || 'planejamento') === ganttEtapaFiltro);
            }
            return false;
        })
        : TAREFAS.slice();
    /* Ordenar tarefas para que pais venham antes dos filhos (subtarefas). */
    var orderedTarefas = [];
    var remaining = tarefasParaGantt.slice();
    while (remaining.length > 0) {
        var next = remaining.filter(function(t) {
            var p = obterGantt(t.id).parentId;
            return !p || !tarefasParaGantt.some(function(x) { return x.id === p; }) || orderedTarefas.some(function(x) { return x.id === p; });
        });
        if (next.length === 0) break;
        orderedTarefas = orderedTarefas.concat(next);
        remaining = remaining.filter(function(t) { return next.indexOf(t) < 0; });
    }
    if (remaining.length > 0) orderedTarefas = orderedTarefas.concat(remaining);
    var tasksWithChildren = {};
    orderedTarefas.forEach(function(t) {
        var pid = obterGantt(t.id).parentId;
        if (pid) tasksWithChildren[pid] = true;
    });
    /* Para tarefas pai: intervalo que abrange a si e a todos os descendentes (barra “resumo”). */
    function getDescendantIds(taskId) {
        var out = [];
        TAREFAS.forEach(function(t) {
            if (obterGantt(t.id).parentId === taskId) {
                out.push(t.id);
                out = out.concat(getDescendantIds(t.id));
            }
        });
        return out;
    }
    function getTaskDateRange(taskId) {
        var t = TAREFAS.find(function(x) { return x.id === taskId; });
        if (!t) return { min: null, max: null };
        var inicio = t.inicio;
        var fim = t.fim || t.inicio;
        if (fim === inicio && !obterGantt(taskId).milestone) {
            var d = parseLocalDate(inicio);
            d.setDate(d.getDate() + 1);
            fim = formatLocalDate(d);
        }
        var min = inicio;
        var max = fim;
        getDescendantIds(taskId).forEach(function(id) {
            var r = getTaskDateRange(id);
            if (r.min && (!min || r.min < min)) min = r.min;
            if (r.max && (!max || r.max > max)) max = r.max;
        });
        return { min: min, max: max };
    }
    var realTasks = orderedTarefas.map(function(t) {
        var g = obterGantt(t.id);
        var status = g.status || 'nao-iniciada';
        var hasChildren = !!tasksWithChildren[t.id];
        var progress;
        if (hasChildren) {
            var subtasks = TAREFAS.filter(function(x) { return obterGantt(x.id).parentId === t.id; });
            var total = subtasks.length;
            var concluidas = subtasks.filter(function(x) { return (obterGantt(x.id).status || '') === 'concluida'; }).length;
            progress = total > 0 ? Math.round(100 * concluidas / total) : 0;
        } else {
            progress = status === 'concluida' ? 100 : (status === 'em-andamento' ? 50 : 0);
        }
        var isSub = !!(g.parentId && TAREFAS.some(function(x) { return x.id === g.parentId; }));
        var parentId = isSub ? g.parentId : null;
        var parentInSet = parentId && orderedTarefas.some(function(x) { return x.id === parentId; });
        var parent = parentInSet ? parentId : '';
        var isMilestone = !!g.milestone;
        var inicio, fim, duration;
        if (hasChildren) {
            var range = getTaskDateRange(t.id);
            inicio = range.min || t.inicio;
            fim = range.max || t.fim || t.inicio;
            if (fim === inicio) {
                var d = parseLocalDate(inicio);
                d.setDate(d.getDate() + 1);
                fim = formatLocalDate(d);
            }
            var start = parseLocalDate(inicio);
            var end = parseLocalDate(fim);
            duration = Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
        } else {
            inicio = t.inicio;
            fim = t.fim || t.inicio;
            if (fim === inicio && !isMilestone) {
                var d = parseLocalDate(inicio);
                d.setDate(d.getDate() + 1);
                fim = formatLocalDate(d);
            }
            var start = parseLocalDate(inicio);
            var end = parseLocalDate(fim);
            duration = isMilestone ? 1 : Math.max(1, Math.ceil((end - start) / (24 * 60 * 60 * 1000)));
        }
        var rowH = hasChildren ? 50 : (isSub ? 32 : 40);
        var barH = hasChildren ? 28 : (isSub ? 14 : 22);
        var taskType = hasChildren ? 'project' : (isMilestone ? 'milestone' : 'task');
        return {
            id: t.id,
            text: t.titulo || t.id,
            start_date: inicio,
            duration: duration,
            progress: progress / 100,
            parent: parent,
            responsavel: g.responsavel || '',
            milestone: isMilestone,
            type: taskType,
            row_height: rowH,
            bar_height: barH,
            $hasChildren: hasChildren,
            $isSub: isSub,
            $open: hasChildren,
            etapa: t.etapa || 'planejamento'
        };
    });
    var tasks = realTasks;
    var taskIds = {};
    realTasks.forEach(function(t) { taskIds[t.id] = true; });
    var linkIdGen = 1;
    var links = [];
    realTasks.forEach(function(t) {
        var preds = normalizarPredecessoras((obterGantt(t.id).predecessoras || []));
        preds.forEach(function(p) {
            if (taskIds[p.id] && taskIds[t.id]) {
                links.push({
                    id: 'link_' + (linkIdGen++),
                    source: p.id,
                    target: t.id,
                    type: dhtmlxLinkTypeFromTipo(p.tipo)
                });
            }
        });
    });

    if (!dhtmlxGanttInited) {
        gantt.plugins({ tooltip: false, keyboard_navigation: true });
        gantt.config.date_format = '%Y-%m-%d';
        gantt.config.autosize = true;
        gantt.config.fit_tasks = true;
        gantt.config.lightbox = {};
        gantt.config.row_height = 48;
        gantt.config.bar_height = 22;
        gantt.config.keyboard_navigation = true;
        gantt.config.horizontal_scroll_key = 'shiftKey';
        gantt.config.wheel_scroll_sensitivity = { x: 1.2, y: 1 };
        gantt.config.order_branch = true;
        gantt.config.order_branch_free = true;
        gantt.config.open_tree_initially = true;
        gantt.config.columns = GANTT_COLS_FULL;
        gantt.templates.task_class = function(start, end, task) {
            var c = task.milestone ? 'gantt-milestone' : '';
            var etapa = 'etapa-' + (task.etapa || 'planejamento');
            if (task.$hasChildren === true || (gantt.getChildren && gantt.getChildren(task.id).length > 0)) {
                c += ' gantt-task-band ' + etapa;
            } else if (task.$isSub === true || (task.parent && task.parent !== '')) {
                c += ' gantt-task-sub ' + etapa;
            } else {
                c += ' ' + etapa;
            }
            return c ? c.trim() : '';
        };
        gantt.templates.grid_row_class = function(start, end, task) {
            if (task && (task.$hasChildren === true || (gantt.getChildren && gantt.getChildren(task.id).length > 0))) return 'gantt_add_main';
            return '';
        };
        gantt.templates.scale_row_class = function(scale) {
            if (scale && scale.unit === 'month' && (scale.step === 1 || !scale.step)) return 'gantt-scale-vertical';
            return '';
        };
        gantt.templates.tooltip_text = function(start, end, task) {
            var startStr = gantt.templates.tooltip_date_format ? gantt.templates.tooltip_date_format(start) : (start ? start.toLocaleDateString('pt-BR') : '');
            var endStr = gantt.templates.tooltip_date_format ? gantt.templates.tooltip_date_format(end) : (end ? end.toLocaleDateString('pt-BR') : '');
            var html = '<b>' + (task.text || '') + '</b><br/>Início: ' + startStr + ' · Fim: ' + endStr;
            if (task.duration) html += '<br/>Duração: ' + task.duration + ' dia' + (task.duration !== 1 ? 's' : '');
            if (task.responsavel) html += '<br/>Responsável: ' + task.responsavel;
            if (task.progress != null) html += '<br/>Progresso: ' + Math.round(Number(task.progress) * 100) + '%';
            if (task.milestone) html += '<br/><em>Marco (milestone)</em>';
            return html;
        };
        /* Locale português para meses e datas */
        if (gantt.i18n && gantt.i18n.setLocale) {
            gantt.i18n.setLocale({
                date: {
                    month_full: ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'],
                    month_short: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
                    day_full: ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'],
                    day_short: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                }
            });
        }
        gantt.init('timeline-container');
        /* Zoom: ano → semestre → trimestre → mês → semana → 3 dias → dia. Mês sempre vertical+abreviado. */
        function ganttSemesterFormat(date) {
            var m = date.getMonth();
            var y = date.getFullYear();
            return (m < 6 ? '1º sem' : '2º sem') + ' ' + y;
        }
        function ganttTrimesterFormat(date) {
            var m = date.getMonth();
            var trim = Math.floor(m / 3) + 1;
            return trim + 'º trim ' + date.getFullYear();
        }
        function gantt3DaysFormat(date) {
            var d = date.getDate();
            var end = new Date(date);
            end.setDate(end.getDate() + 2);
            var mStr = gantt.date.date_to_str('%M')(date);
            return d + '–' + end.getDate() + ' ' + mStr;
        }
        function atualizarGanttScaleCramped() {
            var container = document.getElementById('timeline-container');
            var level = ganttZoomLevelCurrent || (gantt.ext && gantt.ext.zoom && gantt.ext.zoom.getLevel ? gantt.ext.zoom.getLevel() : '');
            if (!container) return;
            container.classList.toggle('gantt-scale-cramped', level === 'month');
        }
        window.GANTT_ZOOM_CONFIGS = {
            year: { scale_height: 44, min_column_width: 24, scales: [{ unit: 'year', step: 1, format: '%Y' }] },
            semester: { scale_height: 44, min_column_width: 48, scales: [{ unit: 'month', step: 6, format: ganttSemesterFormat }] },
            trimester: { scale_height: 44, min_column_width: 36, scales: [{ unit: 'month', step: 3, format: ganttTrimesterFormat }] }
        };
        if (gantt.ext && gantt.ext.zoom) {
            gantt.ext.zoom.init({ levels: Object.keys(GANTT_ZOOM_CONFIGS).map(function(n) {
                var c = GANTT_ZOOM_CONFIGS[n];
                return { name: n, scale_height: c.scale_height, min_column_width: c.min_column_width, scales: c.scales };
            }) });
        }
        ganttZoomLevelCurrent = 'year';
        atualizarGanttScaleCramped();
        window._atualizarGanttScaleCramped = atualizarGanttScaleCramped;
        gantt.attachEvent('onTaskClick', function(id) {
            if (String(id).indexOf('grupo_') === 0) return true;
            var task = gantt.getTask(id);
            var isPrincipal = !task || !(task.$isSub === true || (task.parent && task.parent !== ''));
            if (isPrincipal) atualizarTimelineTaskDetail(id);
            else atualizarTimelineTaskDetail(null);
            return true;
        });
        gantt.attachEvent('onTaskDblClick', function(id) {
            if (String(id).indexOf('grupo_') === 0) return true;
            abrirModalRelatorio(id);
            return true;
        });
        gantt.attachEvent('onAfterTaskUpdate', function(id, task) {
            if (String(id).indexOf('grupo_') === 0) return;
            syncTaskFromDhtmlxToModel(id, task);
        });
        gantt.attachEvent('onAfterTaskDrag', function(id, mode, e) {
            if (String(id).indexOf('grupo_') === 0) return;
            var task = gantt.getTask(id);
            if (task) syncTaskFromDhtmlxToModel(id, task);
        });
        gantt.attachEvent('onBeforeTaskDelete', function(id) {
            if (String(id).indexOf('grupo_') === 0) return false;
            return true;
        });
        gantt.attachEvent('onAfterLinkAdd', function(id, item) {
            syncLinkToModel(item);
        });
        var linkBeforeDelete = null;
        gantt.attachEvent('onBeforeLinkDelete', function(id) {
            linkBeforeDelete = gantt.getLink(id);
            return true;
        });
        gantt.attachEvent('onAfterLinkDelete', function(id) {
            if (linkBeforeDelete) {
                removePredecessoraFromModel(linkBeforeDelete.target, linkBeforeDelete.source);
                linkBeforeDelete = null;
            }
        });
        gantt.attachEvent('onGridHeaderClick', function(name, e) {
            if (name === 'add') {
                abrirModalAdicionarTarefa(formatLocalDate(new Date()));
                return false;
            }
            return true;
        });
        gantt.attachEvent('onBeforeTaskAdd', function(id, task) {
            var parentId = (task && task.parent) ? task.parent : undefined;
            abrirModalAdicionarTarefa(null, null, null, parentId);
            return false;
        });
        dhtmlxGanttInited = true;
    }
    gantt.clearAll();
    gantt.parse({ data: tasks, links: links });
    aplicarGanttDateRange();
    if (ganttColsSidebarOculta) {
        gantt.config.grid_width = GANTT_GRID_WIDTH_MIN;
        if (typeof gantt.hideColumn === 'function') {
            ['text', 'add'].forEach(function(n) { gantt.hideColumn(n); });
        } else {
            gantt.config.columns = GANTT_COLS_REDUZIDO;
        }
        gantt.render();
    }
    atualizarCronogramaNav();
    if (typeof atualizarGanttZoomHint === 'function') setTimeout(atualizarGanttZoomHint, 50);
    if (typeof window._atualizarGanttScaleCramped === 'function') setTimeout(window._atualizarGanttScaleCramped, 80);
}

var GANTT_ZOOM_ORDER = ['year', 'semester', 'trimester'];
var ganttZoomLevelCurrent = 'year';
var ganttViewPeriodIndex = 0; /* 0 = primeiro período; Espaço+arrastar navega entre períodos */
/** Retorna { start, end } para o zoom atual. ganttViewPeriodIndex define qual período mostrar. */
function getGanttDateRangeForZoom(level, year) {
    var y = year || anualAtual;
    var idx = ganttViewPeriodIndex || 0;
    switch (level) {
        case 'year':
            return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
        case 'semester':
            var semStart = idx === 0 ? 0 : 6;
            /* fim do último dia do semestre (evita incluir o 2º sem) */
            var semEnd = idx === 0 ? new Date(y, 5, 30, 23, 59, 59, 999) : new Date(y, 11, 31, 23, 59, 59, 999);
            return { start: new Date(y, semStart, 1), end: semEnd };
        case 'trimester':
            var triStart = Math.min(3, idx) * 3;
            var lastDay = triStart < 9 ? new Date(y, triStart + 2, 0) : new Date(y, 11, 31);
            var triEnd = new Date(lastDay.getFullYear(), lastDay.getMonth(), lastDay.getDate(), 23, 59, 59, 999);
            return { start: new Date(y, triStart, 1), end: triEnd };
        default:
            return { start: new Date(y, 0, 1), end: new Date(y, 11, 31) };
    }
}

/** Aplica o intervalo de datas e escala ao Gantt conforme zoom atual. */
function aplicarGanttDateRange() {
    if (typeof gantt === 'undefined') return;
    var level = ganttZoomLevelCurrent || 'year';
    var configs = window.GANTT_ZOOM_CONFIGS;
    if (configs && configs[level]) {
        var c = configs[level];
        gantt.config.scale_height = c.scale_height;
        gantt.config.min_column_width = c.min_column_width;
        gantt.config.scales = c.scales;
    }
    var r = getGanttDateRangeForZoom(level, anualAtual);
    gantt.config.fit_tasks = false;
    gantt.config.start_date = r.start;
    gantt.config.end_date = r.end;
    gantt.render();
}

/** Define o nível de zoom do Gantt. Aplica escala e datas manualmente para controlar o intervalo. */
function setGanttZoomLevel(level) {
    if (typeof gantt === 'undefined') return;
    if (!window.GANTT_ZOOM_CONFIGS || !window.GANTT_ZOOM_CONFIGS[level]) return;
    ganttZoomLevelCurrent = level;
    ganttViewPeriodIndex = 0;
    aplicarGanttDateRange();
    document.querySelectorAll('.gantt-zoom-btn[data-level]').forEach(function(b) {
        b.classList.toggle('ativa', b.getAttribute('data-level') === level);
        b.setAttribute('aria-pressed', b.getAttribute('data-level') === level ? 'true' : 'false');
    });
    atualizarGanttZoomHint();
    if (typeof window._atualizarGanttScaleCramped === 'function') setTimeout(window._atualizarGanttScaleCramped, 0);
}
/** Navega para o período anterior (ex.: 2º sem → 1º sem). */
function ganttNavPeriodoAnterior() {
    var level = ganttZoomLevelCurrent || 'year';
    if (level === 'year') { anualAtual--; dataAtiva = anualAtual + '-07-01'; renderGantt(); return; }
    var maxIdx = { semester: 1, trimester: 3 }[level] || 0;
    ganttViewPeriodIndex--;
    if (ganttViewPeriodIndex < 0) { anualAtual--; ganttViewPeriodIndex = maxIdx; renderGantt(); }
    else { aplicarGanttDateRange(); atualizarGanttZoomHint(); }
}
/** Navega para o período seguinte (ex.: 1º sem → 2º sem). */
function ganttNavPeriodoProximo() {
    var level = ganttZoomLevelCurrent || 'year';
    if (level === 'year') { anualAtual++; dataAtiva = anualAtual + '-07-01'; renderGantt(); return; }
    var maxIdx = { semester: 1, trimester: 3 }[level] || 0;
    ganttViewPeriodIndex++;
    if (ganttViewPeriodIndex > maxIdx) { anualAtual++; ganttViewPeriodIndex = 0; renderGantt(); }
    else { aplicarGanttDateRange(); atualizarGanttZoomHint(); }
}

/** Zoom in/out (delta: 1 = in, -1 = out). */
function ganttZoomDelta(delta) {
    if (typeof gantt === 'undefined' || !gantt.ext || !gantt.ext.zoom) return;
    var idx = GANTT_ZOOM_ORDER.indexOf(ganttZoomLevelCurrent || (gantt.ext.zoom.getLevel ? gantt.ext.zoom.getLevel() : 'year'));
    if (idx < 0) idx = 0;
    idx = Math.max(0, Math.min(GANTT_ZOOM_ORDER.length - 1, idx + delta));
    setGanttZoomLevel(GANTT_ZOOM_ORDER[idx]);
}
/** Ajusta a vista para mostrar todas as tarefas na tela. */
function ganttAjustarTudo() {
    if (typeof gantt === 'undefined') return;
    setGanttZoomLevel('year');
    var tasks = (gantt.serialize ? gantt.serialize().data : []).filter(function(t) { return String(t.id || '').indexOf('grupo_') !== 0; });
    var first = tasks.length ? tasks.reduce(function(a, b) {
        var da = a.start_date ? new Date(a.start_date).getTime() : 0;
        var db = b.start_date ? new Date(b.start_date).getTime() : 0;
        return da <= db ? a : b;
    }) : null;
    if (first && first.id && typeof gantt.showTask === 'function') gantt.showTask(first.id);
    else if (gantt.getScrollState) {
        var s = gantt.getScrollState();
        if (s && s.width > s.inner_width) gantt.scrollTo(0, null);
    }
    atualizarGanttZoomHint();
}
/** Atualiza o painel de detalhes da tarefa selecionada na sidebar direita. */
function atualizarTimelineTaskDetail(taskId) {
    var el = document.getElementById('timeline-task-detail');
    if (!el) return;
    if (!taskId || String(taskId).indexOf('grupo_') === 0) {
        el.innerHTML = '<p class="timeline-task-detail-empty">Clique numa tarefa para ver detalhes</p>';
        return;
    }
    var task = typeof gantt !== 'undefined' && gantt.getTask ? gantt.getTask(taskId) : null;
    if (!task) {
        el.innerHTML = '<p class="timeline-task-detail-empty">Tarefa não encontrada</p>';
        return;
    }
    var t = TAREFAS.find(function(x) { return x.id === taskId; });
    var g = obterGantt(taskId);
    var inicioStr = task.start_date ? (task.start_date instanceof Date ? formatLocalDate(task.start_date) : String(task.start_date).slice(0, 10)) : '—';
    var dur = task.duration != null ? task.duration + ' dia' + (task.duration !== 1 ? 's' : '') : '—';
    var resp = task.responsavel || g.responsavel || '—';
    var status = STATUS_LABELS[g.status || 'nao-iniciada'] || '—';
    var etapa = ETAPA_LABELS[(t && t.etapa) || 'planejamento'] || '—';
    el.innerHTML = '<div class="task-detail-nome">' + (task.text || '') + '</div>' +
        '<div class="task-detail-meta">Início: ' + inicioStr + '</div>' +
        '<div class="task-detail-meta">Duração: ' + dur + '</div>' +
        '<div class="task-detail-meta">Responsável: ' + resp + '</div>' +
        '<div class="task-detail-meta">Status: ' + status + '</div>' +
        '<div class="task-detail-meta">Etapa: ' + etapa + '</div>';
}

/** Atualiza o indicador de vista atual (ex: "2026-01 – 2026-12"). */
function atualizarGanttZoomHint() {
    var el = document.getElementById('gantt-zoom-hint');
    if (!el || typeof gantt === 'undefined') return;
    try {
        var start = gantt.config && gantt.config.start_date;
        var end = gantt.config && gantt.config.end_date;
        if (start && end) {
            var fmt = function(d) {
                if (!d) return '';
                var x = d instanceof Date ? d : new Date(d);
                return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0');
            };
            el.textContent = fmt(start) + ' – ' + fmt(end);
        } else {
            var level = ganttZoomLevelCurrent || 'year';
            var labels = { year: 'Ano', semester: 'Semestre', trimester: 'Trimestre' };
            el.textContent = labels[level] || level;
        }
    } catch (e) { el.textContent = ''; }
}

function syncTaskFromDhtmlxToModel(id, task) {
    var t = TAREFAS.find(function(x) { return x.id === id; });
    if (!t) return;
    var g = obterGantt(id);
    if (task.start_date) {
        var startStr = task.start_date instanceof Date ? formatLocalDate(task.start_date) : (typeof task.start_date === 'string' ? task.start_date.slice(0, 10) : null);
        if (startStr) {
            var duration = (task.duration || 0);
            var fimStr = duration <= 0 ? startStr : formatLocalDate((function() { var d = parseLocalDate(startStr); d.setDate(d.getDate() + duration); return d; })());
            t.inicio = startStr;
            t.fim = fimStr;
            mostrarNotaResize('Datas atualizadas', formatarDatasNota(t.inicio, t.fim));
            esconderNotaResizeApos(1800);
        }
    }
    if (task.parent !== undefined) {
        var isGrupo = String(task.parent).indexOf('grupo_') === 0;
        g.parentId = (!isGrupo && task.parent && TAREFAS.some(function(x) { return x.id === task.parent; })) ? task.parent : null;
    }
    salvar();
}

function syncLinkToModel(item) {
    if (!item || !item.target) return;
    var g = obterGantt(item.target);
    var tipo = dhtmlxTipoFromLinkType(typeof item.type === 'number' ? item.type : parseInt(item.type, 10));
    var exists = (g.predecessoras || []).some(function(p) { return (p.id || p) === item.source; });
    if (!exists) {
        g.predecessoras = g.predecessoras || [];
        g.predecessoras.push({ id: item.source, tipo: tipo });
        salvar();
    }
}

function removePredecessoraFromModel(taskId, predId) {
    var g = obterGantt(taskId);
    if (!g.predecessoras) return;
    g.predecessoras = g.predecessoras.filter(function(p) { return (p.id || p) !== predId; });
    salvar();
}
function onTimelineClick(e) {
    if (e.target.closest('.vis-item')) return;
    definirDataAtiva(dataFromTimelinePosition(e.clientX));
}
function onTimelineDblClick(e) {
    if (e.target.closest('.vis-item')) return; /* duplo-clique em item: doubleClick já abre o modal */
    irParaAgendaDiaria(dataFromTimelinePosition(e.clientX));
}

// Seed inicial e carregar
try { localStorage.removeItem('febre-arte-2026'); } catch (e) {}
carregar();
if (TAREFAS.length === 0) {
    adicionarAoCronograma('def-tema');
    adicionarAoCronograma('reservar-local', '2026-01-13');
    adicionarAoCronograma('identidade-visual', '2026-02-03');
    adicionarAoCronograma('convidar-palestrantes', '2026-02-15');
    adicionarAoCronograma('divulgar-palestrantes', '2026-02-10');
    adicionarAoCronograma('execucao-evento', '2026-11-10');
}
renderListaEtapas();
renderMiniCalendario();
atualizarFiltroResponsavel();
document.addEventListener('dragend', function() { semanaClearDropOver(); semanaMultidiaDragPreviewClear(); if (window._semanaDragImageEl && window._semanaDragImageEl.parentNode) { window._semanaDragImageEl.parentNode.removeChild(window._semanaDragImageEl); } window._semanaDragImageEl = null; });
document.addEventListener('dragover', function semanaDocumentDragover(ev) {
    if (!window._semanaDragTaskId) return;
    ev.preventDefault();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
}, true);
document.addEventListener('drop', function semanaDocumentDrop(ev) {
    if (!ev.dataTransfer || !ev.dataTransfer.types || !ev.dataTransfer.types.includes('text/plain') || !window._semanaDragTaskId) return;
    var container = ev.target && ev.target.closest && ev.target.closest('#semana-grid, #semana-grid-agenda');
    if (!container) {
        var els = document.elementsFromPoint(ev.clientX, ev.clientY);
        var under = els.find(function(el) { return el.id === 'semana-grid' || el.id === 'semana-grid-agenda' || (el.closest && (el.closest('#semana-grid') || el.closest('#semana-grid-agenda'))); });
        if (under) container = under.id ? document.getElementById(under.id) : under.closest('#semana-grid, #semana-grid-agenda');
    }
    if (!container) return;
    ev.preventDefault();
    ev.stopPropagation();
    semanaClearDropOver();
    var els = document.elementsFromPoint(ev.clientX, ev.clientY);
    var cell = els.find(function(el) { return el.classList && el.classList.contains('semana-cell-drop'); });
    if (cell && cell.dataset.date && cell.dataset.turno) {
        semanaTarefaDrop(ev, cell.dataset.date, cell.dataset.turno);
    } else {
        semanaDropFromCoords(ev, container);
    }
}, true);
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') esconderNotaResize(); });
