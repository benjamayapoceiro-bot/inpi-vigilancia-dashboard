/**
 * ═══════════════════════════════════════════════════════════
 *  Cartera View — Brand Portfolio with enhanced CRUD
 * ═══════════════════════════════════════════════════════════
 */

const Cartera = (() => {
    let cache = [];

    async function load() {
        const tbody = document.getElementById('tbody-cartera');
        if (tbody) tbody.innerHTML = UI.skeletonRows(3, 5);

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

                return `
          <tr>
            <td>
              <div class="marca-name">${UI.escapeHtml(m.nombre) || '(logo sin texto)'}</div>
            </td>
            <td><span class="badge badge--primary">${m.clase}</span></td>
            <td><span class="badge ${tipoBadge}">${tipoStr}</span></td>
            <td style="color: var(--text-secondary);">${UI.escapeHtml(m.cliente) || '—'}</td>
            <td>${UI.expiryBadge(m.fecha_vencimiento)}</td>
            <td>
              <div style="display: flex; gap: var(--space-xs);">
                <button class="btn btn--danger btn--sm" onclick="Cartera.deleteMarca('${m.id}', '${UI.escapeHtml(m.nombre || 'esta marca')}')">
                  ✕ Borrar
                </button>
              </div>
            </td>
          </tr>
        `;
            }).join('');
        }
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
        };

        // Validate
        if (!body.clase || body.clase < 1 || body.clase > 45) {
            UI.toast('La clase debe ser entre 1 y 45', 'error');
            return;
        }

        try {
            if (tipo === 'M' && logoFile) {
                body.logo_pendiente = await UI.fileToBase64(logoFile);
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span class="spinner"></span> Agregando...';
            }

            await API.addMarca(body);
            form.reset();
            const campoLogo = document.getElementById('campo-logo');
            if (campoLogo) campoLogo.style.display = 'none';

            UI.toast('Marca agregada correctamente', 'success');
            await load();

            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '＋ Agregar marca';
            }
        } catch (err) {
            UI.toast('Error agregando marca', 'error');
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '＋ Agregar marca';
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
            await load();
        } catch (err) {
            UI.toast('Error eliminando marca', 'error');
        }
    }

    function getCache() { return cache; }

    return { load, render, addMarca, deleteMarca, getCache };
})();
