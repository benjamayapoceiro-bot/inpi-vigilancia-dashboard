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
  }
  async function initHeader() {
    const header = document.querySelector('.main-header__actions');
    if (!header) return;
    const session = await getSession();
    const perfil = session ? await getPerfil() : null;
    const userEmail = session?.user?.email || null;
    if (session) {
      header.innerHTML = `<span style="font-size:0.8125rem;color:var(--text-secondary);">${UI.escapeHtml(userEmail)} ${perfil ? `<span class="badge ${perfil.rol==='admin'?'badge--warning':'badge--info'}">${perfil.rol}</span>` : ''}</span> <button class="btn btn--ghost btn--sm" id="btn-logout">Salir</button>`;
      document.getElementById('btn-logout')?.addEventListener('click', logout);
      const navAdmin = document.getElementById('nav-admin');
      if (navAdmin) navAdmin.style.display = (perfil && perfil.rol === 'admin') ? 'flex' : 'none';
    } else {
      header.innerHTML = `<button class="btn btn--primary btn--sm" id="btn-login-header">Ingresar</button>`;
      document.getElementById('btn-login-header')?.addEventListener('click', () => { App.navigate('login'); renderLogin('view-login'); });
    }
  }
  return { sb, getSession, getUser, getPerfil, login, logout, renderLogin, initHeader };
})();
