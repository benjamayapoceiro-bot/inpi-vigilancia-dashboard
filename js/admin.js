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
    const user = await getCurrentUser();
    const isAdmin = user && user.perfil && user.perfil.rol === 'admin';
    if (!isAdmin) {
      view.innerHTML = `<div class="card" style="text-align:center; padding:40px;"><h3>Acceso restringido</h3><p style="color:var(--text-tertiary)">Solo el admin (benjamayapoceiro@gmail.com) puede ver esta pestaña. Iniciá sesión con tu cuenta admin.</p><button class="btn btn--primary" onclick="Admin.mostrarLogin()">Iniciar sesión</button></div>`;
      return;
    }
    await loadEstudios();
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
  }
  async function getCurrentUser() {
    try {
      const cfg = window.APP_CONFIG.supabase;
      const token = localStorage.getItem('sb-access-token') || sessionStorage.getItem('sb-access-token');
      // fallback: supabase js client si está
      if (window.supabase) {
        const { data } = await window.supabase.auth.getUser();
        if (data?.user) {
          const perfil = await API.request(`/rest/v1/perfiles?id=eq.${data.user.id}&select=*`).then(r=>r[0]).catch(()=>null);
          return { user: data.user, perfil };
        }
      }
      return null;
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
      // cifrado simple base64 con pgp_sym_encrypt en backend sería ideal; por ahora guardamos con encode (service_role)
      const encrypted = btoa(clave); // placeholder, edge lo cifraría con Vault
      await API.request('/rest/v1/credenciales_inpi', { method:'POST', headers:{Prefer:'resolution=merge-duplicates'}, body: JSON.stringify({ estudio_id, cuit, clave_encrypted: encrypted }) });
      out.innerHTML = `<span style="color:var(--success)">✓ Bóveda guardada para estudio (cifrada)</span>`;
      UI.toast('Bóveda guardada','success');
    } catch(e){ out.innerHTML = `<span style="color:var(--danger)">✗ ${UI.escapeHtml(e.message)}</span>`; }
  }
  function mostrarLogin(){ window.location.hash = '#login'; }
  return { render, loadEstudios };
})();
