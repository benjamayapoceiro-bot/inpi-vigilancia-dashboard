const Presentar = (() => {
  const TRAMITES = {
    marca_nueva:        { label: 'Marca — Nueva (1)',             tipo: 'marca' },
    marca_renovacion:   { label: 'Marca — Renovación (3)',        tipo: 'marca' },
    modelo_nuevo:       { label: 'Modelo Industrial — Nuevo (16)', tipo: 'modelo' },
    modelo_renovacion:  { label: 'Modelo Industrial — Renovación (18)', tipo: 'modelo' },
    patente_invencion:  { label: 'Patente — Invención (21)',      tipo: 'patente' },
    patente_utilidad:   { label: 'Modelo de Utilidad (22)',        tipo: 'patente' },
  };
  const CLASE_MAX = { marca: 45, modelo: 32 };
  const COBAR = { patente_invencion: '311000', patente_utilidad: '311800' };
  const IDPROV = '1';
  let titIdx = 0;

  function render() {
    const view = document.getElementById('view-presentar');
    if (!view) return;
    view.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom: var(--space-sm);">Presentar trámite al INPI</h3>
        <div style="font-size:0.8125rem; color:var(--text-tertiary); margin-bottom:var(--space-md);">Modo <strong>mock</strong>: genera el XML correcto (Manual Nodos INPI) sin tocar el WS real. <strong>Cada presentación requiere tu CUIT y Clave Fiscal del INPI</strong> (no se guarda, se usa solo para este trámite). Subí el poder y archivos necesarios según documentación INPI.</div>
        <div class="banner banner--warning" style="margin-bottom:16px; font-size:0.8125rem;">🔐 Este form exige CUIT/Clave del INPI en cada envío — no usamos la bóveda guardada para presentar, solo para tu comodidad al recordar CUIT. El estudio/abogado que presenta es quien pone sus credenciales aquí.</div>
        <div class="form-group" style="margin-bottom:16px;"><label class="form-label">Tipo de trámite *</label>
          <select class="form-select" id="p-tramite">${Object.entries(TRAMITES).map(([k,v]) => `<option value="${k}">${v.label}</option>`).join('')}</select>
        </div>

        <div id="p-campos-base" class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); margin-bottom:16px;">
          <div class="form-group"><label class="form-label">Denominación *</label><input class="form-input" id="p-denominacion" placeholder="ej. CASA CUMBRE"></div>
          <div class="form-group"><label class="form-label">Clase *</label><input type="number" class="form-input" id="p-clase" min="1" max="45" placeholder="36"></div>
        </div>
        <div id="p-campos-marca" class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); margin-bottom:16px; display:none;">
          <div class="form-group"><label class="form-label">Tipo de marca</label><select class="form-select" id="p-tipo"><option value="1">Denominativa (1)</option><option value="2">Mixta con logo (2)</option><option value="3">Figurativa (solo logo - 3)</option></select></div>
          <div class="form-group" id="p-logo-wrap" style="display:none"><label class="form-label">Logo (si mixta/figurativa)</label><input type="file" class="form-input" id="p-logo" accept="image/*"></div>
        </div>
        <div id="p-campos-modelo" class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); margin-bottom:16px; display:none;">
          <div class="form-group"><label class="form-label">SubClase *</label><input type="number" class="form-input" id="p-subclase" min="1" placeholder="1"></div>
        </div>
        <div id="p-campos-patente" class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); margin-bottom:16px; display:none;">
          <div class="form-group"><label class="form-label">Código de arancel *</label><input type="number" class="form-input" id="p-cod-arancel" placeholder="311000"></div>
          <div class="form-group"><label class="form-label">Cantidad reivindicaciones</label><input type="number" class="form-input" id="p-cantidad" value="10" min="1"></div>
          <div class="form-group"><label class="form-label">Examen de fondo</label><select class="form-select" id="p-examen-fondo"><option value="NO">NO</option><option value="SI">SI</option></select></div>
          <div class="form-group"><label class="form-label">Publicación anticipada</label><select class="form-select" id="p-pub-anticipada"><option value="NO">NO</option><option value="SI">SI</option></select></div>
        </div>
        <div id="p-campos-renov" class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr)); margin-bottom:16px; display:none;">
          <div class="form-group"><label class="form-label">Acta antecedente *</label><input type="number" class="form-input" id="p-acta-antecedente" placeholder="3012345"></div>
          <div class="form-group" id="p-nro-renov-wrap" style="display:none"><label class="form-label">N° renovación *</label><input type="number" class="form-input" id="p-nro-renovacion" min="1" placeholder="1"></div>
        </div>

        <div style="margin-bottom:16px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
            <div style="font-weight:600; font-size:0.875rem;">👥 Titulares <span style="font-weight:400;color:var(--text-tertiary);">(suma de porcentajes debe dar 100%)</span></div>
            <span id="p-suma" style="font-weight:600; font-size:0.875rem;"></span>
          </div>
          <div id="p-titulares"></div>
          <button class="btn btn--ghost btn--sm" id="p-agregar-titular" style="margin-top:8px;">＋ Agregar titular</button>
        </div>

        <div class="form-group" style="margin-bottom:8px;"><label class="form-label">Productos / Observaciones</label><input class="form-input" id="p-obs" placeholder="Productos o naturaleza del trámite..."></div>

        <div style="margin-top:16px; padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--bg-main);">
          <div style="font-weight:600; font-size:0.875rem; margin-bottom:8px;">🔑 Credenciales INPI para esta presentación (obligatorias cada vez)</div>
          <div class="form-alta" style="grid-template-columns: 1fr 1fr;">
            <div class="form-group"><label class="form-label">CUIT INPI (DatosUsuario) *</label><input class="form-input" id="p-cuit-inpi" placeholder="Tu CUIT de portaltramites.inpi.gob.ar"></div>
            <div class="form-group"><label class="form-label">Clave Fiscal INPI *</label><input type="password" class="form-input" id="p-clave-inpi" placeholder="••••••"></div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);">No se guarda ni se loguea — se usa solo para firmar este trámite.</div>
        </div>

        <div style="margin-top:16px; padding:12px; border:1px solid var(--border); border-radius:8px;">
          <div style="font-weight:600; font-size:0.875rem; margin-bottom:8px;">📎 Poder y documentación adicional (según Manual Nodos INPI)</div>
          <div class="form-group"><label class="form-label">Poder (PDF/JPG) — si actuás como apoderado/agente</label><input type="file" class="form-input" id="p-poder" accept=".pdf,.jpg,.jpeg,.png"></div>
          <div class="form-group" style="margin-top:8px;"><label class="form-label">Otros archivos — podés subir varios (en modelos: dibujos + figura obligatorios)</label><input type="file" class="form-input" id="p-docs" accept=".pdf,.jpg,.jpeg,.png" multiple></div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:6px;">Documentación viaja como <code>base64</code> en <code>Documentacion</code> con <code>idIndice</code> según Excel INPI. En modelos se exige dibujos (idIndice 9/10) y figura uno (idIndice 1037); en patentes el índice es 25.</div>
        </div>

        <div class="form-group" style="margin-top:16px;"><label class="form-label"><input type="checkbox" id="p-confirm"> Confirmo que revisé los datos y asumo responsabilidad legal por esta presentación (Ley 22.362)</label></div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:12px;">
          <button class="btn btn--secondary" id="p-generar-xml">📄 Generar XML (presentar manual)</button>
          <button class="btn btn--primary" id="p-enviar-directo">📨 Enviar directo al INPI</button>
          <button class="btn btn--ghost btn--sm" id="p-ver-preview">👁️ Vista previa</button>
        </div>
        <pre id="p-preview" style="display:none; margin-top:16px; padding:12px; background:var(--bg-main); border:1px solid var(--border); border-radius:8px; font-size:0.75rem; white-space:pre-wrap; max-height:320px; overflow:auto;"></pre>
        <div id="p-result" style="margin-top:12px; font-size:0.8125rem;"></div>
      </div>
    `;
    addTitular({ nomApe:'', porcentaje:100, tipoTitular:'fisica', cuit:'', email:'', domicilio:'', localidad:'', idProvincia:IDPROV });
    wire();
  }
  function val(id){ return document.getElementById(id)?.value?.trim() || ''; }
  function tramite(){ return val('p-tramite') || 'marca_nueva'; }

  function addTitular(t){
    t = t || {};
    const host = document.getElementById('p-titulares');
    const idx = titIdx++;
    const row = document.createElement('div');
    row.className = 'p-tit-row';
    row.style.cssText = 'display:grid; grid-template-columns: 1.6fr .7fr .8fr 1fr 1fr 1.3fr 1fr .4fr; gap:6px; align-items:end; margin-bottom:6px; padding:8px; border:1px solid var(--border); border-radius:8px; background:var(--bg-main);';
    row.innerHTML = `
      <div class="form-group"><label class="form-label">Nombre / Razón social *</label><input class="form-input" id="t-nom-${idx}" placeholder="Juan Pérez"></div>
      <div class="form-group"><label class="form-label">Tipo *</label><select class="form-select" id="t-tipo-${idx}"><option value="fisica">Física</option><option value="juridica">Jurídica</option></select></div>
      <div class="form-group"><label class="form-label">% *</label><input type="number" class="form-input" id="t-pct-${idx}" min="0" max="100" step="1" value="${t.porcentaje ?? 100}" placeholder="50"></div>
      <div class="form-group"><label class="form-label">CUIT *</label><input class="form-input" id="t-cuit-${idx}" value="${UI.escapeHtml(t.cuit||'')}" placeholder="20458255297"></div>
      <div class="form-group"><label class="form-label">Email *</label><input class="form-input" id="t-mail-${idx}" value="${UI.escapeHtml(t.email||'')}" placeholder="titular@ejemplo.com"></div>
      <div class="form-group"><label class="form-label">Domicilio real *</label><input class="form-input" id="t-dom-${idx}" value="${UI.escapeHtml(t.domicilio||'')}" placeholder="Calle 123"></div>
      <div class="form-group"><label class="form-label">Localidad *</label><input class="form-input" id="t-loc-${idx}" value="${UI.escapeHtml(t.localidad||'')}" placeholder="CABA"></div>
      <div class="form-group" style="display:none;"><label class="form-label">Prov.</label><input type="number" class="form-input" id="t-prov-${idx}" value="${t.idProvincia || IDPROV}"></div>
      <div><button class="btn btn--ghost btn--sm" data-del="${idx}">✕</button></div>
    `;
    if (t.tipoTitular === 'juridica') row.querySelector(`#t-tipo-${idx}`).value = 'juridica';
    row.querySelector('[data-del]').addEventListener('click', (e)=>{ e.preventDefault(); const all=host.querySelectorAll('.p-tit-row'); if(all.length<=1){ UI.toast('Al menos un titular es obligatorio','error'); return; } row.remove(); updateSuma(); });
    ['t-pct','t-cuit'].forEach(p=>{ row.querySelector(`#${p}-${idx}`).addEventListener('input', updateSuma); });
    host.appendChild(row);
    updateSuma();
  }

  function updateSuma(){
    const rows = document.querySelectorAll('.p-tit-row');
    let suma = 0, cuits = new Set(), dupe = false;
    rows.forEach(r=>{
      const pct = parseFloat(r.querySelector('[id^="t-pct-"]')?.value) || 0;
      const cuit = r.querySelector('[id^="t-cuit-"]')?.value.trim();
      suma += pct;
      if (cuit){ if (cuits.has(cuit)) dupe = true; cuits.add(cuit); }
    });
    const el = document.getElementById('p-suma');
    if (!el) return;
    const ok = Math.abs(suma-100) < 0.01;
    el.textContent = `${suma}% ${dupe ? '⚠ CUIT repetido' : (ok ? '✓' : '→ debe dar 100')}`;
    el.style.color = dupe ? 'var(--danger)' : (ok ? 'var(--success)' : 'var(--warning)');
    return { suma, ok, dupe };
  }

  function leerTitulares(){
    const rows = document.querySelectorAll('.p-tit-row');
    const out = [];
    rows.forEach(r=>{
      const i = r.querySelector('[data-del]').dataset.del;
      out.push({
        nomApe: r.querySelector(`#t-nom-${i}`)?.value.trim(),
        tipoTitular: r.querySelector(`#t-tipo-${i}`)?.value || 'fisica',
        porcentaje: parseFloat(r.querySelector(`#t-pct-${i}`)?.value) || 0,
        cuit: r.querySelector(`#t-cuit-${i}`)?.value.trim(),
        email: r.querySelector(`#t-mail-${i}`)?.value.trim(),
        domicilio: r.querySelector(`#t-dom-${i}`)?.value.trim(),
        localidad: r.querySelector(`#t-loc-${i}`)?.value.trim(),
        idProvincia: r.querySelector(`#t-prov-${i}`)?.value || IDPROV,
      });
    });
    return out;
  }

  function validar(){
    const T = tramite();
    const cfg = TRAMITES[T];
    const suma = updateSuma();
    if (suma.dupe) throw new Error('Hay CUIT repetido entre titulares');
    if (!suma.ok) throw new Error('La suma de porcentajes debe dar 100%');
    const titulares = leerTitulares();
    if (!titulares.length) throw new Error('Se requiere al menos un titular');
    titulares.forEach(t=>{ if(!t.nomApe||!t.cuit||!t.email||!t.domicilio||!t.localidad) throw new Error('Cada titular necesita nombre, CUIT, email, domicilio y localidad'); });
    if (!val('p-denominacion')) throw new Error('Denominación obligatoria');
    if (cfg.tipo === 'marca'){ if (!val('p-clase')) throw new Error('Clase obligatoria'); if (parseInt(val('p-clase'))>CLASE_MAX.marca) throw new Error('Clase de marca: 1–45'); }
    if (cfg.tipo === 'modelo'){ if (!val('p-clase') || parseInt(val('p-clase'))<1 || parseInt(val('p-clase'))>CLASE_MAX.modelo) throw new Error('Clase de modelo: 1–32'); if (!val('p-subclase')) throw new Error('SubClase obligatoria'); }
    if (T==='modelo_renovacion' && !val('p-nro-renovacion')) throw new Error('N° de renovación obligatorio en modelos');
    if (T==='marca_renovacion' || T==='modelo_renovacion'){ if (!val('p-acta-antecedente')) throw new Error('Acta antecedente obligatoria en renovaciones'); }
    if (cfg.tipo === 'patente'){ if (!val('p-cod-arancel')) throw new Error('Código de arancel obligatorio'); }
    if (!val('p-cuit-inpi') || !val('p-clave-inpi')) throw new Error('CUIT y Clave INPI son obligatorios para cada presentación');
  }

  async function filesToBase64List(inputId){
    const inp = document.getElementById(inputId);
    if (!inp || !inp.files.length) return [];
    const out = [];
    for (const f of inp.files) {
      const b64 = await UI.fileToBase64(f);
      out.push({ nombre: f.name, base64: b64.split(',')[1] || b64, mime: f.type });
    }
    return out;
  }

  async function buildPayload(){
    const T = tramite();
    const titulares = leerTitulares();
    const poderList = await filesToBase64List('p-poder');
    const docsList = await filesToBase64List('p-docs');
    const p = {
      tramite: T,
      denominacion: val('p-denominacion'),
      titulares,
      observaciones: val('p-obs'),
      cuitInpi: val('p-cuit-inpi'),
      claveInpi: val('p-clave-inpi'),
      poderBase64: poderList[0]?.base64 || null,
      poderNombre: poderList[0]?.nombre || null,
      docs: docsList,
    };
    if (TRAMITES[T].tipo === 'marca'){ p.clase = parseInt(val('p-clase')); p.tipo = val('p-tipo'); const f=document.getElementById('p-logo')?.files[0]; if(f) p.logoBase64 = await UI.fileToBase64(f); }
    if (T==='marca_renovacion') p.actaAntecedente = parseInt(val('p-acta-antecedente'));
    if (TRAMITES[T].tipo === 'modelo'){ p.clase = parseInt(val('p-clase')); p.subClase = parseInt(val('p-subclase')); }
    if (T==='modelo_renovacion'){ p.actaAntecedente = parseInt(val('p-acta-antecedente')); p.nroRenovacion = parseInt(val('p-nro-renovacion')); }
    if (TRAMITES[T].tipo === 'patente'){ p.codArancel = val('p-cod-arancel'); p.cantidad = parseInt(val('p-cantidad')) || 10; p.examenFondo = val('p-examen-fondo')==='SI'; p.publicacionAnticipada = val('p-pub-anticipada')==='SI'; }
    return p;
  }

  async function llamarEndpoint(){
    const payload = await buildPayload();
    const cfg = window.APP_CONFIG.supabase;
    const session = await Auth.getSession();
    const token = session?.access_token || cfg.anonKey;
    const resp = await fetch(`${cfg.url}/functions/v1/inpi-presentar`, { method:'POST', headers:{ 'Content-Type':'application/json', apikey:cfg.anonKey, Authorization:`Bearer ${token}` }, body: JSON.stringify(payload) });
    return resp.json();
  }

  async function wire(){
    const T = () => val('p-tramite');
    document.getElementById('p-tramite')?.addEventListener('change', ()=>{
      const cfg = TRAMITES[T()];
      document.getElementById('p-campos-marca').style.display = cfg.tipo==='marca' ? 'grid':'none';
      document.getElementById('p-campos-modelo').style.display = cfg.tipo==='modelo' ? 'grid':'none';
      document.getElementById('p-campos-patente').style.display = cfg.tipo==='patente' ? 'grid':'none';
      const rv = document.getElementById('p-campos-renov'); rv.style.display = (T()==='marca_renovacion'||T()==='modelo_renovacion') ? 'grid':'none';
      document.getElementById('p-nro-renov-wrap').style.display = T()==='modelo_renovacion'?'block':'none';
      const clase = document.getElementById('p-clase'); if(clase){ clase.max = CLASE_MAX[TRAMITES[T()].tipo]; }
      const car = document.getElementById('p-cod-arancel'); if(car) car.value = COBAR[T()] || '';
    });
    document.querySelector('#p-tramite')?.dispatchEvent(new Event('change'));
    document.getElementById('p-tipo')?.addEventListener('change', ()=>{ document.getElementById('p-logo-wrap').style.display = (val('p-tipo')==='2'||val('p-tipo')==='3')?'block':'none'; });
    document.getElementById('p-agregar-titular')?.addEventListener('click', (e)=>{ e.preventDefault(); addTitular(); });
    document.getElementById('p-ver-preview')?.addEventListener('click', async ()=>{ try{ validar(); const data = await llamarEndpoint(); const pre=document.getElementById('p-preview'); pre.style.display='block'; pre.textContent = data.preview || JSON.stringify(data,null,2); if(!data.ok) UI.toast(data.error||'Error','error'); } catch(e){ UI.toast(e.message,'error'); } });
    document.getElementById('p-generar-xml')?.addEventListener('click', async ()=>{
      try{
        validar();
        const data = await llamarEndpoint();
        if(!data.ok) throw new Error(data.error || 'Error generando XML');
        const blob=new Blob([data.preview],{type:'text/xml'});
        const a=document.createElement('a'); a.href=URL.createObjectURL(blob);
        a.download=`inpi-${(val('p-tramite')||'marca-nueva')}-${(val('p-denominacion')||'trámite').replace(/\s+/g,'_')}.xml`;
        a.click();
        UI.toast('XML descargado','success');
        const pre=document.getElementById('p-preview'); pre.style.display='block'; pre.textContent=data.preview;
        document.getElementById('p-result').innerHTML = `<span style="color:var(--success)">✓ XML mock generado (Acta simulada ${UI.escapeHtml(data.acta||'—')})</span>`;
      } catch(e){ UI.toast(e.message,'error'); }
    });
    document.getElementById('p-enviar-directo')?.addEventListener('click', async ()=>{
      if(!document.getElementById('p-confirm')?.checked){ UI.toast('Tenés que confirmar la responsabilidad legal','error'); return; }
      const ok = await UI.confirm('¿Enviar directo al INPI?', 'Esto genera un trámite con efecto legal real. Confirma que CUIT/Clave, titulares y archivos son correctos.');
      if(!ok) return;
      try{
        validar();
        const btn=document.getElementById('p-enviar-directo'); btn.disabled=true; btn.textContent='Enviando...';
        const data = await llamarEndpoint();
        const out=document.getElementById('p-result');
        if(data.ok){ out.innerHTML=`<span style="color:var(--success)">✓ Presentada (mock): Acta ${UI.escapeHtml(data.acta||'—')}</span>`; UI.toast('Trámite presentado (mock)','success'); }
        else{ out.innerHTML=`<span style="color:var(--danger)">✗ Error: ${UI.escapeHtml(data.error||'desconocido')}</span>`; UI.toast('Error presentando','error'); }
      } catch(e){ UI.toast('Error: '+e.message,'error'); } finally{ const b=document.getElementById('p-enviar-directo'); if(b){b.disabled=false; b.textContent='📨 Enviar directo al INPI';} }
    });
  }
  return { render };
})();