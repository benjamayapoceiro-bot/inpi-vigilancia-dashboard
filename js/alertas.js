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

    const RIESGO_SEAL = { alto: 'danger', medio: 'warning', bajo: 'success' };

    if (tbody) {
      tbody.innerHTML = filtered.map(a => {
        const pct = Math.round((a.similitud_score || 0) * 100);
        const colorClass = UI.scoreColor(a.similitud_score || 0);
        const badgeClass = UI.scoreBadgeClass(a.similitud_score || 0);
        const titulares = (a.titular_nuevo || []).map(t => UI.escapeHtml(t.nombre)).join(', ') || '—';
        const isLogo = a.tipo_match === 'logo';
        const isOposicion = a.tipo_match === 'oposicion_recibida';
        const hasDraft = !!a.borrador_oposicion;
        const reviewed = a.revisada ? 'checked' : '';
        const opPresentada = a.oposicion_presentada ? 'checked' : '';
        const necesitaOposicion = a.requiere_oposicion || hasDraft;
        const enlace = a.enlace_inpi || `inpi-grilla.html?acta=${a.acta_nueva}`;

        return `
          <tr class="${a.revisada ? 'row-reviewed' : ''}">
            <td>
              <div class="score-bar">
                <div class="score-bar__track">
                  <div class="score-bar__fill score-bar__fill--${colorClass}" style="width: ${pct}%"></div>
                </div>
                <span class="score-bar__value" style="color: var(--${colorClass})">${pct}%</span>
              </div>
              ${a.nivel_riesgo ? `<span class="seal seal--${RIESGO_SEAL[a.nivel_riesgo] || 'neutral'}" style="margin-top:4px;"><span class="seal__ring"></span>Riesgo ${a.nivel_riesgo}</span>` : ''}
            </td>
            <td>
              <div class="marca-name">${UI.escapeHtml(a.denominacion_nueva) || '(marca mixta)'}</div>
              ${isLogo ? '<span class="badge badge--info" style="margin-top:4px">Logo</span>' : ''}
              ${isOposicion ? '<div style="margin-top:4px"><span class="badge badge--danger" style="background-color: var(--danger); color: white; padding: 4px 8px; font-weight: bold;">🚨 OPOSICIÓN RECIBIDA</span></div>' : ''}
              ${necesitaOposicion && a.fecha_limite_oposicion ? `<div style="margin-top:4px;">${UI.expiryBadge(a.fecha_limite_oposicion)} <span style="font-size:0.6875rem; color:var(--text-tertiary);">límite oposición</span></div>` : ''}
              ${opPresentada ? `<div style="margin-top:4px;"><span class="badge badge--success">✓ Oposición presentada</span></div>` : ''}
              ${a.marcas_vigiladas ? `
                <div style="margin-top:8px; font-size:0.75rem; color:var(--text-secondary); background: rgba(0,0,0,0.02); padding: 4px; border-radius: 4px;">
                  ⚠️ Conflicto con nuestra marca:<br>
                  <strong>${UI.escapeHtml(a.marcas_vigiladas.nombre)}</strong>
                  ${a.marcas_vigiladas.numero_acta ? `<br><button class="btn btn--ghost btn--sm" style="font-size:0.7rem; padding:2px 6px;" onclick="Detalle.abrir('${a.marcas_vigiladas.numero_acta}')">Ver Acta ${UI.escapeHtml(a.marcas_vigiladas.numero_acta)} 👁️</button> <a href="inpi-grilla.html?acta=${encodeURIComponent(a.marcas_vigiladas.numero_acta)}" target="_blank" style="font-size:0.7rem; text-decoration:underline;">INPI ↗</a>` : ''}
                </div>
              ` : ''}
            </td>
            <td><span class="badge badge--primary">${a.clase || '—'}</span>${a.clase_acta && a.clase_acta !== a.clase ? `<div style="font-size:0.7rem; color:var(--text-tertiary);">acta cl.${a.clase_acta}</div><span class="badge ${a.relacion_clases==='afin'?'badge--warning':'badge--info'}" style="font-size:0.65rem; margin-top:2px;">${a.relacion_clases==='afin'?'Clase afín':'Clase distinta'}</span>` : ''}${a.relacion_clases==='misma' ? `<div style="font-size:0.65rem; color:var(--danger); font-weight:600;">Misma clase</div>` : ''}</td>
            <td style="color: var(--text-secondary); font-size: 0.8125rem;">${titulares}</td>
            <td style="font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-tertiary);">${a.boletin_numero || '—'}</td>
            <td>
              ${a.acta_nueva ? `
              <button class="btn btn--sm btn--primary" onclick="Detalle.abrir('${a.acta_nueva}')" style="padding:4px 8px;">
                Ver detalle 👁️
              </button>
              <div style="margin-top:4px; font-size:0.75rem; color:var(--text-tertiary); text-align:center;">Acta ${a.acta_nueva} · <a href="${enlace}" target="_blank" style="text-decoration:underline;">INPI ↗</a></div>
              ` : '—'}
            </td>
            <td>
              <div style="display: flex; gap: var(--space-sm); align-items: center; flex-wrap: wrap;">
                ${hasDraft ? `<button class="btn btn--ghost btn--sm" onclick="Alertas.toggleDraft('${a.id}')" title="Ver borrador">📄</button>` : ''}
                <label class="review-toggle" title="Marcar como revisada">
                  <input type="checkbox" ${reviewed} onchange="Alertas.toggleRevisada('${a.id}', this.checked)">
                  <span class="review-toggle__check">✓</span>
                </label>
                ${necesitaOposicion ? `
                <label class="review-toggle" title="Marcar oposición como presentada">
                  <input type="checkbox" ${opPresentada} onchange="Alertas.toggleOposicionPresentada('${a.id}', this.checked)">
                  <span class="review-toggle__check">📨</span>
                </label>
                ` : ''}
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

  async function toggleOposicionPresentada(id, checked) {
    try {
      await API.updateAlerta(id, {
        oposicion_presentada: checked,
        oposicion_presentada_fecha: checked ? new Date().toISOString().slice(0, 10) : null
      });
      const item = cache.find(a => a.id === id);
      if (item) {
        item.oposicion_presentada = checked;
        item.oposicion_presentada_fecha = checked ? new Date().toISOString().slice(0, 10) : null;
      }
      UI.toast(checked ? 'Oposición marcada como presentada' : 'Desmarcada', 'success');
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

  return { load, render, toggleRevisada, toggleOposicionPresentada, toggleDraft, setSearch, getCache };
})();
