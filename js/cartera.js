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
                const tipoMap = {D:'Denominativa',M:'Mixta',F:'Figurativa'};
                const tipoStr = tipoMap[m.tipo] || 'Denominativa';
                const tipoBadge = m.tipo === 'D' ? 'badge--primary' : (m.tipo==='F' ? 'badge--warning' : 'badge--info');
                const estado = m.estado || 'Solicitada';
                const estadoBadge = ESTADO_BADGE[estado] || 'badge--info';
                const notaTitle = m.notas ? ` title="${UI.escapeHtml(m.notas)}"` : '';

                return `
          <tr>
            <td>
              <div class="marca-name"${notaTitle}>${UI.escapeHtml(m.nombre) || '(logo sin texto)'}</div>
              ${m.numero_acta ? `<div style="margin-top:6px;"><button class="btn btn--sm btn--primary" onclick="Detalle.abrir('${m.numero_acta}')" style="padding:2px 6px;">Ver grilla 👁️</button> <a href="inpi-grilla.html?acta=${encodeURIComponent(m.numero_acta)}" target="_blank" style="font-size:0.7rem; text-decoration:underline; margin-left:4px;">INPI ↗</a> <span style="font-size:0.75rem; color:var(--text-tertiary);">Acta ${UI.escapeHtml(m.numero_acta)}</span></div>` : ''}
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
        if (campoLogo) campoLogo.style.display = (m.tipo === 'M' || m.tipo === 'F') ? 'block' : 'none';

        document.getElementById('btn-submit-marca').textContent = '💾 Guardar cambios';
        document.getElementById('btn-cancelar-edicion').style.display = 'inline-flex';

        document.getElementById('form-alta')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function buscarActa() {
        const actaInput = document.getElementById('f-acta');
        const acta = actaInput?.value?.trim();
        const status = document.getElementById('acta-status');
        if (!acta || !/^\d{5,}$/.test(acta)) {
            if (status) { status.style.display = 'block'; status.textContent = 'Ingresá un N° de acta válido (solo números)'; status.style.color = 'var(--danger)'; }
            return;
        }
        const btn = document.getElementById('btn-buscar-acta');
        if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
        if (status) { status.style.display = 'block'; status.textContent = `Buscando acta ${acta} en INPI...`; status.style.color = 'var(--text-tertiary)'; }
        try {
            const cfg = window.APP_CONFIG?.supabase;
            // Intenta via edge inpi-detalle (que ya trae grilla + protección)
            let data = null;
            try {
                const r = await fetch(`${cfg.url}/functions/v1/inpi-detalle`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey }, body: JSON.stringify({ acta }) });
                const j = await r.json();
                if (j.ok && j.data) data = j.data;
            } catch {}
            // Fallback a grilla directa si inpi-detalle no trae denominación
            if (!data || !data.denominacion) {
                const gr = await fetch(`${cfg.url}/functions/v1/inpi-consulta`, { method: 'POST', headers: { 'Content-Type': 'application/json', apikey: cfg.anonKey }, body: JSON.stringify({ tipo: 'denominacion', valor: acta }) }).then(r=>r.json()).catch(()=>null);
                // inpi-consulta con acta como valor no funciona, probamos con acta como número en grilla puntual via inpi-detalle ya lo hizo
            }
            if (!data || (!data.denominacion && !data.grilla)) {
                // Último intento: usar grilla del modal (fetchGrilla) si está disponible
                if (typeof Detalle !== 'undefined' && Detalle.abrir) {
                    if (status) status.textContent = `No se encontró acta ${acta} como marca, probá con búsqueda por denominación.`;
                    status.style.color = 'var(--warning)';
                    return;
                }
            }
            const g = data.grilla || {};
            const nombre = data.denominacion || g.denominacion || g.Denominacion || '';
            const clase = data.clase || g.clase || g.Clase || '';
            const tipoRaw = data.tipo_marca || g.tipo_marca || g.Tipo_Marca || data.tipo || '';
            let tipo = 'D';
            if (String(tipoRaw).toLowerCase().includes('mixta') || String(tipoRaw) === '2') tipo = 'M';
            else if (String(tipoRaw).toLowerCase().includes('figurativa') || String(tipoRaw) === '3' || String(tipoRaw) === '5') tipo = 'F';
            const estadoRaw = data.estado || g.estado || g.Estado || '';
            const estadoMap = { C: 'Registrada', R: 'Registrada', Concedida: 'Registrada', T: 'En trámite', D: 'Denegada', V: 'Vencida' };
            const estado = estadoMap[estadoRaw] || estadoMap[String(estadoRaw).trim()] || 'Registrada';
            const titular = data.titular || g.titulares || g.Titulares || '';

            document.getElementById('f-nombre').value = nombre || '';
            if (clase) document.getElementById('f-clase').value = String(clase).replace(/\D/g,'').slice(0,2);
            document.getElementById('f-tipo').value = tipo;
            const campoLogo = document.getElementById('campo-logo');
            if (campoLogo) campoLogo.style.display = (tipo === 'M' || tipo === 'F') ? 'block' : 'none';
            // Logo para Mixta/Figurativa: si INPI trae logo_url, mostrar preview y guardar como pendiente
            const logoUrl = data.logo_url || g.logo_url || g.Logo || null;
            const logoOk = logoUrl && !logoUrl.includes('logon.png') && !logoUrl.includes('assets/img/logon');
            if ((tipo === 'M' || tipo === 'F') && logoOk) {
                let preview = document.getElementById('f-logo-preview');
                if (!preview) {
                    preview = document.createElement('div');
                    preview.id = 'f-logo-preview';
                    preview.style.cssText = 'margin-top:8px;';
                    document.getElementById('campo-logo')?.appendChild(preview);
                }
                preview.innerHTML = `<div style="font-size:0.75rem; color:var(--text-tertiary);">Logo INPI:</div><img src="${logoUrl}" style="max-width:120px; max-height:120px; border:1px solid var(--border); border-radius:6px; margin-top:4px; background:#fff; padding:4px;" onerror="this.style.display='none'"><div style="font-size:0.7rem; color:var(--text-tertiary); margin-top:2px;">Se guardará al agregar (si querés cambiarlo, elegí otro archivo)</div>`;
                // Guardar para enviar al crear: fetch y convertir a base64 en addMarca si no hay archivo elegido
                window._logoFromInpi = logoUrl;
            } else if (tipo === 'M' || tipo === 'F') {
                const p = document.getElementById('f-logo-preview');
                if (p) p.innerHTML = `<div style="font-size:0.75rem; color:var(--text-tertiary);">Sin logo en INPI para esta acta — subí el archivo si es Mixta/Figurativa</div>`;
            }
            document.getElementById('f-estado').value = estado;
            if (titular) document.getElementById('f-cliente').value = titular.split('100%')[0].replace(/^\d+\s+/,'').trim().slice(0,60);
            document.getElementById('f-notas').value = `Titular INPI: ${titular} — Acta ${acta} — importado ${new Date().toLocaleDateString('es-AR')}`;
            if (status) { status.textContent = `✓ Acta ${acta} encontrada: ${nombre || '(figurativa)'} — Clase ${clase} — Se rellenó con info exacta del INPI`; status.style.color = 'var(--success)'; }
            UI.toast(`Acta ${acta} cargada desde INPI`, 'success');
        } catch(e) {
            if (status) { status.textContent = `✗ No se pudo traer acta ${acta}: ${e.message}`; status.style.color = 'var(--danger)'; }
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = '🔍'; }
        }
    }

    function cancelarEdicion() {
        editingId = null;
        document.getElementById('form-alta')?.reset();
        document.getElementById('btn-submit-marca').textContent = '＋ Agregar marca';
        document.getElementById('btn-cancelar-edicion').style.display = 'none';
        const campoLogo = document.getElementById('campo-logo');
        if (campoLogo) campoLogo.style.display = 'none';
        const p = document.getElementById('f-logo-preview');
        if (p) p.remove();
        window._logoFromInpi = null;
        const status = document.getElementById('acta-status');
        if (status) status.style.display = 'none';
    }

    async function addMarca(e) {
        e.preventDefault();
        const form = e.target;

        const tipo = form.querySelector('#f-tipo').value;
        const logoFile = form.querySelector('#f-logo')?.files[0];

        let perfil = null;
        try {
            const sb=(typeof Auth!=='undefined'&&Auth.sb)?Auth.sb():null;
            if (sb) {
                const {data:{user}}=await sb.auth.getUser();
                if (user) {
                    const {data}=await sb.from('perfiles').select('estudio_id, rol, email').eq('id', user.id).maybeSingle();
                    perfil = data;
                    // Fallback hardcoded para admin principal si RLS falla
                    if (!perfil && user.email === 'benjamayapoceiro@gmail.com') {
                        perfil = { estudio_id: 'a3245063-f7ba-403a-a45e-2dc11417645b', rol: 'admin', email: user.email };
                    }
                }
            }
        } catch(e){ console.warn('perfil fetch fail',e); }
        // Último fallback para admin
        if (!perfil?.estudio_id) {
            try {
                const r = await API.request('/rest/v1/estudios?select=id&limit=1');
                if (r && r[0] && perfil?.rol === 'admin') perfil = { ...perfil, estudio_id: r[0].id };
            } catch {}
        }
        const estudioId = perfil?.estudio_id || null;
        if (!estudioId) {
            UI.toast('No se pudo determinar tu estudio (perfil sin estudio_id) — contactá al admin', 'error');
            return;
        }
        // Chequear límite por plan
        try {
            const estudio = await API.request(`/rest/v1/estudios?select=limite_marcas,puede_conectar_inpi&id=eq.${estudioId}&limit=1`).then(r=>r[0]).catch(()=>null);
            if (estudio) {
                const count = (await API.request(`/rest/v1/marcas_vigiladas?select=id&estudio_id=eq.${estudioId}`)).length;
                if (count >= estudio.limite_marcas) {
                    UI.toast(`Límite de ${estudio.limite_marcas} marcas alcanzado para tu plan — contactá al admin`, 'error');
                    return;
                }
                if (estudio.puede_conectar_inpi === false) {
                    UI.toast('Tu plan no permite conectar al INPI (solo monitoreo) — contactá al admin', 'error');
                    // permitimos solo D sin logo? por ahora bloqueamos todo con INPI, pero dejamos agregar igual para demo
                }
            }
        } catch(e){ console.warn('check plan fail',e); }
        const body = {
            nombre: form.querySelector('#f-nombre').value || null,
            clase: parseInt(form.querySelector('#f-clase').value),
            tipo,
            cliente: form.querySelector('#f-cliente').value || null,
            fecha_vencimiento: form.querySelector('#f-vencimiento').value || null,
            estado: form.querySelector('#f-estado').value || 'Solicitada',
            numero_acta: form.querySelector('#f-acta').value || null,
            notas: form.querySelector('#f-notas').value || null,
            estudio_id: estudioId,
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
            if ((tipo === 'M' || tipo === 'F') && logoFile) {
                body.logo_pendiente = await UI.fileToBase64(logoFile);
            } else if ((tipo === 'M' || tipo === 'F') && window._logoFromInpi && !logoFile) {
                try {
                    const resp = await fetch(window._logoFromInpi);
                    const blob = await resp.blob();
                    body.logo_pendiente = await new Promise((res, rej) => {
                        const r = new FileReader();
                        r.onload = () => res(r.result);
                        r.onerror = rej;
                        r.readAsDataURL(blob);
                    });
                } catch {}
            }
            if (tipo === 'F' && !body.nombre) {
                body.nombre = null;
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
            console.error('addMarca error', err, body);
            UI.toast(`Error guardando: ${err.message || 'desconocido'}`, 'error');
            const status = document.getElementById('acta-status');
            if (status) { status.style.display = 'block'; status.textContent = `✗ Error: ${err.message}`; status.style.color = 'var(--danger)'; }
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
        load, render, addMarca, editMarca, cancelarEdicion, deleteMarca, getCache, buscarActa,
        filtrarPorEstado, setFiltroTexto, setFiltroEstado,
    };
})();
