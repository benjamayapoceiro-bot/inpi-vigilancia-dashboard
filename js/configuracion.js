const Configuracion = (() => {
  let cfg = null, estudioId = null;
  async function currentEstudio() {
    if (typeof Auth === 'undefined') return null;
    const { estudioId: eid, rol } = await Auth.getPerfilConEstudio().catch(() => ({}));
    if (rol === 'admin') {
      const preview = new URLSearchParams(window.location.search).get('preview_estudio');
      return { estudioId: preview || eid, rol, readOnly: !preview && rol === 'admin' };
    }
    return { estudioId: eid, rol, readOnly: false };
  }
  async function render() {
    const view = document.getElementById('view-configuracion');
    if (!view) return;
    const ctx = await currentEstudio();
    estudioId = ctx?.estudioId;
    if (!estudioId) { view.innerHTML = `<div class="card"><h3>Configuración</h3><p style="color:var(--text-tertiary)">Iniciá sesión con tu estudio para personalizar marca.</p></div>`; return; }
    try {
      const sb = Auth.sb();
      const { data } = await sb.from('estudios_config').select('*').eq('estudio_id', estudioId).maybeSingle();
      cfg = data || { estudio_id: estudioId, brand_preset_id: 'fons' };
    } catch { cfg = { estudio_id: estudioId, brand_preset_id: 'fons' }; }
    const presets = Branding.PRESETS;
    view.innerHTML = `
      <div class="card"><h3>⚙️ Configuración del estudio — marca blanca</h3>
      <p style="font-size:0.8125rem;color:var(--text-tertiary)">Tu logo y colores se ven en header, login y PDFs. El admin siempre ve Fons + vista previa.</p></div>
      <div class="card" style="margin-top:12px;"><h4>Logo del estudio</h4>
        <div style="display:flex;gap:12px;align-items:center;margin-top:8px;flex-wrap:wrap;">
          <div id="cfg-logo-preview">${cfg.brand_logo_url ? `<img src="${cfg.brand_logo_url}" style="max-width:160px;max-height:80px;object-fit:contain;background:#fff;border:1px solid var(--border);border-radius:8px;padding:6px;">` : '<span style="color:var(--text-tertiary)">Sin logo — se usa inicial</span>'}</div>
          <input type="file" id="cfg-logo-file" accept="image/*" class="form-input" style="max-width:260px;">
          <button class="btn btn--primary btn--sm" id="cfg-btn-logo">Subir logo</button>
        </div></div>
      <div class="card" style="margin-top:12px;"><h4>Nombre visible y tagline</h4>
        <div class="form-alta" style="grid-template-columns:1fr 1fr;"><div class="form-group"><label class="form-label">Nombre visible</label><input class="form-input" id="cfg-nombre" value="${UI.escapeHtml(cfg.brand_nombre_visible || '')}" placeholder="Estudio Pérez"></div>
        <div class="form-group"><label class="form-label">Tagline</label><input class="form-input" id="cfg-tagline" value="${UI.escapeHtml(cfg.brand_tagline || '')}" placeholder="Propiedad intelectual"></div></div></div>
      <div class="card" style="margin-top:12px;"><h4>Paleta (presets)</h4>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;">${Object.entries(presets).map(([id, p]) => `<button class="btn ${cfg.brand_preset_id === id ? 'btn--primary' : 'btn--secondary'} btn--sm" data-preset="${id}" style="border-left:6px solid ${p.primary}">${p.label}</button>`).join('')}</div>
        <div style="margin-top:8px;font-size:0.75rem;color:var(--text-tertiary)">Preset actual: <b>${presets[cfg.brand_preset_id]?.label || 'Fons Bordó'}</b></div></div>
      <div class="card" style="margin-top:12px;"><h4>Datos para el membrete del PDF</h4>
        <div class="form-alta" style="grid-template-columns:1fr 1fr;"><div class="form-group"><label class="form-label">Teléfono</label><input class="form-input" id="cfg-tel" value="${UI.escapeHtml(cfg.telefono || '')}" placeholder="+54 11 ..."></div>
        <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="cfg-mail" value="${UI.escapeHtml(cfg.gmail || '')}" placeholder="contacto@estudio.com"></div>
        <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Dirección</label><input class="form-input" id="cfg-dir" value="${UI.escapeHtml(cfg.direccion || '')}" placeholder="Av. ..."></div>
        <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Pie del PDF (footer)</label><input class="form-input" id="cfg-footer" value="${UI.escapeHtml(cfg.footer_pdf || '')}" placeholder="Texto al pie de cada página"></div></div></div>
      <div class="card" style="margin-top:12px;"><h4>Personalización del informe de búsqueda</h4>
        <p style="font-size:.75rem;color:var(--text-tertiary);margin:6px 0 12px;">Estos textos se aplican a los PDF que generes desde Búsqueda Previa. Podés dejarlos vacíos para usar el texto profesional predeterminado.</p>
        <div class="form-alta" style="grid-template-columns:1fr 1fr;">
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Título del informe</label><input class="form-input" id="cfg-pdf-titulo" value="${UI.escapeHtml(cfg.pdf_titulo || '')}" placeholder="Informe de búsqueda de antecedentes marcarios"></div>
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Introducción personalizada</label><textarea class="form-input" id="cfg-pdf-intro" rows="3" placeholder="Presentación del servicio y alcance del análisis...">${UI.escapeHtml(cfg.pdf_introduccion || '')}</textarea></div>
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Conclusión / recomendación predeterminada</label><textarea class="form-input" id="cfg-pdf-conclusion" rows="3" placeholder="Criterio general del estudio; se complementa con el riesgo detectado...">${UI.escapeHtml(cfg.pdf_conclusion || '')}</textarea></div>
          <div class="form-group" style="grid-column:1/-1;"><label class="form-label">Aclaración legal al pie</label><textarea class="form-input" id="cfg-pdf-disclaimer" rows="3" placeholder="Alcance, limitaciones y carácter orientativo del informe...">${UI.escapeHtml(cfg.pdf_disclaimer || '')}</textarea></div>
          <label class="form-group" style="display:flex;gap:8px;align-items:center;"><input type="checkbox" id="cfg-pdf-presupuesto" ${cfg.pdf_mostrar_presupuesto !== false ? 'checked' : ''}> Incluir presupuesto en PDF</label>
          <label class="form-group" style="display:flex;gap:8px;align-items:center;"><input type="checkbox" id="cfg-pdf-pasos" ${cfg.pdf_mostrar_proximos_pasos !== false ? 'checked' : ''}> Incluir próximos pasos</label>
        </div>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px;justify-content:flex-end;"><button class="btn btn--primary" id="cfg-btn-guardar">💾 Guardar marca</button></div>
      <div id="cfg-msg" style="font-size:0.8125rem;margin-top:8px;"></div>`;
    view.querySelectorAll('[data-preset]').forEach(b => b.addEventListener('click', () => { cfg.brand_preset_id = b.dataset.preset; const p = presets[cfg.brand_preset_id]; cfg.brand_primary = p.primary; cfg.brand_accent = p.accent; render(); Branding.applyFirm({ ...Branding.firmDefault(), name: document.getElementById('cfg-nombre')?.value || Branding.firmDefault().name, primaryColor: p.primary, accentColor: p.accent, logoUrl: cfg.brand_logo_url }); }));
    document.getElementById('cfg-btn-logo')?.addEventListener('click', subirLogo);
    document.getElementById('cfg-btn-guardar')?.addEventListener('click', guardar);
  }
  async function subirLogo() {
    const f = document.getElementById('cfg-logo-file')?.files[0];
    const msg = document.getElementById('cfg-msg');
    if (!f) { UI.toast('Elegí una imagen', 'error'); return; }
    try {
      const sb = Auth.sb();
      const path = `${estudioId}/logo.${f.name.split('.').pop() || 'png'}`;
      const { error } = await sb.storage.from('branding-estudios').upload(path, f, { upsert: true, contentType: f.type });
      if (error) throw error;
      const { data } = sb.storage.from('branding-estudios').getPublicUrl(path);
      cfg.brand_logo_url = data.publicUrl;
      document.getElementById('cfg-logo-preview').innerHTML = `<img src="${cfg.brand_logo_url}" style="max-width:160px;max-height:80px;object-fit:contain;background:#fff;border:1px solid var(--border);border-radius:8px;padding:6px;">`;
      UI.toast('Logo subido, guardá para aplicar', 'success');
    } catch (e) { msg.textContent = '✗ ' + e.message; }
  }
  async function guardar() {
    const msg = document.getElementById('cfg-msg');
    cfg.brand_nombre_visible = document.getElementById('cfg-nombre')?.value.trim() || null;
    cfg.brand_tagline = document.getElementById('cfg-tagline')?.value.trim() || null;
    cfg.telefono = document.getElementById('cfg-tel')?.value.trim() || null;
    cfg.gmail = document.getElementById('cfg-mail')?.value.trim() || null;
    cfg.direccion = document.getElementById('cfg-dir')?.value.trim() || null;
    cfg.footer_pdf = document.getElementById('cfg-footer')?.value.trim() || null;
    cfg.pdf_titulo = document.getElementById('cfg-pdf-titulo')?.value.trim() || null;
    cfg.pdf_introduccion = document.getElementById('cfg-pdf-intro')?.value.trim() || null;
    cfg.pdf_conclusion = document.getElementById('cfg-pdf-conclusion')?.value.trim() || null;
    cfg.pdf_disclaimer = document.getElementById('cfg-pdf-disclaimer')?.value.trim() || null;
    cfg.pdf_mostrar_presupuesto = !!document.getElementById('cfg-pdf-presupuesto')?.checked;
    cfg.pdf_mostrar_proximos_pasos = !!document.getElementById('cfg-pdf-pasos')?.checked;
    try {
      const sb = Auth.sb();
      const payload = { estudio_id: estudioId, brand_logo_url: cfg.brand_logo_url || null, brand_preset_id: cfg.brand_preset_id || 'fons', brand_primary: (Branding.PRESETS[cfg.brand_preset_id] || {}).primary || null, brand_accent: (Branding.PRESETS[cfg.brand_preset_id] || {}).accent || null, brand_nombre_visible: cfg.brand_nombre_visible, brand_tagline: cfg.brand_tagline, telefono: cfg.telefono, gmail: cfg.gmail, direccion: cfg.direccion, footer_pdf: cfg.footer_pdf, pdf_titulo: cfg.pdf_titulo, pdf_introduccion: cfg.pdf_introduccion, pdf_conclusion: cfg.pdf_conclusion, pdf_disclaimer: cfg.pdf_disclaimer, pdf_mostrar_presupuesto: cfg.pdf_mostrar_presupuesto, pdf_mostrar_proximos_pasos: cfg.pdf_mostrar_proximos_pasos };
      const { error } = await sb.from('estudios_config').upsert(payload, { onConflict: 'estudio_id' });
      if (error) throw error;
      msg.textContent = '✓ Marca guardada'; msg.style.color = 'var(--success)';
      await Branding.load(estudioId, 'estudio');
    } catch (e) { msg.textContent = '✗ ' + e.message; msg.style.color = 'var(--danger)'; }
  }
  return { render };
})();
