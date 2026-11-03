const CarterasAdmin = (() => {
  let cache = [];
  async function load() {
    const tbody = document.getElementById('tbody-carteras-admin');
    if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:var(--text-tertiary)">Cargando...</td></tr>';
    try {
      const data = await API.getMarcasTodas();
      cache = Array.isArray(data) ? data : [];
    } catch(e){
      cache = [];
      UI.toast('Error cargando todas las carteras', 'error');
    }
    render();
  }
  function render() {
    const tbody = document.getElementById('tbody-carteras-admin');
    const empty = document.getElementById('empty-carteras-admin');
    const count = document.getElementById('carteras-admin-count');
    const filtro = (document.getElementById('carteras-admin-search')?.value || '').toLowerCase();
    let filtradas = cache;
    if (filtro) {
      filtradas = cache.filter(m => {
        const est = (m.estudios?.nombre || m.estudio_nombre || '').toLowerCase();
        const nom = (m.nombre || '').toLowerCase();
        const cli = (m.cliente || '').toLowerCase();
        return est.includes(filtro) || nom.includes(filtro) || cli.includes(filtro);
      });
    }
    if (count) count.textContent = filtradas.length === cache.length ? `${cache.length} marcas totales` : `${filtradas.length} de ${cache.length}`;
    if (!filtradas.length) {
      if (tbody) tbody.innerHTML = '';
      if (empty) empty.style.display = 'flex';
      return;
    }
    if (empty) empty.style.display = 'none';
    if (tbody) {
      tbody.innerHTML = filtradas.map(m => {
        const estudio = m.estudios?.nombre || m.estudio_nombre || m.estudio_id || '—';
        return `<tr>
          <td><span class="badge badge--info">${UI.escapeHtml(estudio)}</span></td>
          <td>${UI.escapeHtml(m.nombre||'(sin nombre)')} ${m.numero_acta ? `<span style="font-size:0.7rem; color:var(--text-tertiary);">· Acta ${UI.escapeHtml(m.numero_acta)}</span>` : ''}</td>
          <td><span class="badge badge--primary">${m.clase||'—'}</span></td>
          <td>${UI.escapeHtml(m.tipo||'—')}</td>
          <td>${UI.escapeHtml(m.cliente||'—')}</td>
          <td>${UI.escapeHtml(m.estado||'—')}</td>
          <td>${m.fecha_vencimiento ? UI.escapeHtml(m.fecha_vencimiento) : '—'}</td>
          <td>${m.numero_acta ? `<button class="btn btn--ghost btn--sm" style="font-size:0.7rem; padding:2px 6px;" onclick="Detalle.abrir('${m.numero_acta}')">Ver INPI ↗</button>` : '—'}</td>
        </tr>`;
      }).join('');
    }
  }
  async function sincronizarTodas() {
    const btn=document.getElementById('btn-sync-todas-inpi');
    const status=document.getElementById('sync-todas-inpi-status');
    const lista=cache.filter(m=>m.numero_acta && /^\\d{5,}$/.test(String(m.numero_acta)));
    if(!lista.length){UI.toast('No hay actas cargadas para sincronizar','info');return;}
    if(btn){btn.disabled=true;btn.textContent='⏳ Actualizando…';}
    if(status){status.hidden=false;status.textContent=`Actualizando 0 de ${lista.length} expedientes (secuencial).`;}
    let ok=0,fail=0;
    for(let i=0;i<lista.length;i++){
      const m=lista[i];
      try{
        const d=await Inpi.acta(m.numero_acta,true),g=d?.grilla||{};
        const patch={};
        const estado=g.estado||d.estado;
        if(estado)patch.estado=Inpi.parseEstado(estado);
        const venc=Inpi.parseVencimiento(g.vencimiento||g.fecha_vencimiento||d.fecha_vencimiento);
        if(venc)patch.fecha_vencimiento=venc;
        const logo=Inpi.isLogoReal(d.logo_url)?d.logo_url:null;
        if(logo)patch.logo_url=logo;
        if(g.denominacion||d.denominacion)patch.nombre=String(g.denominacion||d.denominacion).trim();
        if(g.clase||d.clase)patch.clase=Number(g.clase||d.clase)||m.clase;
        if(Object.keys(patch).length){await API.updateMarca(m.id,patch);Object.assign(m,patch);}
        ok++;
      }catch(e){fail++;console.warn('Sync INPI admin',m.numero_acta,e);}
      if(status)status.textContent=`Actualizando ${i+1}/${lista.length} · ${ok} correctas · ${fail} errores`;
      if(i<lista.length-1)await new Promise(resolve=>setTimeout(resolve,1200));
    }
    render();
    if(btn){btn.disabled=false;btn.textContent='↻ Sincronizar todas con INPI';}
    if(status)status.textContent=`Finalizado: ${ok} actualizadas; ${fail} con error. Los expedientes sin respuesta quedan sin cambios.`;
    UI.toast(`Sincronización global: ${ok} correctas, ${fail} errores`,fail?'info':'success');
  }
  function init() {
    document.getElementById('carteras-admin-search')?.addEventListener('input', () => render());
  }
  return { load, render, init, sincronizarTodas };
})();
