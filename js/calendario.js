const Calendario = (() => {
  let eventos = [];
  let plazos = [];

  async function load() {
    const list = document.getElementById('calendar-list');
    if (list) list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-tertiary)">Cargando...</div>';
    try {
      const { estudioId } = await (Auth.getPerfilConEstudio ? Auth.getPerfilConEstudio() : Promise.resolve({ estudioId: null }));
      if (!estudioId) throw new Error('Sin estudio');
      const [evts, pls] = await Promise.all([
        API.request(`/rest/v1/eventos_manuales?select=*&estudio_id=eq.${estudioId}&order=fecha.asc`),
        API.request(`/rest/v1/plazos_legales?select=*,marcas_vigiladas!inner(nombre,estudio_id)&estudio_id=eq.${estudioId}&order=fecha_vencimiento.asc`).catch(()=> API.request('/rest/v1/plazos_legales?select=*,marcas_vigiladas(nombre)&order=fecha_vencimiento.asc'))
      ]);
      eventos = Array.isArray(evts) ? evts : [];
      // Fallback: si plazos filtrado por estudio_id no funciona, filtrar en frontend
      if (Array.isArray(pls)) {
        plazos = pls.filter(p => {
          if (p.estudio_id) return String(p.estudio_id) === String(estudioId);
          if (p.marcas_vigiladas && p.marcas_vigiladas.estudio_id) return String(p.marcas_vigiladas.estudio_id) === String(estudioId);
          return true;
        });
      } else plazos = [];
    } catch(e){
      eventos = []; plazos = [];
      UI.toast('Error cargando calendario', 'error');
    }
    render();
  }

  function render() {
    const list = document.getElementById('calendar-list');
    const count = document.getElementById('calendario-count');
    const all = [
      ...plazos.map(p => ({ fecha: p.fecha_vencimiento || p.fecha, titulo: `${p.titulo || p.marca || p.marcas_vigiladas?.nombre || 'Plazo'} — ${p.tipo || ''}`, tipo: 'plazo', data: p })),
      ...eventos.map(e => ({ fecha: e.fecha, titulo: e.titulo, tipo: e.tipo || 'manual', data: e }))
    ].sort((a,b)=> new Date(a.fecha) - new Date(b.fecha));
    if (count) count.textContent = `${all.length} eventos (plazos ${plazos.length} + manuales ${eventos.length})`;
    if (!list) return;
    if (!all.length) {
      list.innerHTML = '<div style="text-align:center; padding:20px; color:var(--text-tertiary)">Sin plazos ni eventos. Creá uno manual.</div>';
      return;
    }
    list.innerHTML = all.map(ev => {
      const d = new Date(ev.fecha);
      const fechaStr = isNaN(d.getTime()) ? ev.fecha : d.toLocaleDateString('es-AR');
      const badge = ev.tipo === 'plazo' ? 'badge--warning' : ev.tipo === 'vencimiento' ? 'badge--danger' : 'badge--info';
      const esPlazo = ev.tipo === 'plazo';
      return `<div style="display:flex; gap:12px; align-items:center; padding:10px; border:1px solid var(--border); border-radius:6px; margin-bottom:8px; background:${esPlazo?'#fffbeb':'#fff'};">
        <div style="text-align:center; min-width:60px;"><div style="font-weight:700; font-size:0.875rem;">${fechaStr}</div><span class="badge ${badge}" style="font-size:0.65rem; margin-top:4px;">${ev.tipo}</span></div>
        <div style="flex:1;"><div style="font-weight:600;">${UI.escapeHtml(ev.titulo)}</div>${ev.data?.marca ? `<div style="font-size:0.75rem; color:var(--text-tertiary);">Marca: ${UI.escapeHtml(ev.data.marca)}</div>` : ''}${ev.data?.notas ? `<div style="font-size:0.75rem; color:var(--text-tertiary);">${UI.escapeHtml(ev.data.notas.slice(0,80))}</div>` : ''}</div>
        ${ev.tipo !== 'plazo' ? `<button class="btn btn--ghost btn--sm" onclick="Calendario.borrar('${ev.data.id}')">✕</button>` : ''}
      </div>`;
    }).join('');
    // Simple calendar grid (no FullCalendar, solo lista cronológica)
    const calEl = document.getElementById('calendar');
    if (calEl) {
      // Mini calendario visual: agrupar por mes
      const porMes = {};
      all.forEach(ev => {
        const m = ev.fecha ? ev.fecha.slice(0,7) : 'sin-fecha';
        if (!porMes[m]) porMes[m] = [];
        porMes[m].push(ev);
      });
      calEl.innerHTML = Object.entries(porMes).map(([mes, evs]) => `
        <div style="margin-bottom:12px;">
          <div style="font-weight:700; font-size:0.875rem; color:var(--primary); border-bottom:1px solid var(--border); padding-bottom:4px;">${mes === 'sin-fecha' ? 'Sin fecha' : new Date(mes+'-01').toLocaleDateString('es-AR', {month:'long', year:'numeric'})}</div>
          <div style="display:flex; flex-wrap:wrap; gap:6px; margin-top:6px;">
            ${evs.map(ev=> `<span class="badge ${ev.tipo==='plazo'?'badge--warning':'badge--info'}" style="padding:4px 8px;">${new Date(ev.fecha).toLocaleDateString('es-AR')} — ${UI.escapeHtml(ev.titulo.slice(0,20))}</span>`).join('')}
          </div>
        </div>
      `).join('');
    }
  }

  async function guardar() {
    const titulo = document.getElementById('calendario-titulo')?.value.trim();
    const fecha = document.getElementById('calendario-fecha')?.value;
    const tipo = document.getElementById('calendario-tipo')?.value;
    const marca = document.getElementById('calendario-marca')?.value.trim() || null;
    const notas = document.getElementById('calendario-notas')?.value.trim() || null;
    if (!titulo || !fecha) { UI.toast('Título y fecha requeridos', 'error'); return; }
    const { estudioId } = await Auth.getPerfilConEstudio();
    if (!estudioId) { UI.toast('Sin estudio', 'error'); return; }
    try {
      await API.request('/rest/v1/eventos_manuales', { method:'POST', body: JSON.stringify({ estudio_id: estudioId, titulo, fecha, tipo, marca_id: null, cliente_id: null, notas }) });
      UI.toast('Evento creado', 'success');
      document.getElementById('calendario-form').style.display = 'none';
      await load();
    } catch(e){ UI.toast('Error: '+e.message, 'error'); }
  }

  async function borrar(id) {
    if (!confirm('¿Borrar evento?')) return;
    try { await API.request(`/rest/v1/eventos_manuales?id=eq.${id}`, { method:'DELETE' }); await load(); } catch(e){ UI.toast('Error borrando', 'error'); }
  }

  function init() {
    document.getElementById('btn-nuevo-evento')?.addEventListener('click', () => {
      document.getElementById('calendario-form').style.display = 'block';
    });
    document.getElementById('btn-cancelar-evento')?.addEventListener('click', () => {
      document.getElementById('calendario-form').style.display = 'none';
    });
    document.getElementById('btn-guardar-evento')?.addEventListener('click', guardar);
  }

  return { load, render, init, borrar };
})();
