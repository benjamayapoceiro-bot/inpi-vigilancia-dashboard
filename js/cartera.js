/**
 * ═══════════════════════════════════════════════════════════
 *  Cartera View — CRM: alta, edición, estado, notas, filtros
 * ═══════════════════════════════════════════════════════════
 */

const Cartera = (() => {
    let cache = [];
    let editingId = null;
    let filtroTexto = '';
    let filtroEstado = '';

    const ESTADOS = ['Solicitada', 'En trámite', 'Registrada', 'En oposición', 'En litigio', 'Vencida', 'Denegada'];

    const ESTADO_BADGE = {
        'Solicitada': 'badge--info',
        'En trámite': 'badge--info',
        'Registrada': 'badge--success',
        'En oposición': 'badge--warning',
        'En litigio': 'badge--danger',
        'Vencida': 'badge--danger',
        'Denegada': 'badge--danger',
    };

    const ESTADO_ICON = {
        'Solicitada': '📝', 'En trámite': '⏳', 'Registrada': '✅',
        'En oposición': '⚠️', 'En litigio': '⚖️', 'Vencida': '⏰', 'Denegada': '🚫',
    };

    async function load() {
        const tbody = document.getElementById('tbody-cartera');
        if (tbody) tbody.innerHTML = UI.skeletonRows(3, 7);

        try {
            cache = await API.getMarcas();
            if (!Array.isArray(cache)) cache = [];
        } catch (err) {
            cache = [];
            UI.toast('Error cargando cartera', 'error');
        }
        renderStats();
        render();
        return cache;
    }

    function renderStats() {
        const cont = document.getElementById('cartera-stats');
        if (!cont) return;

        const porEstado = {};
        ESTADOS.forEach(e => porEstado[e] = 0);
        cache.forEach(m => { const e = m.estado || 'Solicitada'; porEstado[e] = (porEstado[e] || 0) + 1; });

        // Mostrar solo los estados que tienen al menos 1, más "Total" siempre primero
        const destacados = ['Registrada', 'En trámite', 'En oposición', 'En litigio'];

        cont.innerHTML = `
      <div class="card card--stat hover-lift">
        <div class="stat-icon purple">💼</div>
        <div class="stat-value">${cache.length}</div>
        <div class="stat-label">Total en cartera</div>
      </div>
      ${destacados.map(e => `
        <div class="card card--stat hover-lift" style="cursor:pointer;" onclick="Cartera.filtrarPorEstado('${e}')">
          <div class="stat-icon ${e === 'Registrada' ? 'green' : e === 'En oposición' ? 'red' : e === 'En litigio' ? 'red' : 'cyan'}">${ESTADO_ICON[e]}</div>
          <div class="stat-value">${porEstado[e] || 0}</div>
          <div class="stat-label">${e}</div>
        </div>
      `).join('')}
    `;
    }

    function filtrarPorEstado(estado) {
        filtroEstado = estado;
        const sel = document.getElementById('cartera-filtro-estado');
        if (sel) sel.value = estado;
        render();
    }

    function setFiltroTexto(texto) {
        filtroTexto = (texto || '').toLowerCase();
        render();
    }

    function setFiltroEstado(estado) {
        filtroEstado = estado;
        render();
    }

    function aplicarFiltros(lista) {
        return lista.filter(m => {
            if (filtroEstado && (m.estado || 'Solicitada') !== filtroEstado) return false;
            if (filtroTexto) {
                const texto = `${m.nombre || ''} ${m.cliente || ''}`.toLowerCase();
                if (!texto.includes(filtroTexto)) return false;
            }
            return true;
        });
    }

    function render() {
        const tbody = document.getElementById('tbody-cartera');
        const empty = document.getElementById('empty-cartera');
        const count = document.getElementById('cartera-count');

        const filtradas = aplicarFiltros(cache);

        if (count) {
            count.textContent = filtradas.length === cache.length
                ? `${cache.length} marca${cache.length !== 1 ? 's' : ''}`
                : `${filtradas.length} de ${cache.length} marcas`;
        }

        if (!cache.length) {
            if (tbody) tbody.innerHTML = '';
            if (empty) { empty.style.display = 'flex'; empty.querySelector('.empty-state__title').textContent = 'Todavía no cargaste marcas'; }
            return;
        }
        if (!filtradas.length) {
            if (tbody) tbody.innerHTML = '';
            if (empty) { empty.style.display = 'flex'; empty.querySelector('.empty-state__title').textContent = 'Sin resultados para ese filtro'; }
            return;
        }
        if (empty) empty.style.display = 'none';

        if (tbody) {
            tbody.innerHTML = filtradas.map(m => {
                const tipoStr = m.tipo === 'M' ? 'Mixta' : 'Denominativa';
                const tipoBadge = m.tipo === 'M' ? 'badge--info' : 'badge--primary';
                const estado = m.estado || 'Solicitada';
                const estadoBadge = ESTADO_BADGE[estado] || 'badge--info';
                const notaTitle = m.notas ? ` title="${UI.escapeHtml(m.notas)}"` : '';

                return `
          <tr>
            <td>
              <div class="marca-name"${notaTitle}>${UI.escapeHtml(m.nombre) || '(logo sin texto)'}</div>
              ${m.numero_acta ? `<a class="acta-link" target="_blank" rel="noopener" href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(m.numero_acta)}" title="Ver esta acta en el INPI">Acta ${UI.escapeHtml(m.numero_acta)} ↗</a>` : ''}
            </td>
            <td><span class="badge badge--primary">${m.clase}</span></td>
            <td><span class="badge ${tipoBadge}">${tipoStr}</span></td>
            <td style="color: var(--text-secondary);">${UI.escapeHtml(m.cliente) || '—'}</td>
            <td><span class="badge ${estadoBadge}"${notaTitle}>${ESTADO_ICON[estado] || ''} ${estado}</span></td>
            <td>${UI.expiryBadge(m.fecha_vencimiento)}</td>
            <td>
              <div style="display: flex; gap: var(--space-xs);">
                <button class="btn btn--secondary btn--sm" onclick="Cartera.editMarca('${m.id}')">✎</button>
                <button class="btn btn--danger btn--sm" onclick="Cartera.deleteMarca('${m.id}', '${UI.escapeHtml(m.nombre || 'esta marca')}')">✕</button>
              </div>
            </td>
          </tr>
        `;
            }).join('');
        }
    }

    function editMarca(id) {
        const m = cache.find(x => x.id === id);
        if (!m) return;
        editingId = id;

        document.getElementById('f-nombre').value = m.nombre || '';
        document.getElementById('f-clase').value = m.clase || '';
        document.getElementById('f-tipo').value = m.tipo || 'D';
        document.getElementById('f-cliente').value = m.cliente || '';
        document.getElementById('f-vencimiento').value = m.fecha_vencimiento || '';
        document.getElementById('f-estado').value = m.estado || 'Solicitada';
        document.getElementById('f-acta').value = m.numero_acta || '';
        document.getElementById('f-notas').value = m.notas || '';

        const campoLogo = document.getElementById('campo-logo');
        if (campoLogo) campoLogo.style.display = m.tipo === 'M' ? 'block' : 'none';

        document.getElementById('btn-submit-marca').textContent = '💾 Guardar cambios';
        document.getElementById('btn-cancelar-edicion').style.display = 'inline-flex';

        document.getElementById('form-alta')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function cancelarEdicion() {
        editingId = null;
        document.getElementById('form-alta')?.reset();
        document.getElementById('btn-submit-marca').textContent = '＋ Agregar marca';
        document.getElementById('btn-cancelar-edicion').style.display = 'none';
        const campoLogo = document.getElementById('campo-logo');
        if (campoLogo) campoLogo.style.display = 'none';
    }

    async function addMarca(e) {
        e.preventDefault();
        const form = e.target;

        const tipo = form.querySelector('#f-tipo').value;
        const logoFile = form.querySelector('#f-logo')?.files[0];

        const body = {
            nombre: form.querySelector('#f-nombre').value || null,
            clase: parseInt(form.querySelector('#f-clase').value),
            tipo,
            cliente: form.querySelector('#f-cliente').value || null,
            fecha_vencimiento: form.querySelector('#f-vencimiento').value || null,
            estado: form.querySelector('#f-estado').value || 'Solicitada',
            numero_acta: form.querySelector('#f-acta').value || null,
            notas: form.querySelector('#f-notas').value || null,
        };

        if (!body.clase || body.clase < 1 || body.clase > 45) {
            UI.toast('La clase debe ser entre 1 y 45', 'error');
            return;
        }

        // Si NO estamos editando, chequear que no exista ya una marca igual
        // (evita duplicados por tocar el formulario de alta pensando que edita)
        if (!editingId) {
            const yaExiste = cache.some(m =>
                (m.nombre || '').trim().toUpperCase() === (body.nombre || '').trim().toUpperCase() &&
                m.clase === body.clase &&
                (m.cliente || '') === (body.cliente || '')
            );
            if (yaExiste) {
                const confirmado = await UI.confirm(
                    '¿Ya existe una marca igual?',
                    `Ya tenés cargada <strong>${UI.escapeHtml(body.nombre) || '(sin nombre)'}</strong> (clase ${body.clase}${body.cliente ? ', cliente ' + UI.escapeHtml(body.cliente) : ''}). ` +
                    `Si querés modificarla, cancelá esto y usá el botón ✎ en la fila correspondiente en vez de cargarla de nuevo. ¿Seguro que querés crear una marca duplicada?`
                );
                if (!confirmado) return;
            }
        }

        const submitBtn = form.querySelector('#btn-submit-marca');

        try {
            if (tipo === 'M' && logoFile) {
                body.logo_pendiente = await UI.fileToBase64(logoFile);
            }

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Guardando...';
            }

            if (editingId) {
                await API.updateMarca(editingId, body);
                UI.toast('Marca actualizada', 'success');
            } else {
                await API.addMarca(body);
                UI.toast('Marca agregada correctamente', 'success');
            }

            cancelarEdicion();
            await load();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = editingId ? '💾 Guardar cambios' : '＋ Agregar marca';
            }
        } catch (err) {
            UI.toast('Error guardando la marca', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = editingId ? '💾 Guardar cambios' : '＋ Agregar marca';
            }
        }
    }

    async function deleteMarca(id, nombre) {
        const confirmed = await UI.confirm(
            '¿Borrar esta marca?',
            `Vas a eliminar <strong>${nombre}</strong> de tu cartera de vigilancia. Esta acción no se puede deshacer.`
        );
        if (!confirmed) return;

        try {
            await API.deleteMarca(id);
            UI.toast('Marca eliminada', 'success');
            if (editingId === id) cancelarEdicion();
            await load();
        } catch (err) {
            UI.toast('Error eliminando marca', 'error');
        }
    }

    function getCache() { return cache; }

    return {
        load, render, addMarca, editMarca, cancelarEdicion, deleteMarca, getCache,
        filtrarPorEstado, setFiltroTexto, setFiltroEstado,
    };
})();
