/**
 * ═══════════════════════════════════════════════════════════
 *  CRM — Vista completa de expedientes: kanban por estado,
 *  agrupación por cliente y ficha con historial de novedades.
 * ═══════════════════════════════════════════════════════════
 */

const CRM = (() => {
    let cache = [];
    let filtroCliente = '';
    let vista = 'kanban'; // 'kanban' | 'clientes'

    const ESTADOS = ['Solicitada', 'En trámite', 'Registrada', 'En oposición', 'En litigio', 'Vencida', 'Denegada'];

    const ESTADO_SEAL = {
        'Solicitada': 'info', 'En trámite': 'info', 'Registrada': 'success',
        'En oposición': 'warning', 'En litigio': 'danger', 'Vencida': 'danger', 'Denegada': 'danger',
    };

    async function load() {
        const cont = document.getElementById('crm-board');
        if (cont) cont.innerHTML = UI.skeletonCards(4);
        try {
            cache = await API.getMarcas();
            if (!Array.isArray(cache)) cache = [];
        } catch (err) {
            cache = [];
            UI.toast('Error cargando el CRM', 'error');
        }
        render();
    }

    function render() {
        renderFiltroCliente();
        if (vista === 'kanban') renderKanban();
        else renderClientes();
    }

    function renderFiltroCliente() {
        const sel = document.getElementById('crm-filtro-cliente');
        if (!sel) return;
        const clientes = [...new Set(cache.map(m => m.cliente).filter(Boolean))].sort();
        const actual = sel.value;
        sel.innerHTML = `<option value="">Todos los clientes</option>` +
            clientes.map(c => `<option value="${UI.escapeHtml(c)}">${UI.escapeHtml(c)}</option>`).join('');
        sel.value = clientes.includes(actual) ? actual : '';
        filtroCliente = sel.value;
    }

    function filtradas() {
        return filtroCliente ? cache.filter(m => m.cliente === filtroCliente) : cache;
    }

    function renderKanban() {
        const cont = document.getElementById('crm-board');
        if (!cont) return;
        const lista = filtradas();

        if (lista.length === 0) {
            cont.innerHTML = `<div class="empty-state"><div class="empty-state__icon">⚖️</div>
        <div class="empty-state__title">Sin expedientes para mostrar</div>
        <div class="empty-state__desc">Cargá marcas en "Mi Cartera" o quitá el filtro de cliente.</div></div>`;
            return;
        }

        cont.innerHTML = `<div class="kanban">${ESTADOS.map(estado => {
            const items = lista.filter(m => (m.estado || 'Solicitada') === estado);
            return `
        <div class="kanban__column">
          <div class="kanban__column-header">
            <span>${estado}</span>
            <span class="kanban__column-count">${items.length}</span>
          </div>
          <div class="kanban__column-body">
            ${items.length === 0
                    ? `<div class="kanban__empty">—</div>`
                    : items.map(m => `
                <div class="kanban__card" onclick="CRM.abrirFicha('${m.id}')">
                  <div class="kanban__card-name">${UI.escapeHtml(m.nombre) || '(logo sin texto)'}</div>
                  <div class="kanban__card-meta">
                    <span class="mono">Clase ${m.clase}</span>
                    ${m.cliente ? `<span>· ${UI.escapeHtml(m.cliente)}</span>` : ''}
                  </div>
                  ${m.fecha_vencimiento ? `<div style="margin-top:4px;">${UI.expiryBadge(m.fecha_vencimiento)}</div>` : ''}
                </div>
              `).join('')
                }
          </div>
        </div>
      `;
        }).join('')}</div>`;
    }

    function renderClientes() {
        const cont = document.getElementById('crm-board');
        if (!cont) return;
        const lista = filtradas();

        if (lista.length === 0) {
            cont.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🗂️</div>
        <div class="empty-state__title">Sin expedientes para mostrar</div></div>`;
            return;
        }

        const porCliente = {};
        lista.forEach(m => {
            const c = m.cliente || '(sin cliente asignado)';
            (porCliente[c] = porCliente[c] || []).push(m);
        });

        const clientesOrdenados = Object.keys(porCliente).sort();

        cont.innerHTML = clientesOrdenados.map(cliente => {
            const marcas = porCliente[cliente];
            return `
        <div class="card" style="margin-bottom: var(--space-md);">
          <div class="section-header" style="margin-bottom: var(--space-sm);">
            <h3 style="font-size: 0.9375rem;">${UI.escapeHtml(cliente)}</h3>
            <span class="badge badge--primary">${marcas.length} marca${marcas.length !== 1 ? 's' : ''}</span>
          </div>
          <table class="data-table">
            <tbody>
              ${marcas.map(m => `
                <tr style="cursor:pointer;" onclick="CRM.abrirFicha('${m.id}')">
                  <td class="marca-name">${UI.escapeHtml(m.nombre) || '(logo sin texto)'}</td>
                  <td><span class="mono">Clase ${m.clase}</span></td>
                  <td>${sello(m.estado)}</td>
                  <td>${UI.expiryBadge(m.fecha_vencimiento)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      `;
        }).join('');
    }

    function sello(estado) {
        const e = estado || 'Solicitada';
        const tipo = ESTADO_SEAL[e] || 'neutral';
        return `<span class="seal seal--${tipo}"><span class="seal__ring"></span>${e}</span>`;
    }

    function cambiarVista(v) {
        vista = v;
        document.querySelectorAll('[data-crm-vista]').forEach(b => {
            b.classList.toggle('btn--primary', b.dataset.crmVista === v);
            b.classList.toggle('btn--secondary', b.dataset.crmVista !== v);
        });
        render();
    }

    function abrirFicha(id) {
        const m = cache.find(x => x.id === id);
        if (!m) return;

        const historial = Array.isArray(m.historial) ? [...m.historial].reverse() : [];

        const body = `
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px,1fr)); gap: var(--space-md); margin-bottom: var(--space-lg);">
        <div><div class="form-label">Cliente</div><div style="font-size:0.875rem;">${UI.escapeHtml(m.cliente) || '—'}</div></div>
        <div><div class="form-label">Clase</div><div class="mono" style="font-size:0.875rem;">${m.clase}</div></div>
        <div><div class="form-label">Tipo</div><div style="font-size:0.875rem;">${m.tipo === 'M' ? 'Mixta' : 'Denominativa'}</div></div>
        <div><div class="form-label">N° Acta</div><div class="mono" style="font-size:0.875rem;">${UI.escapeHtml(m.numero_acta) || '—'}</div></div>
        <div><div class="form-label">Vencimiento</div><div style="font-size:0.875rem;">${UI.formatDate(m.fecha_vencimiento)}</div></div>
        <div>
          <div class="form-label">Estado</div>
          <select class="form-select" id="ficha-estado" style="margin-top:2px;">
            ${ESTADOS.map(e => `<option value="${e}" ${e === (m.estado || 'Solicitada') ? 'selected' : ''}>${e}</option>`).join('')}
          </select>
        </div>
      </div>

      ${m.notas ? `<div style="margin-bottom: var(--space-lg);"><div class="form-label">Notas generales</div><div style="font-size:0.8125rem; margin-top:4px; color:var(--text-primary);">${UI.escapeHtml(m.notas)}</div></div>` : ''}

      <div class="form-label" style="margin-bottom: var(--space-xs);">Historial de novedades</div>
      <div class="timeline" id="ficha-timeline">
        ${historial.length === 0
                ? `<div class="timeline__empty">Sin novedades cargadas todavía.</div>`
                : historial.map(h => `
              <div class="timeline__item">
                <div class="timeline__dot"></div>
                <div class="timeline__content">
                  <div class="timeline__date">${UI.formatDate(h.fecha)}</div>
                  <div class="timeline__text">${UI.escapeHtml(h.texto)}</div>
                </div>
              </div>
            `).join('')
            }
      </div>

      <div style="display:flex; gap: var(--space-sm); margin-top: var(--space-md);">
        <input type="text" class="form-input" id="ficha-nueva-nota" placeholder="Agregar novedad (ej. avance del litigio, gestión realizada)...">
        <button class="btn btn--secondary" id="ficha-add-nota" type="button">＋ Agregar</button>
      </div>

      <div class="modal__actions">
        <button class="btn btn--secondary" data-action="close">Cerrar</button>
        <button class="btn btn--primary" id="ficha-guardar">💾 Guardar cambios</button>
      </div>
    `;

        const overlay = UI.modal(UI.escapeHtml(m.nombre) || '(logo sin texto)', body, { wide: true });

        overlay.querySelector('#ficha-add-nota').addEventListener('click', () => {
            const input = overlay.querySelector('#ficha-nueva-nota');
            const texto = input.value.trim();
            if (!texto) return;
            const nuevaEntrada = { fecha: new Date().toISOString().slice(0, 10), texto };
            const historialActual = Array.isArray(m.historial) ? m.historial : [];
            m.historial = [...historialActual, nuevaEntrada];
            input.value = '';

            const timelineEl = overlay.querySelector('#ficha-timeline');
            const reversed = [...m.historial].reverse();
            timelineEl.innerHTML = reversed.map(h => `
        <div class="timeline__item">
          <div class="timeline__dot"></div>
          <div class="timeline__content">
            <div class="timeline__date">${UI.formatDate(h.fecha)}</div>
            <div class="timeline__text">${UI.escapeHtml(h.texto)}</div>
          </div>
        </div>
      `).join('');
        });

        overlay.querySelector('#ficha-guardar').addEventListener('click', async () => {
            const nuevoEstado = overlay.querySelector('#ficha-estado').value;
            try {
                await API.updateMarca(m.id, { estado: nuevoEstado, historial: m.historial || [] });
                UI.toast('Expediente actualizado', 'success');
                overlay.remove();
                await load();
                if (window.App) App.updateAlertBadge();
            } catch (err) {
                UI.toast('Error guardando cambios', 'error');
            }
        });
    }

    return { load, render, cambiarVista, abrirFicha };
})();
