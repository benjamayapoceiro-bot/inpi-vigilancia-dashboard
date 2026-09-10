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
    // Calendario visual con grid de días clickeable
    const calEl = document.getElementById('calendar');
    if (calEl) {
      const hoy = new Date();
      const year = hoy.getFullYear();
      const month = hoy.getMonth();
      const primerDia = new Date(year, month, 1).getDay();
      const diasEnMes = new Date(year, month+1, 0).getDate();
      const nombreMes = hoy.toLocaleDateString('es-AR', {month:'long', year:'numeric'});
      let grid = `<div style="text-align:center; font-weight:700; font-size:1rem; margin-bottom:8px; color:var(--primary); text-transform:capitalize;">${nombreMes}</div>`;
      grid += `<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px; text-align:center; font-size:0.7rem; color:var(--text-tertiary); margin-bottom:4px;"><div>Dom</div><div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div></div>`;
      grid += `<div style="display:grid; grid-template-columns: repeat(7, 1fr); gap:4px;">`;
      for (let i=0;i<primerDia;i++) grid += `<div style="padding:8px;"></div>`;
      for (let d=1; d<=diasEnMes; d++) {
        const fechaStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const evsDia = all.filter(ev => ev.fecha && ev.fecha.slice(0,10) === fechaStr);
        const tienePlazo = evsDia.some(e=>e.tipo==='plazo');
        const bg = evsDia.length ? (tienePlazo ? '#fef3c7' : '#e0f2fe') : '#fff';
        const border = evsDia.length ? (tienePlazo ? '1px solid #f59e0b' : '1px solid #0ea5e9') : '1px solid var(--border)';
        grid += `<div onclick="document.getElementById('calendario-fecha').value='${fechaStr}'; document.getElementById('calendario-form').style.display='block'; document.getElementById('calendario-titulo').focus();" style="min-height:60px; padding:4px; border:${border}; border-radius:6px; background:${bg}; cursor:pointer; position:relative;">
          <div style="font-weight:600; font-size:0.8125rem; ${d===hoy.getDate()?'color:var(--primary); background:var(--info-bg); border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center;':''}">${d}</div>
          ${evsDia.slice(0,2).map(ev=>`<div style="font-size:0.65rem; background:${ev.tipo==='plazo'?'#f59e0b':'#0ea5e9'}; color:#fff; border-radius:3px; padding:1px 3px; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.escapeHtml(ev.titulo.slice(0,10))}</div>`).join('')}
          ${evsDia.length>2?`<div style="font-size:0.6rem; color:var(--text-tertiary); text-align:center;">+${evsDia.length-2} más</div>`:''}
        </div>`;
      }
      grid += `</div><div style="margin-top:8px; font-size:0.7rem; color:var(--text-tertiary); text-align:center;">Tocá un día para agregar evento</div>`;
      calEl.innerHTML = grid;
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
