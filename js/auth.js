const Auth = (() => {
  let _sb = null;
  function sb() {
    if (_sb) return _sb;
    const cfg = window.APP_CONFIG?.supabase;
    if (!cfg || !window.supabase) return null;
    _sb = window.supabase.createClient(cfg.url, cfg.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, storage: window.localStorage }
    });
    return _sb;
  }
  async function getSession() {
    const s = sb();
    if (!s) return null;
    const { data } = await s.auth.getSession();
    return data.session || null;
  }
  async function getUser() {
    const s = sb();
    if (!s) return null;
    const { data } = await s.auth.getUser();
    return data.user || null;
  }
  async function getPerfil() {
    const user = await getUser();
    if (!user) return null;
    try {
      const { data } = await sb().from('perfiles').select('*, estudios(nombre, limite_marcas)').eq('id', user.id).maybeSingle();
      return data;
    } catch { return null; }
  }
  async function getPerfilConEstudio() {
    const user = await getUser();
    if (!user) return { user: null, perfil: null, estudioId: null, rol: null };
    const perfil = await getPerfil();
    if (!perfil) return { user, perfil: null, estudioId: null, rol: null };
    return { user, perfil, estudioId: perfil.estudio_id, rol: perfil.rol };
  }
  async function login(email, password) {
    const { data, error } = await sb().auth.signInWithPassword({ email, password });
    if (error) throw error;
    localStorage.setItem('sb-remember', '1');
    return data;
  }
  async function logout() {
    await sb().auth.signOut();
    localStorage.removeItem('sb-remember');
    window.location.reload();
  }
  function renderLogin(containerId = 'view-login') {
    const view = document.getElementById(containerId) || document.getElementById('view-dashboard');
    if (!view) return;
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cssText = 'max-width:420px;margin:40px auto;';
    card.innerHTML = `
      <h3 style="margin-bottom:12px;">Iniciar sesión</h3>
      <div style="font-size:0.8125rem;color:var(--text-tertiary);margin-bottom:12px;">Usá el email y contraseña que te dio el admin. La sesión queda guardada en este navegador (cookies/localStorage) y se renueva automáticamente — no tenés que loguearte cada vez.</div>
      <div class="form-group"><label class="form-label">Email</label><input class="form-input" id="auth-email" placeholder="abogado@estudio.com" autocomplete="email"></div>
      <div class="form-group"><label class="form-label">Contraseña</label><input type="password" class="form-input" id="auth-pass" placeholder="••••••" autocomplete="current-password"></div>
      <label style="display:flex;align-items:center;gap:6px;margin:10px 0;font-size:0.8125rem;"><input type="checkbox" id="auth-remember" checked> Mantener sesión iniciada (30 días)</label>
      <button class="btn btn--primary" id="auth-btn-login" style="width:100%;">Entrar</button>
      <div id="auth-msg" style="margin-top:10px;font-size:0.8125rem;"></div>
      <div style="margin-top:16px; padding-top:12px; border-top:1px solid var(--border);">
        <div style="font-size:0.8125rem; font-weight:600; margin-bottom:6px;">¿Probás el sistema?</div>
        <div style="font-size:0.75rem; color:var(--text-tertiary); margin-bottom:8px;">Create tu cuenta demo (1 marca, vos ponés tu mail y clave, yo no te la doy). Después si querés más, me avisás y te lo amplío desde Admin.</div>
        <button class="btn btn--secondary btn--sm" id="auth-btn-demo" style="width:100%;">✨ Crear cuenta demo (1 marca)</button>
        <div id="auth-demo-form" style="display:none; margin-top:10px; padding:10px; background:var(--bg-main); border:1px solid var(--border); border-radius:6px;">
          <div class="form-group"><label class="form-label">Tu email *</label><input class="form-input" id="auth-demo-email" placeholder="tu@mail.com"></div>
          <div class="form-group"><label class="form-label">Tu contraseña *</label><input type="password" class="form-input" id="auth-demo-pass" placeholder="mín 6 caracteres"></div>
          <div class="form-group"><label class="form-label">Nombre de tu estudio *</label><input class="form-input" id="auth-demo-estudio" placeholder="Estudio Demo"></div>
          <button class="btn btn--primary btn--sm" id="auth-demo-submit" style="width:100%; margin-top:6px;">Crear mi demo</button>
          <div id="auth-demo-msg" style="margin-top:8px; font-size:0.75rem;"></div>
        </div>
      </div>
      <div style="margin-top:12px;font-size:0.75rem;color:var(--text-tertiary);">¿Olvidaste tu clave? Pedile al admin que te la resetee.</div>
    `;
    view.innerHTML = '';
    view.appendChild(card);
    document.getElementById('auth-btn-login')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-email').value.trim();
      const pass = document.getElementById('auth-pass').value;
      const msg = document.getElementById('auth-msg');
      if (!email || !pass) { msg.textContent = 'Faltan email/contraseña'; msg.style.color = 'var(--danger)'; return; }
      msg.textContent = 'Ingresando...'; msg.style.color = 'var(--text-tertiary)';
      try {
        await login(email, pass);
        msg.textContent = '✓ Sesión iniciada'; msg.style.color = 'var(--success)';
        setTimeout(()=> window.location.reload(), 800);
      } catch(e){ msg.textContent = '✗ ' + (e.message || 'error'); msg.style.color = 'var(--danger)'; }
    });
    document.getElementById('auth-btn-demo')?.addEventListener('click', () => {
      const f = document.getElementById('auth-demo-form');
      if (f) f.style.display = f.style.display === 'none' ? 'block' : 'none';
    });
    document.getElementById('auth-demo-submit')?.addEventListener('click', async () => {
      const email = document.getElementById('auth-demo-email').value.trim();
      const pass = document.getElementById('auth-demo-pass').value;
      const estudio = document.getElementById('auth-demo-estudio').value.trim();
      const msg = document.getElementById('auth-demo-msg');
      if (!email || !pass || !estudio) { msg.textContent = 'Faltan email, clave o estudio'; msg.style.color = 'var(--danger)'; return; }
      msg.textContent = 'Creando demo...'; msg.style.color = 'var(--text-tertiary)';
      try {
        const cfg = window.APP_CONFIG.supabase;
        const r = await fetch(`${cfg.url}/functions/v1/demo-signup`, { method:'POST', headers:{'Content-Type':'application/json', apikey: cfg.anonKey}, body: JSON.stringify({ email, password: pass, estudio_nombre: estudio })});
        const j = await r.json();
        if (!j.ok) throw new Error(j.error);
        msg.textContent = `✓ Demo creado! Ya podés entrar con ${email}`; msg.style.color = 'var(--success)';
        document.getElementById('auth-email').value = email;
        document.getElementById('auth-pass').value = pass;
        UI.toast('Demo creado, ahora ingresá', 'success');
      } catch(e){ msg.textContent = '✗ ' + (e.message || 'error'); msg.style.color = 'var(--danger)'; }
    });
  }
  async function initHeader() {
    const header = document.querySelector('.main-header__actions');
    if (!header) return;
    let session = null;
    try { session = await getSession(); } catch(e){ console.warn('getSession fail',e); }
    let perfil = null;
    if (session) {
      try { perfil = await getPerfil(); } catch(e){ console.warn('getPerfil fail',e); }
      if (!perfil && session.user?.email === 'benjamayapoceiro@gmail.com') {
        perfil = { rol: 'admin', email: session.user.email };
      }
    }
    const userEmail = session?.user?.email || null;
    if (session) {
      header.innerHTML = `<span style="font-size:0.8125rem;color:var(--text-secondary);">${UI.escapeHtml(userEmail)} ${perfil ? `<span class="badge ${perfil.rol==='admin'?'badge--warning':'badge--info'}">${perfil.rol}</span>` : '<span class="badge badge--info">usuario</span>'}</span> <button class="btn btn--ghost btn--sm" id="btn-logout">Salir</button>`;
      document.getElementById('btn-logout')?.addEventListener('click', logout);
      const navAdmin = document.getElementById('nav-admin');
      const navCarterasAdmin = document.getElementById('nav-carteras-admin');
      if (navAdmin) {
        const isAdmin = perfil && perfil.rol === 'admin';
        navAdmin.style.display = isAdmin ? 'flex' : 'none';
        if (navCarterasAdmin) navCarterasAdmin.style.display = isAdmin ? 'flex' : 'none';
        console.log('initHeader admin check', {email:userEmail, perfil, isAdmin});
      }
    } else {
      header.innerHTML = `<button class="btn btn--primary btn--sm" id="btn-login-header">Ingresar</button>`;
      document.getElementById('btn-login-header')?.addEventListener('click', () => { App.navigate('login'); renderLogin('view-login'); });
      const navAdmin = document.getElementById('nav-admin');
      const navCarterasAdmin = document.getElementById('nav-carteras-admin');
      if (navAdmin) navAdmin.style.display = 'none';
      if (navCarterasAdmin) navCarterasAdmin.style.display = 'none';
    }
  }
  return { sb, getSession, getUser, getPerfil, login, logout, renderLogin, initHeader };
})();
