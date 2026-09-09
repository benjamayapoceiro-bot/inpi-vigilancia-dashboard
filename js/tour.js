const Tour = (() => {
  const STORAGE_KEY = 'tour-completado';
  const pasos = [
    { view: 'dashboard', selector: '#header-title', titulo: 'Panel de Control', texto: 'Acá ves el panorama general: cuántas alertas tenés, cuántas requieren atención y cuándo es el próximo escaneo automático del Boletín.' },
    { view: 'alertas', selector: '#tbody-alertas', titulo: 'Alertas', texto: 'Acá aparecen las marcas nuevas del INPI parecidas a tu cartera. El color y el % te dicen el riesgo, y el borrador es solo un borrador — siempre revisalo antes de presentar nada.' },
    { view: 'cartera', selector: '#form-alta', titulo: 'Mi Cartera', texto: 'Cargá las marcas que querés vigilar: nombre, clase, tipo, cliente y estado. Respetá el límite de tu plan.' },
    { view: 'cartera', selector: '#table-cartera', titulo: 'Tu cartera', texto: 'Tu lista de marcas vigiladas. Podés filtrar, editar o borrar. Cada fila es una marca que el sistema cruza cada jueves.' },
    { view: 'busqueda', selector: '#bq-marca', titulo: 'Búsqueda Previa', texto: 'Antes de registrar una marca nueva, buscá antecedentes. Te sugerimos clases de Niza y generás un PDF para mandarle al cliente.' },
    { view: 'busqueda', selector: '#btn-buscar-historico', titulo: 'Histórico vs INPI en vivo', texto: 'Buscá en las 44k actas ya procesadas o consultá directo al INPI en vivo. Después agregás las coincidencias al informe.' },
    { view: 'crm', selector: '#crm-board', titulo: 'CRM', texto: 'Seguimiento de cada expediente: en qué estado está y su historial. Acá ves si pasó a Registrada, En oposición, etc.' },
    { view: 'admin', selector: '#view-admin', titulo: 'Admin (solo vos)', texto: 'Acá creás estudios y usuarios, ves estudios existentes y guardás las credenciales del INPI de cada estudio.', adminOnly: true },
    { view: 'carteras-admin', selector: '#table-carteras-admin', titulo: 'Todas las carteras (admin)', texto: 'Vista de auditoría: todas las marcas de todos los estudios, con columna Estudio. Solo lectura.', adminOnly: true },
  ];
  let idx = 0;
  let overlay = null;
  let card = null;
  function isAdmin() {
    try { const p = JSON.parse(localStorage.getItem('sb-oomczohvjqycpuhhmotv-auth-token')||'{}'); return false; } catch { return false; }
  }
  async function esAdminReal() {
    try {
      const sb = (typeof Auth !== 'undefined' && Auth.sb) ? Auth.sb() : null;
      if (!sb) return false;
      const { data: { user } } = await sb.auth.getUser();
      if (!user) return false;
      const { data } = await sb.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
      return data && data.rol === 'admin';
    } catch { return false; }
  }
  function getPasosFiltrados(esAdmin) {
    return pasos.filter(p => !p.adminOnly || esAdmin);
  }
  function crearOverlay() {
    overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9998;';
    overlay.addEventListener('click', () => saltar());
    document.body.appendChild(overlay);
  }
  function crearCard() {
    card = document.createElement('div');
    card.style.cssText = 'position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:16px 20px; max-width:420px; width:90%; z-index:9999; box-shadow:0 10px 30px rgba(0,0,0,0.2);';
    document.body.appendChild(card);
  }
  function resaltar(selector) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.style.position = 'relative';
    el.style.zIndex = '9999';
    el.style.boxShadow = '0 0 0 3px #0f3a5f, 0 0 20px rgba(15,58,95,0.5)';
    el.style.borderRadius = '6px';
    setTimeout(()=> { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 100);
  }
  function quitarResaltado() {
    document.querySelectorAll('[style*="box-shadow: 0 0 0 3px"]').forEach(el => {
      el.style.boxShadow = '';
      el.style.zIndex = '';
      el.style.position = '';
    });
  }
  async function mostrarPaso(i) {
    const esAdmin = await esAdminReal();
    const lista = getPasosFiltrados(esAdmin);
    if (i < 0 || i >= lista.length) { terminar(); return; }
    idx = i;
    const paso = lista[idx];
    quitarResaltado();
    App.navigate(paso.view);
    setTimeout(() => {
      resaltar(paso.selector);
      if (!card) crearCard();
      card.innerHTML = `
        <div style="font-size:0.75rem; color:var(--text-tertiary);">Paso ${idx+1} de ${lista.length}</div>
        <div style="font-weight:700; margin:6px 0;">${paso.titulo}</div>
        <div style="font-size:0.875rem; color:var(--text-secondary); line-height:1.4;">${paso.texto}</div>
        <div style="display:flex; gap:8px; margin-top:12px; justify-content:space-between;">
          <button class="btn btn--ghost btn--sm" id="tour-saltar">Saltar tutorial</button>
          <div style="display:flex; gap:8px;">
            <button class="btn btn--ghost btn--sm" id="tour-anterior" ${idx===0?'disabled':''}>Anterior</button>
            <button class="btn btn--primary btn--sm" id="tour-siguiente">${idx===lista.length-1?'Terminar':'Siguiente'}</button>
          </div>
        </div>
      `;
      document.getElementById('tour-saltar')?.addEventListener('click', saltar);
      document.getElementById('tour-anterior')?.addEventListener('click', () => mostrarPaso(idx-1));
      document.getElementById('tour-siguiente')?.addEventListener('click', () => {
        if (idx === lista.length-1) terminar();
        else mostrarPaso(idx+1);
      });
    }, 300);
  }
  function saltar() {
    quitarResaltado();
    if (overlay) overlay.remove(); overlay=null;
    if (card) card.remove(); card=null;
    localStorage.setItem(STORAGE_KEY, '1');
  }
  function terminar() {
    saltar();
    localStorage.setItem(STORAGE_KEY, '1');
    UI.toast('¡Tour completado! Podés relanzarlo con ❓ Tutorial', 'success');
  }
  function iniciar() {
    if (!overlay) crearOverlay();
    if (!card) crearCard();
    mostrarPaso(0);
  }
  function debeMostrarAuto() {
    return !localStorage.getItem(STORAGE_KEY);
  }
  return { iniciar, debeMostrarAuto, saltar };
})();
