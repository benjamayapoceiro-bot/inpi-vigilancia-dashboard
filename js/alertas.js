/**
 * ═══════════════════════════════════════════════════════════
 *  Alertas View — Enhanced alerts with score bars and filters
 * ═══════════════════════════════════════════════════════════
 */

const Alertas = (() => {
    let cache = [];
    let searchQuery = '';

    async function load() {
        const tbody = document.getElementById('tbody-alertas');
        if (tbody) tbody.innerHTML = UI.skeletonRows(5, 7);

        try {
            cache = await API.getAlertas();
            if (!Array.isArray(cache)) cache = [];
        } catch (err) {
            cache = [];
            UI.toast('Error cargando alertas', 'error');
        }
        render();
        return cache;
    }

    function render() {
        const tipo = document.getElementById('filtro-tipo')?.value || '';
        const rev = document.getElementById('filtro-revisada')?.value || '';
        const search = searchQuery.toLowerCase();

        let filtered = cache;
        if (tipo) filtered = filtered.filter(a => a.tipo_match === tipo);
        if (rev === 'si') filtered = filtered.filter(a => a.revisada);
        if (rev === 'no') filtered = filtered.filter(a => !a.revisada);
        if (search) {
            filtered = filtered.filter(a =>
                (a.denominacion_nueva || '').toLowerCase().includes(search) ||
                (a.titular_nuevo || []).some(t => (t.nombre || '').toLowerCase().includes(search))
            );
        }

        const tbody = document.getElementById('tbody-alertas');
        const empty = document.getElementById('empty-alertas');
        const count = document.getElementById('alertas-count');

        if (count) count.textContent = `${filtered.length} alerta${filtered.length !== 1 ? 's' : ''}`;

        if (!filtered.length) {
            if (tbody) tbody.innerHTML = '';
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        if (tbody) {
            tbody.innerHTML = filtered.map(a => {
                const pct = Math.round((a.similitud_score || 0) * 100);
                const colorClass = UI.scoreColor(a.similitud_score || 0);
                const badgeClass = UI.scoreBadgeClass(a.similitud_score || 0);
                const titulares = (a.titular_nuevo || []).map(t => UI.escapeHtml(t.nombre)).join(', ') || '—';
                const isLogo = a.tipo_match === 'logo';
                const hasDraft = !!a.borrador_oposicion;
                const reviewed = a.revisada ? 'checked' : '';

                return `
          <tr class="${a.revisada ? 'row-reviewed' : ''}">
            <td>
              <div class="score-bar">
                <div class="score-bar__track">
                  <div class="score-bar__fill score-bar__fill--${colorClass}" style="width: ${pct}%"></div>
                </div>
                <span class="score-bar__value" style="color: var(--${colorClass})">${pct}%</span>
              </div>
            </td>
            <td>
              <div class="marca-name">${UI.escapeHtml(a.denominacion_nueva) || '(marca mixta)'}</div>
              ${isLogo ? '<span class="badge badge--info" style="margin-top:4px">Logo</span>' : ''}
            </td>
            <td><span class="badge badge--primary">${a.clase || '—'}</span></td>
            <td style="color: var(--text-secondary); font-size: 0.8125rem;">${titulares}</td>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary);">${a.boletin_numero || '—'}</td>
            <td>
              <a class="data-table acta-link" target="_blank"
                 href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${a.acta_nueva}">
                ${a.acta_nueva || '—'}
              </a>
            </td>
            <td>
              <div style="display: flex; gap: var(--space-sm); align-items: center;">
                ${hasDraft ? `<button class="btn btn--ghost btn--sm" onclick="Alertas.toggleDraft('${a.id}')" title="Ver borrador">📄</button>` : ''}
                <label class="review-toggle" title="Marcar como revisada">
                  <input type="checkbox" ${reviewed} onchange="Alertas.toggleRevisada('${a.id}', this.checked)">
                  <span class="review-toggle__check">✓</span>
                </label>
              </div>
            </td>
          </tr>
          ${hasDraft ? `
          <tr class="draft-row" id="draft-row-${a.id}" style="display: none;">
            <td colspan="7">
              <div class="draft-panel show">${UI.escapeHtml(a.borrador_oposicion)}</div>
            </td>
          </tr>
          ` : ''}
        `;
            }).join('');
        }
    }

    async function toggleRevisada(id, checked) {
        try {
            await API.markRevisada(id, checked);
            const item = cache.find(a => a.id === id);
            if (item) item.revisada = checked;
            UI.toast(checked ? 'Marcada como revisada' : 'Desmarcada', 'success');
            render();
        } catch (err) {
            UI.toast('Error actualizando', 'error');
        }
    }

    function toggleDraft(id) {
        const row = document.getElementById(`draft-row-${id}`);
        if (row) {
            row.style.display = row.style.display === 'none' ? 'table-row' : 'none';
        }
    }

    function setSearch(query) {
        searchQuery = query;
        render();
    }

    function getCache() { return cache; }

    return { load, render, toggleRevisada, toggleDraft, setSearch, getCache };
})();
