const Admin = (() => {
  let estudios = [];
  async function loadEstudios() {
    const r = await API.request('/rest/v1/estudios?select=*&order=created_at.desc');
    estudios = r || [];
    return estudios;
  }
  async function render() {
    const view = document.getElementById('view-admin');
    if (!view) return;
    try {
      if (typeof window.supabase === 'undefined' && typeof Auth === 'undefined') {
        view.innerHTML = `<div class="card" style="text-align:center; padding:30px;"><h3>Cargando...</h3><p style="color:var(--text-tertiary)">Esperando Supabase CDN...</p></div>`;
        setTimeout(()=>render(), 800);
        return;
      }
      const user = await getCurrentUser();
      const isAdmin = user && user.perfil && user.perfil.rol === 'admin';
      if (!isAdmin) {
        const email = user?.user?.email || 'no logueado';
        view.innerHTML = `<div class="card" style="text-align:center; padding:40px;"><h3>Acceso restringido</h3><p style="color:var(--text-tertiary)">Solo el admin (benjamayapoceiro@gmail.com) puede ver esta pestaña.<br>Sesión actual: ${UI.escapeHtml(email)} ${user?.perfil ? `(${user.perfil.rol})` : '(sin perfil)'} </p><button class="btn btn--primary" onclick="Admin.mostrarLogin()">Iniciar sesión / Cambiar usuario</button><div style="margin-top:12px; font-size:0.75rem; color:var(--text-tertiary);">Si sos el admin y ves esto, hacé logout y volvé a entrar. Revisá consola F12 para debug.</div></div>`;
        return;
      }
      try { await loadEstudios(); } catch(e){ console.warn('loadEstudios fail',e); estudios = []; }
    view.innerHTML = `
      <div class="card" style="margin-bottom:20px;">
        <h3 style="margin-bottom:8px;">Crear estudio jurídico</h3>
        <div class="form-alta" style="grid-template-columns: 1fr 1fr 100px 120px;">
          <div class="form-group"><label class="form-label">Nombre estudio *</label><input class="form-input" id="adm-est-nombre" placeholder="Estudio Pérez & Asoc"></div>
          <div class="form-group"><label class="form-label">Email contacto</label><input class="form-input" id="adm-est-email" placeholder="contacto@estudio.com"></div>
          <div class="form-group"><label class="form-label">Límite marcas</label><input type="number" class="form-input" id="adm-est-limite" value="20" min="1"></div>
          <div class="form-group" style="align-self:end;"><button class="btn btn--primary" id="adm-btn-crear-estudio">＋ Crear estudio</button></div>
        </div>
      </div>
      <div class="card" style="margin-bottom:20px;">
        <h3 style="margin-bottom:8px;">Crear usuario para estudio</h3>
        <div class="form-alta" style="grid-template-columns: 1fr 1fr 1fr 100px;">
          <div class="form-group"><label class="form-label">Email usuario *</label><input class="form-input" id="adm-user-email" placeholder="abogado@estudio.com"></div>
          <div class="form-group"><label class="form-label">Contraseña *</label><input type="password" class="form-input" id="adm-user-pass" placeholder="mín 6 caracteres"></div>
          <div class="form-group"><label class="form-label">Estudio *</label><select class="form-select" id="adm-user-estudio">${estudios.map(e=>`<option value="${e.id}">${UI.escapeHtml(e.nombre)} (${e.limite_marcas} marcas)</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">Límite override</label><input type="number" class="form-input" id="adm-user-limite" placeholder="opcional"></div>
        </div>
        <div style="margin-top:12px;"><button class="btn btn--primary" id="adm-btn-crear-user">＋ Crear usuario</button></div>
        <div id="adm-user-result" style="margin-top:10px; font-size:0.8125rem;"></div>
      </div>
      <div class="card">
        <h3>Estudios existentes (${estudios.length})</h3>
        <table class="data-table" style="margin-top:10px;">
          <thead><tr><th>Nombre</th><th>Email</th><th>Plan</th><th>Límite</th><th>Creado</th></tr></thead>
          <tbody>${estudios.map(e=>`<tr><td>${UI.escapeHtml(e.nombre)}</td><td>${UI.escapeHtml(e.email_contacto||'—')}</td><td><span class="badge badge--info">${e.plan}</span></td><td>${e.limite_marcas}</td><td style="font-size:0.75rem;color:var(--text-tertiary)">${new Date(e.created_at).toLocaleDateString('es-AR')}</td></tr>`).join('')}</tbody>
        </table>
      </div>
      <div class="card" style="margin-top:20px;">
        <h3>Bóveda CUIT/Clave por estudio</h3>
        <div class="form-alta" style="grid-template-columns: 1fr 1fr 150px;">
          <div class="form-group"><label class="form-label">Estudio</label><select class="form-select" id="adm-boveda-estudio">${estudios.map(e=>`<option value="${e.id}">${UI.escapeHtml(e.nombre)}</option>`).join('')}</select></div>
          <div class="form-group"><label class="form-label">CUIT</label><input class="form-input" id="adm-boveda-cuit" placeholder="20450129896"></div>
          <div class="form-group"><label class="form-label">Clave Fiscal</label><input type="password" class="form-input" id="adm-boveda-clave" placeholder="••••••"></div>
        </div>
        <button class="btn btn--secondary" id="adm-btn-guardar-boveda" style="margin-top:10px;">💾 Guardar en bóveda (cifrada)</button>
        <div id="adm-boveda-result" style="margin-top:8px;font-size:0.8125rem;"></div>
      </div>
    `;
    document.getElementById('adm-btn-crear-estudio')?.addEventListener('click', crearEstudio);
    document.getElementById('adm-btn-crear-user')?.addEventListener('click', crearUsuario);
    document.getElementById('adm-btn-guardar-boveda')?.addEventListener('click', guardarBoveda);
    } catch(e){
      view.innerHTML = `<div class="card" style="text-align:center; padding:30px;"><h3>Error cargando Admin</h3><p style="color:var(--danger); font-size:0.8125rem;">${UI.escapeHtml(e.message)}</p><pre style="text-align:left; font-size:0.7rem; background:var(--bg-main); padding:8px; border-radius:6px; overflow:auto;">${UI.escapeHtml(e.stack||'')}</pre></div>`;
      console.error('Admin render error',e);
    }
  }
  async function getCurrentUser() {
    try {
      const sb = (typeof Auth !== 'undefined' && Auth.sb) ? Auth.sb() : (window.supabase ? window.supabase.createClient(window.APP_CONFIG.supabase.url, window.APP_CONFIG.supabase.anonKey) : null);
      if (!sb) return null;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return null;
      let perfil = null;
      try { perfil = await sb.from('perfiles').select('*').eq('id', user.id).maybeSingle().then(r=>r.data); } catch {}
      if (!perfil) {
        try { perfil = await API.request(`/rest/v1/perfiles?id=eq.${user.id}&select=*`).then(r=>r[0]).catch(()=>null); } catch {}
      }
      if (!perfil && user.email === 'benjamayapoceiro@gmail.com') perfil = { rol: 'admin', email: user.email };
      return { user, perfil };
    } catch { return null; }
  }
  async function crearEstudio() {
    const nombre = document.getElementById('adm-est-nombre')?.value.trim();
    const email = document.getElementById('adm-est-email')?.value.trim();
    const limite = parseInt(document.getElementById('adm-est-limite')?.value) || 20;
    if (!nombre) { UI.toast('Nombre requerido','error'); return; }
    try {
      await API.request('/rest/v1/estudios', { method:'POST', body: JSON.stringify({ nombre, email_contacto: email || null, limite_marcas: limite, plan: 'personalizado' }) });
      UI.toast('Estudio creado','success'); render();
    } catch(e){ UI.toast('Error: '+e.message,'error'); }
  }
  async function crearUsuario() {
    const email = document.getElementById('adm-user-email')?.value.trim();
    const password = document.getElementById('adm-user-pass')?.value;
    const estudio_id = document.getElementById('adm-user-estudio')?.value;
    const limite = document.getElementById('adm-user-limite')?.value ? parseInt(document.getElementById('adm-user-limite').value) : null;
    const out = document.getElementById('adm-user-result');
    if (!email || !password || !estudio_id) { UI.toast('Faltan campos','error'); return; }
    out.textContent = 'Creando...';
    try {
      const cfg = window.APP_CONFIG.supabase;
      const token = localStorage.getItem('sb-oomczohvjqycpuhhmotv-auth-token');
      let accessToken = null;
      try { const parsed = JSON.parse(token); accessToken = parsed.access_token; } catch {}
      const r = await fetch(`${cfg.url}/functions/v1/admin-create-user`, { method:'POST', headers:{'Content-Type':'application/json', apikey: cfg.anonKey, Authorization: `Bearer ${accessToken || cfg.anonKey}`}, body: JSON.stringify({ email, password, estudio_id, limite_marcas: limite })});
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      out.innerHTML = `<span style="color:var(--success)">✓ Usuario ${UI.escapeHtml(email)} creado (id ${j.user_id.slice(0,8)}...)</span>`;
      UI.toast('Usuario creado','success');
    } catch(e){ out.innerHTML = `<span style="color:var(--danger)">✗ ${UI.escapeHtml(e.message)}</span>`; }
  }
  async function guardarBoveda() {
    const estudio_id = document.getElementById('adm-boveda-estudio')?.value;
    const cuit = document.getElementById('adm-boveda-cuit')?.value.trim();
    const clave = document.getElementById('adm-boveda-clave')?.value;
    const out = document.getElementById('adm-boveda-result');
    if (!estudio_id || !cuit || !clave) { UI.toast('Faltan CUIT/clave','error'); return; }
    try {
      const res = await API.request('/rest/v1/rpc/guardar_credencial', { method:'POST', body: JSON.stringify({ p_estudio: estudio_id, p_cuit: cuit, p_clave: clave }) });
      out.innerHTML = `<span style="color:var(--success)">✓ Bóveda guardada con pgp_sym_encrypt (solo dueño+admin pueden leer)</span>`;
      UI.toast('Bóveda guardada (cifrada real)','success');
    } catch(e){ out.innerHTML = `<span style="color:var(--danger)">✗ ${UI.escapeHtml(e.message)}</span>`; }
  }
  function mostrarLogin(){ if (typeof Auth !== 'undefined' && Auth.renderLogin) { App.navigate('login'); Auth.renderLogin('view-login'); } else { window.location.hash = '#login'; } }
  return { render, loadEstudios, mostrarLogin };
})();
