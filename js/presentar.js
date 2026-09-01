const Presentar = (() => {
  function render() {
    const view = document.getElementById('view-presentar');
    if (!view) return;
    view.innerHTML = `
      <div class="card">
        <h3 style="margin-bottom: var(--space-sm);">Presentar marca al INPI</h3>
        <div style="font-size:0.8125rem; color:var(--text-tertiary); margin-bottom:var(--space-md);">Dos modos: <strong>Generar XML</strong> para presentar manual en el portal INPI, o <strong>Enviar directo</strong> vía WS (requiere CUIT+CLAVE). Siempre con doble confirmación humana.</div>
        <div class="form-alta" style="grid-template-columns: repeat(auto-fit, minmax(200px,1fr));">
          <div class="form-group"><label class="form-label">Denominación *</label><input class="form-input" id="p-denominacion" placeholder="ej. CASA CUMBRE"></div>
          <div class="form-group"><label class="form-label">Clase *</label><input type="number" class="form-input" id="p-clase" min="1" max="45" placeholder="36"></div>
          <div class="form-group"><label class="form-label">Tipo</label><select class="form-select" id="p-tipo"><option value="1">Denominativa (1)</option><option value="2">Mixta con logo (2)</option></select></div>
          <div class="form-group"><label class="form-label">Titular *</label><input class="form-input" id="p-titular" placeholder="ej. Juan Pérez"></div>
          <div class="form-group"><label class="form-label">CUIT Titular *</label><input class="form-input" id="p-cuit" placeholder="20450129896"></div>
          <div class="form-group"><label class="form-label">Email titular *</label><input class="form-input" id="p-email" placeholder="titular@ejemplo.com"></div>
          <div class="form-group"><label class="form-label">Domicilio real *</label><input class="form-input" id="p-dom" placeholder="Calle 123"></div>
          <div class="form-group"><label class="form-label">Localidad *</label><input class="form-input" id="p-loc" placeholder="CABA"></div>
          <div class="form-group"><label class="form-label">Productos / Observaciones</label><input class="form-input" id="p-obs" placeholder="Servicios inmobiliarios..."></div>
          <div class="form-group" id="p-logo-wrap" style="display:none"><label class="form-label">Logo (si mixta)</label><input type="file" class="form-input" id="p-logo" accept="image/*"></div>
        </div>
        <div class="form-group" style="margin-top:var(--space-md);"><label class="form-label"><input type="checkbox" id="p-confirm"> Confirmo que revisé los datos y asumo responsabilidad legal por esta presentación</label></div>
        <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:var(--space-md);">
          <button class="btn btn--secondary" id="p-generar-xml">📄 Generar XML (presentar manual)</button>
          <button class="btn btn--primary" id="p-enviar-directo">📨 Enviar directo al INPI</button>
          <button class="btn btn--ghost btn--sm" id="p-ver-preview">👁️ Vista previa</button>
        </div>
        <pre id="p-preview" style="display:none; margin-top:var(--space-md); padding:var(--space-md); background:var(--bg-main); border:1px solid var(--border); border-radius:var(--radius-md); font-size:0.75rem; white-space:pre-wrap; max-height:320px; overflow:auto;"></pre>
        <div id="p-result" style="margin-top:var(--space-md); font-size:0.8125rem;"></div>
      </div>
    `;
    wire();
  }
  function val(id){ return document.getElementById(id)?.value?.trim() || ''; }
  function buildXML(){
    const denom = val('p-denominacion'); const clase = val('p-clase'); const titular = val('p-titular');
    const cuit = val('p-cuit'); const email = val('p-email'); const dom = val('p-dom'); const loc = val('p-loc'); const obs = val('p-obs');
    if(!denom||!clase||!titular||!cuit||!email) throw new Error('Faltan campos obligatorios marcados con *');
    return `<soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope" xmlns:tem="http://tempuri.org/"><soap:Body><tem:Ingresar_MarcasNuevas><tem:MarcaNueva><tem:Solicitud><tem:TipoS>1</tem:TipoS><tem:Denominacion>${UI.escapeHtml(denom)}</tem:Denominacion><tem:Clase>${clase}</tem:Clase></tem:Solicitud><tem:Titulares><tem:Titulares><tem:NomApe>${UI.escapeHtml(titular)}</tem:NomApe><tem:Porcentaje>100</tem:Porcentaje><tem:Nro_Cuit>${cuit}</tem:Nro_Cuit><tem:Email>${UI.escapeHtml(email)}</tem:Email><tem:Id_Titular_Tipo>1</tem:Id_Titular_Tipo><tem:Genero>1</tem:Genero><tem:Tipo>1</tem:Tipo><tem:Domicilios><tem:Domicilios><tem:Id_Tipo_Domicilio>1</tem:Id_Tipo_Domicilio><tem:Id_Pais>9</tem:Id_Pais><tem:idProvincia>1</tem:idProvincia><tem:Localidad>${UI.escapeHtml(loc)}</tem:Localidad><tem:Domicilio>${UI.escapeHtml(dom)}</tem:Domicilio><tem:Numero>100</tem:Numero><tem:Cod_Postal>1000</tem:Cod_Postal></tem:Domicilios><tem:Domicilios><tem:Id_Tipo_Domicilio>2</tem:Id_Tipo_Domicilio><tem:Id_Pais>9</tem:Id_Pais><tem:idProvincia>1</tem:idProvincia><tem:Localidad>${UI.escapeHtml(loc)}</tem:Localidad><tem:Domicilio>${UI.escapeHtml(dom)}</tem:Domicilio><tem:Numero>100</tem:Numero></tem:Domicilios></tem:Domicilios></tem:Titulares></tem:Titulares><tem:Proteccion><tem:Tipo_Proteccion>S</tem:Tipo_Proteccion><tem:Observaciones>${UI.escapeHtml(obs||'Productos de la clase.')}</tem:Observaciones></tem:Proteccion><tem:Documentacion/><tem:DatosUsuario><tem:Cuit>${cuit}</tem:Cuit><tem:Activa>true</tem:Activa><tem:Clave>***</tem:Clave></tem:DatosUsuario></tem:MarcaNueva></tem:Ingresar_MarcasNuevas></soap:Body></soap:Envelope>`;
  }
  async function wire(){
    const tipoSel = document.getElementById('p-tipo');
    tipoSel?.addEventListener('change', ()=>{ document.getElementById('p-logo-wrap').style.display = tipoSel.value==='2'?'block':'none'; });
    document.getElementById('p-ver-preview')?.addEventListener('click', ()=>{ try{ const xml=buildXML(); const pre=document.getElementById('p-preview'); pre.style.display='block'; pre.textContent=xml; } catch(e){ UI.toast(e.message,'error'); } });
    document.getElementById('p-generar-xml')?.addEventListener('click', async ()=>{ try{ const xml=buildXML(); const blob=new Blob([xml],{type:'text/xml'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=`inpi-marca-${val('p-denominacion').replace(/\s+/g,'_')}.xml`; a.click(); UI.toast('XML descargado','success'); const pre=document.getElementById('p-preview'); pre.style.display='block'; pre.textContent=xml; } catch(e){ UI.toast(e.message,'error'); } });
    document.getElementById('p-enviar-directo')?.addEventListener('click', async ()=>{
      if(!document.getElementById('p-confirm')?.checked){ UI.toast('Tenés que confirmar la responsabilidad legal','error'); return; }
      const ok = await UI.confirm('¿Enviar directo al INPI?', 'Esto genera un trámite con efecto legal real. Confirma que los datos son correctos.');
      if(!ok) return;
      try{
        const btn=document.getElementById('p-enviar-directo'); btn.disabled=true; btn.textContent='Enviando...';
        let logoB64=null; const f=document.getElementById('p-logo')?.files[0]; if(f) logoB64=await UI.fileToBase64(f);
        const cfg=window.APP_CONFIG.supabase;
        const resp=await fetch(`${cfg.url}/functions/v1/inpi-presentar`,{method:'POST', headers:{'Content-Type':'application/json', apikey:cfg.anonKey}, body:JSON.stringify({denominacion:val('p-denominacion'), clase:parseInt(val('p-clase')), titular:val('p-titular'), cuit:val('p-cuit'), email:val('p-email'), domicilio:val('p-dom'), localidad:val('p-loc'), observaciones:val('p-obs'), tipo:val('p-tipo'), logoBase64:logoB64})});
        const data=await resp.json();
        const out=document.getElementById('p-result');
        if(data.ok){ out.innerHTML=`<span style="color:var(--success)">✓ Presentada: Acta ${UI.escapeHtml(data.acta||'—')} — <a href="https://portaltramites.inpi.gob.ar/MarcasConsultas/Resultado?acta=${encodeURIComponent(data.acta)}" target="_blank" style="text-decoration:underline;">Ver en INPI ↗</a></span>`; UI.toast('Marca presentada','success'); }
        else{ out.innerHTML=`<span style="color:var(--danger)">✗ Error: ${UI.escapeHtml(data.error||'desconocido')}</span>`; UI.toast('Error presentando','error'); }
      } catch(e){ UI.toast('Error: '+e.message,'error'); } finally{ const b=document.getElementById('p-enviar-directo'); if(b){b.disabled=false; b.textContent='📨 Enviar directo al INPI';} }
    });
  }
  return { render };
})();
