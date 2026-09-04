const Presentar = (() => {
  function render() {
    const view = document.getElementById('view-presentar');
    if (!view) return;
    view.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom: var(--space-sm);">Presentar marca al INPI</h3>
        <div style="font-size:0.8125rem; color:var(--text-tertiary); margin-bottom:var(--space-md);">Dos modos: <strong>Generar XML</strong> para presentar manual, o <strong>Enviar directo</strong> vía WS. <strong>Cada presentación requiere tu CUIT y Clave Fiscal del INPI</strong> (no se guarda, se usa solo para este trámite). Subí el poder y archivos necesarios según documentación INPI.</div>
        <div class="banner banner--warning" style="margin-bottom:16px; font-size:0.8125rem;">🔐 Este form exige CUIT/Clave del INPI en cada envío — no usamos la bóveda guardada para presentar, solo para tu comodidad al recordar CUIT. El estudio/abogado que presenta es quien pone sus credenciales aquí.</div>
        <div class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr));">
          <div class="form-group"><label class="form-label">Denominación *</label><input class="form-input" id="p-denominacion" placeholder="ej. CASA CUMBRE"></div>
          <div class="form-group"><label class="form-label">Clase *</label><input type="number" class="form-input" id="p-clase" min="1" max="45" placeholder="36"></div>
          <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="p-tipo"><option value="1">Denominativa (1)</option><option value="2">Mixta con logo (2)</option><option value="3">Figurativa (solo logo - 3)</option></select></div>
          <div class="form-group"><label class="form-label">Titular *</label><input class="form-input" id="p-titular" placeholder="ej. Juan Pérez"></div>
          <div class="form-group"><label class="form-label">CUIT Titular *</label><input class="form-input" id="p-cuit" placeholder="20450129896"></div>
          <div class="form-group"><label class="form-label">Email titular *</label><input class="form-input" id="p-email" placeholder="titular@ejemplo.com"></div>
          <div class="form-group"><label class="form-label">Domicilio real *</label><input class="form-input" id="p-dom" placeholder="Calle 123, altura"></div>
          <div class="form-group"><label class="form-label">Localidad *</label><input class="form-input" id="p-loc" placeholder="CABA"></div>
          <div class="form-group"><label class="form-label">Productos / Observaciones</label><input class="form-input" id="p-obs" placeholder="Servicios inmobiliarios clase 36..."></div>
          <div class="form-group" id="p-logo-wrap" style="display:none"><label class="form-label">Logo (si mixta/figurativa)</label><input type="file" class="form-input" id="p-logo" accept="image/*"></div>
        </div>
        <div style="margin-top:16px; padding:12px; border:1px solid var(--border); border-radius:8px; background:var(--bg-main);">
          <div style="font-weight:600; font-size:0.875rem; margin-bottom:8px;">🔑 Credenciales INPI para esta presentación (obligatorias cada vez)</div>
          <div class="form-alta" style="grid-template-columns: 1fr 1fr;">
            <div class="form-group"><label class="form-label">CUIT INPI (DatosUsuario) *</label><input class="form-input" id="p-cuit-inpi" placeholder="Tu CUIT de portaltramites.inpi.gob.ar"></div>
            <div class="form-group"><label class="form-label">Clave Fiscal INPI *</label><input type="password" class="form-input" id="p-clave-inpi" placeholder="••••••"></div>
          </div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);">No se guarda en la bóveda para este envío — se usa solo para firmar este trámite. Si querés guardarla para recordar, hacelo en Admin → Bóveda.</div>
        </div>
        <div style="margin-top:16px; padding:12px; border:1px solid var(--border); border-radius:8px;">
          <div style="font-weight:600; font-size:0.875rem; margin-bottom:8px;">📎 Poder y documentación adicional (según Manual Nodos INPI)</div>
          <div class="form-group"><label class="form-label">Poder (PDF/JPG) — si actuás como apoderado/agente</label><input type="file" class="form-input" id="p-poder" accept=".pdf,.jpg,.jpeg,.png"></div>
          <div class="form-group" style="margin-top:8px;"><label class="form-label">Otros archivos (declaración jurada, comprobantes, etc.) — podés subir varios</label><input type="file" class="form-input" id="p-docs" accept=".pdf,.jpg,.jpeg,.png" multiple></div>
          <div style="font-size:0.75rem;color:var(--text-tertiary);margin-top:6px;">Documentación viaja como <code>base64</code> en <code>Documentacion</code> con <code>idIndice</code> según Excel INPI (poder → idIndice 24, otros según trámite). Ver <em>manualnodosinpioficial</em> pág. 7-8.</div>
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
    wire();
  }
  function val(id){ return document.getElementById(id)?.value?.trim() || ''; }
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
  function buildXML(){
    const denom = val('p-denominacion'); const clase = val('p-clase'); const titular = val('p-titular');
    const cuit = val('p-cuit'); const email = val('p-email'); const dom = val('p-dom'); const loc = val('p-loc'); const obs = val('p-obs');
    const cuitInpi = val('p-cuit-inpi'); const claveInpi = val('p-clave-inpi');
    const tipo = val('p-tipo');
    if(!clase||!titular||!cuit||!email) throw new Error('Faltan campos obligatorios del titular');
    if(tipo!=='3' && !denom) throw new Error('Denominación requerida (salvo Figurativa)');
    if(!cuitInpi || !claveInpi) throw new Error('CUIT y Clave INPI son obligatorios para cada presentación');
    const poderInfo = document.getElementById('p-poder')?.files[0] ? ` + poder: ${document.getElementById('p-poder').files[0].name}` : '';
    return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/"><soap:Body><tem:Ingresar_MarcasNuevas><tem:MarcaNueva><tem:Solicitud><tem:TipoS>${tipo==='3'?'5':(tipo==='2'?'2':'1')}</tem:TipoS>${denom?`<tem:Denominacion>${UI.escapeHtml(denom)}</tem:Denominacion>`:''}<tem:Clase>${clase}</tem:Clase></tem:Solicitud><tem:Titulares><tem:Titulares><tem:NomApe>${UI.escapeHtml(titular)}</tem:NomApe><tem:Porcentaje>100</tem:Porcentaje><tem:Nro_Cuit>${cuit}</tem:Nro_Cuit><tem:Email>${UI.escapeHtml(email)}</tem:Email><tem:Id_Titular_Tipo>1</tem:Id_Titular_Tipo><tem:Genero>1</tem:Genero><tem:Tipo>1</tem:Tipo><tem:Domicilios><tem:Domicilios><tem:Id_Tipo_Domicilio>1</tem:Id_Tipo_Domicilio><tem:Id_Pais>9</tem:Id_Pais><tem:idProvincia>1</tem:idProvincia><tem:Localidad>${UI.escapeHtml(loc)}</tem:Localidad><tem:Domicilio>${UI.escapeHtml(dom)}</tem:Domicilio><tem:Numero>100</tem:Numero><tem:Cod_Postal>1000</tem:Cod_Postal></tem:Domicilios><tem:Domicilios><tem:Id_Tipo_Domicilio>2</tem:Id_Tipo_Domicilio><tem:Id_Pais>9</tem:Id_Pais><tem:idProvincia>1</tem:idProvincia><tem:Localidad>${UI.escapeHtml(loc)}</tem:Localidad><tem:Domicilio>${UI.escapeHtml(dom)}</tem:Domicilio><tem:Numero>100</tem:Numero></tem:Domicilios></tem:Domicilios></tem:Titulares></tem:Titulares><tem:Proteccion><tem:Tipo_Proteccion>S</tem:Tipo_Proteccion><tem:Observaciones>${UI.escapeHtml(obs||'Productos de la clase.')}</tem:Observaciones></tem:Proteccion><tem:Documentacion><!-- poder${poderInfo} viaja como base64 idIndice 24 si se adjunta --></tem:Documentacion><tem:DatosUsuario><tem:Cuit>${cuitInpi}</tem:Cuit><tem:Activa>true</tem:Activa><tem:Clave>${UI.escapeHtml(claveInpi)}</tem:Clave></tem:DatosUsuario></tem:MarcaNueva></tem:Ingresar_MarcasNuevas></soap:Body></soap:Envelope>`;
  }
  async function wire(){
    const tipoSel = document.getElementById('p-tipo');
    tipoSel?.addEventListener('change', ()=>{ document.getElementById('p-logo-wrap').style.display = (tipoSel.value==='2'||tipoSel.value==='3')?'block':'none'; });
    document.getElementById('p-ver-preview')?.addEventListener('click', ()=>{ try{ const xml=buildXML(); const pre=document.getElementById('p-preview'); pre.style.display='block'; pre.textContent=xml; } catch(e){ UI.toast(e.message,'error'); } });
    document.getElementById('p-generar-xml')?.addEventListener('click', async ()=>{ try{ const xml=buildXML(); const poder = await filesToBase64List('p-poder'); const docs = await filesToBase64List('p-docs'); let extra = ''; if(poder.length) extra+=`\n<!-- Poder: ${poder[0].nombre} base64 idIndice 24 -->`; if(docs.length) extra+=`\n<!-- Docs: ${docs.map(d=>d.nombre).join(', ')} -->`; const full = xml.replace('</tem:Documentacion>', extra+'\n</tem:Documentacion>'); const blob=new Blob([full],{type:'text/xml'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`inpi-marca-${(val('p-denominacion')||'figurativa').replace(/\s+/g,'_')}.xml`; a.click(); UI.toast('XML descargado'+(poder.length||docs.length?' con adjuntos referenciados':''),'success'); const pre=document.getElementById('p-preview'); pre.style.display='block'; pre.textContent=full; } catch(e){ UI.toast(e.message,'error'); } });
    document.getElementById('p-enviar-directo')?.addEventListener('click', async ()=>{
      if(!document.getElementById('p-confirm')?.checked){ UI.toast('Tenés que confirmar la responsabilidad legal','error'); return; }
      const ok = await UI.confirm('¿Enviar directo al INPI?', 'Esto genera un trámite con efecto legal real. Confirma que CUIT/Clave y archivos son correctos.');
      if(!ok) return;
      try{
        const btn=document.getElementById('p-enviar-directo'); btn.disabled=true; btn.textContent='Enviando...';
        let logoB64=null; const f=document.getElementById('p-logo')?.files[0]; if(f) logoB64=await UI.fileToBase64(f);
        const poderList = await filesToBase64List('p-poder');
        const docsList = await filesToBase64List('p-docs');
        const cfg=window.APP_CONFIG.supabase;
        const session = await Auth.getSession();
        const token = session?.access_token || cfg.anonKey;
        const resp=await fetch(`${cfg.url}/functions/v1/inpi-presentar`,{method:'POST', headers:{'Content-Type':'application/json', apikey:cfg.anonKey, Authorization: `Bearer ${token}`}, body:JSON.stringify({denominacion:val('p-denominacion'), clase:parseInt(val('p-clase')), titular:val('p-titular'), cuit:val('p-cuit'), email:val('p-email'), domicilio:val('p-dom'), localidad:val('p-loc'), observaciones:val('p-obs'), tipo:val('p-tipo'), cuitInpi:val('p-cuit-inpi'), claveInpi:val('p-clave-inpi'), logoBase64:logoB64, poderBase64: poderList[0]?.base64 || null, poderNombre: poderList[0]?.nombre || null, docs: docsList})});
        const data=await resp.json();
        const out=document.getElementById('p-result');
        if(data.ok){ out.innerHTML=`<span style="color:var(--success)">✓ Presentada: Acta ${UI.escapeHtml(data.acta||'—')} — <a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Grilla?acta=${encodeURIComponent(data.acta)}" target="_blank" style="text-decoration:underline;">Ver en INPI ↗</a></span>`; UI.toast('Marca presentada','success'); }
        else{ out.innerHTML=`<span style="color:var(--danger)">✗ Error: ${UI.escapeHtml(data.error||'desconocido')}</span>`; UI.toast('Error presentando','error'); }
      } catch(e){ UI.toast('Error: '+e.message,'error'); } finally{ const b=document.getElementById('p-enviar-directo'); if(b){b.disabled=false; b.textContent='📨 Enviar directo al INPI';} }
    });
  }
  return { render };
})();
