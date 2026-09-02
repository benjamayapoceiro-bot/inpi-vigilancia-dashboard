const Detalle = (() => {
  async function abrir(acta) {
    if (!acta) return;
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;';
    modal.innerHTML = `<div class="card" style="max-width:640px;width:100%;max-height:85vh;overflow:auto;position:relative;"><button onclick="this.closest('.modal-overlay').remove()" style="position:absolute;top:12px;right:12px;" class="btn btn--ghost btn--sm">✕</button><div id="detalle-body" style="padding-top:10px;">Cargando acta ${UI.escapeHtml(acta)}...</div></div>`;
    modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.remove(); });
    document.body.appendChild(modal);
    const body = modal.querySelector('#detalle-body');
    try {
      const cached = await API.getDetalleActa(acta);
      if (cached) {
        renderDetalle(body, cached, true);
        if (Date.now() - new Date(cached.fetched_at).getTime() > 30*24*3600*1000) {
          fetchFresco(acta, body);
        }
        return;
      }
      await fetchFresco(acta, body);
    } catch (e) {
      body.innerHTML = `<div style="color:var(--danger)">Error cargando detalle: ${UI.escapeHtml(e.message)}<br><a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(acta)}" target="_blank" style="text-decoration:underline;">Abrir en INPI ↗</a></div>`;
    }
  }
  async function fetchFresco(acta, body) {
    body.innerHTML = `Consultando INPI para acta ${UI.escapeHtml(acta)}...`;
    const cfg = window.APP_CONFIG.supabase;
    const r = await fetch(`${cfg.url}/functions/v1/inpi-detalle`, { method:'POST', headers:{'Content-Type':'application/json', apikey: cfg.anonKey}, body: JSON.stringify({acta})});
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'error INPI');
    renderDetalle(body, j.data, !!j.cached);
    if (!j.cached) {
      try { await API.saveDetalleActa(j.data); } catch {}
    }
  }
  function renderDetalle(el, d, cached) {
    el.innerHTML = `
      <div style="display:flex;gap:16px;flex-wrap:wrap;align-items:flex-start;">
        ${d.logo_url ? `<img src="${d.logo_url}" alt="logo" style="max-width:180px;max-height:180px;object-fit:contain;border:1px solid var(--border);border-radius:8px;background:#fff;padding:8px;" onerror="this.style.display='none'">` : '<div style="width:180px;height:120px;display:flex;align-items:center;justify-content:center;background:var(--bg-main);border:1px dashed var(--border);border-radius:8px;color:var(--text-tertiary);font-size:0.75rem;">Sin logo</div>'}
        <div style="flex:1;min-width:260px;">
          <div style="font-size:0.75rem;color:var(--text-tertiary);">Acta ${UI.escapeHtml(d.acta)} ${cached ? '<span class="badge badge--info">cache</span>' : '<span class="badge badge--success">fresco INPI</span>'} ${d.clase ? `<span class="badge badge--primary">Clase ${d.clase}</span>` : ''} ${d.estado ? `<span class="badge">${UI.escapeHtml(d.estado)}</span>` : ''}</div>
          <div style="font-weight:700;font-size:1.05rem;margin:6px 0;">${UI.escapeHtml(d.denominacion || '(marca figurativa / sin denominación)')}</div>
          <div style="font-size:0.8125rem;color:var(--text-secondary);">Titular: ${UI.escapeHtml(d.titular || '—')}</div>
          ${d.reivindicaciones ? `<div style="margin-top:10px;font-size:0.8125rem;"><strong>Reivindicaciones / productos:</strong><div style="margin-top:4px;white-space:pre-wrap;background:var(--bg-main);padding:8px;border-radius:6px;border:1px solid var(--border);">${UI.escapeHtml(d.reivindicaciones)}</div></div>` : ''}
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
            <a href="${d.expediente_url || `https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${d.acta}`}" target="_blank" class="btn btn--secondary btn--sm">Abrir en INPI ↗</a>
            <button class="btn btn--ghost btn--sm" onclick="navigator.clipboard.writeText('${d.acta}');UI.toast('Acta copiada','success')">Copiar acta</button>
          </div>
          <div style="margin-top:8px;font-size:0.7rem;color:var(--text-tertiary);">Actualizado: ${d.fetched_at ? new Date(d.fetched_at).toLocaleString('es-AR') : '—'} — ${UI.escapeHtml(d.fuente || 'portaltramites.inpi.gob.ar')}</div>
        </div>
      </div>
    `;
  }
  return { abrir };
})();
