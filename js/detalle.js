const Detalle = (() => {
  async function abrir(acta) {
    if (!acta) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
    modal.innerHTML = `<div class="card" style="max-width:920px;width:100%;max-height:90vh;overflow:auto;position:relative;"><button onclick="this.closest('.modal-overlay').remove()" style="position:absolute;top:12px;right:12px;" class="btn btn--ghost btn--sm">✕</button><div id="detalle-body" style="padding-top:10px;">Cargando acta ${UI.escapeHtml(acta)}...</div></div>`;
    modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
    const body = modal.querySelector('#detalle-body');
    try {
      let cached = null;
      try { cached = await API.getDetalleActa(acta); } catch(e){ console.warn('getDetalleActa fail',e); }
      if (cached) {
        let grilla = null;
        try { grilla = await fetchGrilla(acta, cached.denominacion); } catch(e){ console.warn('fetchGrilla cached fail',e); }
        const combinado = grilla ? { ...cached, grilla } : cached;
        renderDetalle(body, combinado, true);
        if (Date.now() - new Date(cached.fetched_at).getTime() > 30*24*3600*1000) {
          fetchFresco(acta, body);
        }
        return;
      }
      await fetchFresco(acta, body);
    } catch (e) {
      console.error('abrir error', e);
      try {
        const grilla = await fetchGrilla(acta, null);
        if (grilla) {
          renderDetalle(body, { acta, grilla, denominacion: grilla.denominacion, titular: grilla.titulares, clase: grilla.clase, estado: grilla.estado, reivindicaciones: null, logo_url: null, expediente_url: `https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${acta}`, fuente: 'INPI WS (solo grilla, detalle no disponible)', fetched_at: new Date().toISOString() }, false);
          return;
        }
      } catch {}
      body.innerHTML = `<div style="color:var(--danger); padding:12px; border:1px solid var(--danger-border); border-radius:6px; background:var(--danger-bg);">No se pudo cargar el detalle completo (INPI no respondió: ${UI.escapeHtml(e.message)}).<br>Probá <a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Grilla" target="_blank" style="text-decoration:underline;">buscar directo en el INPI</a> con acta <span class="mono">${UI.escapeHtml(acta)}</span> o reintentá en unos segundos.<br><a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(acta)}" target="_blank" style="text-decoration:underline; margin-top:6px; display:inline-block;">Abrir protección en INPI ↗</a></div>`;
    }
  }
  async function fetchGrilla(acta, denominacion) {
    try {
      const cfg = window.APP_CONFIG.supabase;
      const valor = (denominacion || '').split(' ').slice(0,3).join(' ') || acta;
      const r = await fetch(`${cfg.url}/functions/v1/inpi-consulta`, { method:'POST', headers:{'Content-Type':'application/json', apikey: cfg.anonKey}, body: JSON.stringify({ tipo: 'denominacion', valor })});
      const j = await r.json();
      if (j.ok && Array.isArray(j.resultados)) {
        const row = j.resultados.find(x => String(x.acta) === String(acta)) || j.resultados[0];
        return row || null;
      }
    } catch(e){ console.warn('fetchGrilla fail',e); }
    return null;
  }
  async function fetchFresco(acta, body) {
    body.innerHTML = `Consultando INPI para acta ${UI.escapeHtml(acta)}... <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:6px;">Buscando grilla completa (Búsqueda avanzada) + detalle de protección...</div>`;
    const cfg = window.APP_CONFIG.supabase;
    let detalle = null;
    let cached = false;
    let grilla = null;
    try {
      const r = await fetch(`${cfg.url}/functions/v1/inpi-detalle`, { method:'POST', headers:{'Content-Type':'application/json', apikey: cfg.anonKey}, body: JSON.stringify({acta})});
      const j = await r.json();
      if (j.ok && j.data) { detalle = j.data; cached = !!j.cached; grilla = j.data.grilla || null; }
    } catch(e){ console.warn('inpi-detalle fetch fail', e); }
    if (!detalle) {
      detalle = { acta, denominacion: null, titular: null, clase: null, estado: null, reivindicaciones: null, logo_url: null, expediente_url: `https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${acta}`, fuente: 'INPI WS (fallback)', fetched_at: new Date().toISOString() };
    }
    if (!grilla) {
      grilla = await fetchGrilla(acta, detalle.denominacion);
    }
    const combinado = { ...detalle, grilla };
    renderDetalle(body, combinado, cached);
    if (detalle && !cached && detalle.denominacion) {
      try { await API.saveDetalleActa(detalle); } catch {}
    }
    if (!grilla) {
      const warn = document.createElement('div');
      warn.style.cssText = 'margin-top:12px; padding:8px; background:#fff3cd; border:1px solid #ffe69c; border-radius:6px; font-size:0.75rem;';
      warn.innerHTML = `No se pudo cargar la grilla completa desde el INPI para esta acta. Probá <a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(acta)}" target="_blank" style="text-decoration:underline;">ver grilla en INPI ↗</a> con acta ${UI.escapeHtml(acta)}.`;
      body.appendChild(warn);
    }
  }
  function renderDetalle(el, d, cached) {
    if (!d || typeof d !== 'object' || !d.acta) {
      const actaSafe = (d && d.acta) ? String(d.acta) : '—';
      el.innerHTML = `<div style="color:var(--danger); padding:12px; border:1px solid var(--danger-border); border-radius:6px; background:var(--danger-bg);">No se pudo cargar el detalle para acta ${UI.escapeHtml(actaSafe)}. Probá <a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(actaSafe)}" target="_blank" style="text-decoration:underline;">ver en INPI ↗</a> (Resultado completo).</div>`;
      return;
    }
    const g = d.grilla || null;
    const estadoMap = { C: 'Concedida', R: 'Registrada', T: 'En trámite', D: 'Denegada', V: 'Vencida', A: 'Abandonada', O: 'En oposición', P: 'Publicada', S: 'Solicitada', E: 'En estudio', '': '—' };
    const estadoLabel = (g && g.estado) ? (estadoMap[String(g.estado).trim()] || g.estado) : (d.estado || '—');
    const logoOk = d.logo_url && !d.logo_url.includes('logon.png') && !d.logo_url.includes('assets/img/logon');
    const vencFmt = (() => {
      if (!g || !g.fecha_vencimiento) return '—';
      const d = new Date(g.fecha_vencimiento);
      if (isNaN(d.getTime()) || d.getFullYear() > 2100) return '—';
      return d.toLocaleDateString('es-AR');
    })();
    const venc2 = (() => {
      if (g && g.vencimiento) {
        const d2 = new Date(g.vencimiento);
        if (!isNaN(d2.getTime()) && d2.getFullYear() <= 2100) return d2.toLocaleDateString('es-AR');
      }
      return vencFmt;
    })();
    const logoHtml = logoOk ? `<img src="${d.logo_url}" alt="logo marca" style="max-width:220px;max-height:220px;object-fit:contain;border:1px solid var(--border);border-radius:8px;background:#fff;padding:8px;box-shadow:var(--shadow-sm);" onerror="this.style.display='none'">` : '<div style="width:220px;height:140px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:var(--bg-main);border:1px dashed var(--border);border-radius:8px;color:var(--text-tertiary);font-size:0.75rem; text-align:center; padding:10px;"><span style="font-size:1.2rem;">🖼️</span>Sin logo<br><span style="font-size:0.7rem;">Marca denominativa</span></div>';
    // helper para no mostrar filas vacías
    const row = (label, val) => {
      if (!val || val === '—' || String(val).trim() === '') return '';
      return `<tr><th style="width:140px; text-align:left; background:var(--bg-main); font-size:0.75rem;">${label}</th><td style="font-size:0.8125rem;">${val}</td></tr>`;
    };
    const grillaHtml2 = g ? `
      <div style="margin-bottom:16px;">
        <div style="background:#0f3a5f; color:#fff; padding:8px 12px; font-weight:600; font-size:0.8125rem; border-radius:6px 6px 0 0; display:flex; justify-content:space-between; align-items:center;"><span>Búsqueda avanzada — Grilla INPI</span><span style="font-weight:400; font-size:0.7rem; opacity:0.9;">${g.fecha_ingreso ? new Date(g.fecha_ingreso).toLocaleDateString('es-AR') : ''}</span></div>
        <div style="overflow:auto; border:1px solid #0f3a5f; border-top:none; border-radius:0 0 6px 6px; background:#fff;">
          <table class="data-table" style="font-size:0.75rem; min-width:720px; margin:0;">
            <thead><tr style="background:#f0f4f8; font-size:0.68rem; color:var(--text-secondary);"><th style="padding:8px;">NRO ACTA</th><th>TITULARES</th><th>FECHA INGRESO</th><th>CLASE</th><th>DENOMINACION</th><th>TIPO</th><th>RESOLUCION</th><th>ESTADO</th><th>VENCIMIENTO</th></tr></thead>
            <tbody><tr style="background:#fff;">
              <td class="mono" style="font-weight:700; color:var(--primary);">${UI.escapeHtml(g.acta)}</td>
              <td style="max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.escapeHtml((g.titulares||'').replace(/\s+/g,' ').trim() || '—')}</td>
              <td>${g.fecha_ingreso ? new Date(g.fecha_ingreso).toLocaleDateString('es-AR') : '—'}</td>
              <td><span class="badge badge--primary" style="font-weight:700;">${UI.escapeHtml(String(g.clase||'—'))}</span></td>
              <td style="font-weight:600; max-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${UI.escapeHtml(g.denominacion||'—')}</td>
              <td><span class="badge badge--info">${UI.escapeHtml(g.tipo_marca||'—')}</span></td>
              <td>${UI.escapeHtml(g.numero_resolucion||'—')}</td>
              <td><span class="badge ${estadoLabel==='Concedida'?'badge--success':estadoLabel==='En trámite'?'badge--warning':'badge--primary'}">${UI.escapeHtml(estadoLabel)}</span></td>
              <td>${UI.escapeHtml(venc2)}</td>
            </tr></tbody>
          </table>
        </div>
      </div>
    ` : `<div style="font-size:0.8125rem; color:var(--text-tertiary); margin-bottom:12px; padding:10px; background:var(--bg-main); border:1px solid var(--border); border-radius:6px; text-align:center;">Grilla no disponible para esta acta. Mostrando solo detalle de protección.</div>`;
    el.innerHTML = `
      ${grillaHtml2}
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start; border-top:1px solid var(--border); padding-top:16px;">
        ${logoHtml}
        <div style="flex:1;min-width:280px;">
          <div style="font-size:0.75rem;color:var(--text-tertiary);">Acta ${UI.escapeHtml(d.acta)} ${cached ? '<span class="badge badge--info">cache 30d</span>' : '<span class="badge badge--success">fresco INPI</span>'} ${d.clase ? `<span class="badge badge--primary">Clase ${d.clase}</span>` : ''} ${d.estado ? `<span class="badge">${UI.escapeHtml(d.estado)}</span>` : ''}</div>
          <div style="font-weight:700;font-size:1.15rem;margin:8px 0;">${UI.escapeHtml(d.denominacion || (g ? g.denominacion : '(marca figurativa / sin denominación)'))}</div>
          <table class="data-table" style="font-size:0.8125rem; margin-top:8px;">
            <tbody>
              <tr><th style="width:140px; text-align:left; background:var(--bg-main);">Titular</th><td>${UI.escapeHtml(d.titular || (g ? g.titulares : '—') || '—')}</td></tr>
              <tr><th style="text-align:left; background:var(--bg-main);">Clase / Tipo</th><td>${d.clase || (g?g.clase:'—') ? `Clase ${UI.escapeHtml(d.clase||g.clase)}` : '—'}${d.tipo||g?.tipo_marca||d.tipo_marca ? ` · ${UI.escapeHtml(d.tipo||g.tipo_marca||d.tipo_marca)}` : ''}</td></tr>
              <tr><th style="text-align:left; background:var(--bg-main);">Estado INPI</th><td>${UI.escapeHtml(estadoLabel)}</td></tr>
              <tr><th style="text-align:left; background:var(--bg-main);">Presentación</th><td>${UI.escapeHtml(d.presentacion || '—')}</td></tr>
              <tr><th style="text-align:left; background:var(--bg-main);">Domicilio Legal / Real</th><td>${UI.escapeHtml(d.domicilio_legal || '—')} ${d.domicilio_real ? `<br><span style="font-size:0.75rem; color:var(--text-tertiary);">Real: ${UI.escapeHtml(d.domicilio_real)}</span>` : ''}</td></tr>
              <tr><th style="text-align:left; background:var(--bg-main);">CUIT / DNI</th><td>${UI.escapeHtml(d.cuit || '—')} ${d.dni ? ` · DNI ${UI.escapeHtml(d.dni)}` : ''}</td></tr>
              <tr><th style="text-align:left; background:var(--bg-main);">Acta / Expediente</th><td class="mono">${UI.escapeHtml(d.acta)}${d.expediente_url ? ` · <a href="${d.expediente_url}" target="_blank" style="text-decoration:underline;">Ver en INPI ↗</a>` : ''}</td></tr>
            </tbody>
          </table>
          <div style="background:#0f3a5f; color:#fff; padding:6px 10px; font-weight:600; font-size:0.75rem; margin-top:14px; border-radius:6px 6px 0 0;">PROTECCION</div>
          <div style="border:1px solid #0f3a5f; border-top:none; padding:12px; border-radius:0 0 6px 6px; background:#fff;">
            ${d.clase ? `<div style="font-size:0.8125rem;"><strong>CLASE:</strong> <span style="color:#c0392b; font-weight:600;">${UI.escapeHtml(d.clase)}</span></div>` : ''}
            ${d.denominacion || g?.denominacion ? '' : ''}
            ${d.reivindicaciones ? `<div style="margin-top:8px;font-size:0.8125rem;"><strong>PROTECCION:</strong> <span style="color:#c0392b; font-weight:600;">Solamente</span><div style="margin-top:4px; font-size:0.75rem; color:var(--text-secondary);">LIMITACION:</div><div style="margin-top:4px;white-space:pre-wrap;background:var(--bg-main);padding:10px;border-radius:6px;border:1px solid var(--border);line-height:1.4; font-size:0.75rem;">${UI.escapeHtml(d.reivindicaciones)}</div></div>` : '<div style="margin-top:8px;font-size:0.8125rem;color:var(--text-tertiary);">Sin reivindicaciones cargadas (puede ser acta antigua o figurativa sin texto). Ver grilla arriba para datos principales.</div>'}
          </div>
          <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap;">
            <button class="btn btn--secondary btn--sm" onclick="Detalle.abrirEnINPI('${d.acta}', '${UI.escapeHtml(d.denominacion|| (g?g.denominacion:''))}')">Abrir grilla completa en INPI ↗</button>
            <a href="${d.expediente_url || `https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${d.acta}`}" target="_blank" class="btn btn--ghost btn--sm">Ver protección INPI ↗</a>
            <button class="btn btn--ghost btn--sm" onclick="navigator.clipboard.writeText('${d.acta}');UI.toast('Acta copiada','success')">Copiar acta</button>
          </div>
          <div style="margin-top:8px;font-size:0.7rem;color:var(--text-tertiary);">Persistido: ${d.fetched_at ? new Date(d.fetched_at).toLocaleString('es-AR') : '—'} · Fuente: ${UI.escapeHtml(d.fuente || 'portaltramites.inpi.gob.ar + WS INPI')} · Cache 30 días en Supabase</div>
        </div>
      </div>
    `;
  }
  function abrirEnINPI(acta, denominacion) {
    const directUrl = `${window.location.origin}${window.location.pathname}?acta=${encodeURIComponent(acta)}`;
    const w = window.open(directUrl, '_blank');
    if (!w) window.open(directUrl, '_blank');
    navigator.clipboard.writeText(directUrl).catch(()=>{});
    UI.toast(`Link directo copiado: ${directUrl} — abre la ficha completa con grilla (Image 2) + protección`, 'success');
  }
  return { abrir, abrirEnINPI };
})();
