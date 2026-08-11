/**
 * ═══════════════════════════════════════════════════════════
 *  Cartera View — CRM: alta, edición, estado, notas
 * ═══════════════════════════════════════════════════════════
 */

const Cartera = (() => {
    let cache = [];
    let editingId = null;

    const ESTADO_BADGE = {
        'Solicitada': 'badge--info',
        'En trámite': 'badge--info',
        'Registrada': 'badge--success',
        'En oposición': 'badge--warning',
        'En litigio': 'badge--danger',
        'Vencida': 'badge--danger',
        'Denegada': 'badge--danger',
    };

    async function load() {
        const tbody = document.getElementById('tbody-cartera');
        if (tbody) tbody.innerHTML = UI.skeletonRows(3, 6);

        try {
            cache = await API.getMarcas();
            if (!Array.isArray(cache)) cache = [];
        } catch (err) {
            cache = [];
            UI.toast('Error cargando cartera', 'error');
        }
        render();
        return cache;
    }

    function render() {
        const tbody = document.getElementById('tbody-cartera');
        const empty = document.getElementById('empty-cartera');
        const count = document.getElementById('cartera-count');

        if (count) count.textContent = `${cache.length} marca${cache.length !== 1 ? 's' : ''}`;

        if (!cache.length) {
            if (tbody) tbody.innerHTML = '';
            if (empty) empty.style.display = 'flex';
            return;
        }
        if (empty) empty.style.display = 'none';

        if (tbody) {
            tbody.innerHTML = cache.map(m => {
                const tipoStr = m.tipo === 'M' ? 'Mixta' : 'Denominativa';
                const tipoBadge = m.tipo === 'M' ? 'badge--info' : 'badge--primary';
                const estado = m.estado || 'Solicitada';
                const estadoBadge = ESTADO_BADGE[estado] || 'badge--info';
                const notaTitle = m.notas ? ` title="${UI.escapeHtml(m.notas)}"` : '';

                return `
          <tr>
            <td>
              <div class="marca-name"${notaTitle}>${UI.escapeHtml(m.nombre) || '(logo sin texto)'}</div>
            </td>
            <td><span class="badge badge--primary">${m.clase}</span></td>
            <td><span class="badge ${tipoBadge}">${tipoStr}</span></td>
            <td style="color: var(--text-secondary);">${UI.escapeHtml(m.cliente) || '—'}</td>
            <td><span class="badge ${estadoBadge}"${notaTitle}>${estado}</span></td>
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

    return { load, render, addMarca, editMarca, cancelarEdicion, deleteMarca, getCache };
})();
